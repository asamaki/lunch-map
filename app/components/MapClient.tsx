import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Restaurant } from '~/types/restaurant';

// Fix for default markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapClientProps {
  restaurants: Restaurant[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
  center?: [number, number];
  zoom?: number;
}

export function MapClient({ restaurants, onRestaurantClick, center = [35.6762, 139.6503], zoom = 11 }: MapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add restaurant markers
    restaurants.forEach(restaurant => {
      if (!mapInstanceRef.current) return;

      // Create custom icon based on status
      const iconClass = restaurant.is_open ? 'open' : 'closed';
      const crowdednessColor = 
        restaurant.crowdedness_level === 'empty' ? '#22c55e' :
        restaurant.crowdedness_level === 'crowded' ? '#ef4444' : '#f59e0b';

      const customIcon = L.divIcon({
        html: `
          <div class="restaurant-marker ${iconClass}" style="border-color: ${crowdednessColor}">
            <div class="marker-inner" style="background-color: ${crowdednessColor}">
              ${getEmoji(restaurant.cuisine_type)}
            </div>
          </div>
        `,
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      });

      const marker = L.marker([restaurant.latitude, restaurant.longitude], {
        icon: customIcon
      });

      // Create popup content
      const popupContent = `
        <div class="popup-content">
          <h3 class="font-bold text-lg mb-2">${restaurant.name}</h3>
          <p class="text-sm text-gray-600 mb-1">
            <span class="inline-block w-4">📍</span> ${restaurant.address}
          </p>
          <p class="text-sm mb-1">
            <span class="inline-block w-4">🍽️</span> ${restaurant.cuisine_type}
          </p>
          <p class="text-sm mb-1">
            <span class="inline-block w-4">💰</span> ${getPriceDisplay(restaurant.price_range)}
          </p>
          ${restaurant.opening_hours ? `
            <p class="text-sm mb-1">
              <span class="inline-block w-4">🕒</span> ${restaurant.opening_hours}
            </p>
          ` : ''}
          <div class="flex items-center gap-2 mt-2">
            <span class="px-2 py-1 rounded text-xs ${restaurant.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
              ${restaurant.is_open ? '営業中' : '営業時間外'}
            </span>
            <span class="px-2 py-1 rounded text-xs ${getCrowdednessStyle(restaurant.crowdedness_level)}">
              ${getCrowdednessText(restaurant.crowdedness_level)}
            </span>
          </div>
          <button onclick="window.viewRestaurant(${restaurant.id})" class="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
            詳細を見る
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      marker.on('click', () => {
        if (onRestaurantClick) {
          onRestaurantClick(restaurant);
        }
      });

      marker.addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(marker => {
        mapInstanceRef.current?.removeLayer(marker);
      });
      markersRef.current = [];
    };
  }, [restaurants, onRestaurantClick, center, zoom]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div ref={mapRef} className="w-full h-full" />
      <style jsx>{`
        .custom-marker {
          background: none !important;
          border: none !important;
        }
        .restaurant-marker {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .marker-inner {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
        .restaurant-marker.closed {
          opacity: 0.6;
        }
        .popup-content {
          min-width: 250px;
        }
        .custom-popup .leaflet-popup-content {
          margin: 12px !important;
        }
      `}</style>
    </>
  );
}

function getEmoji(cuisineType: string): string {
  const emojiMap: { [key: string]: string } = {
    '和食': '🍣',
    '中華': '🍜',
    'イタリアン': '🍝',
    'フレンチ': '🥐',
    'カフェ': '☕',
    '洋食': '🍽️',
    'ファストフード': '🍔',
    'インド料理': '🍛',
    '韓国料理': '🥢',
    'タイ料理': '🌶️'
  };
  return emojiMap[cuisineType] || '🍽️';
}

function getPriceDisplay(priceRange: string): string {
  const priceMap: { [key: string]: string } = {
    'low': '～1,000円',
    'medium': '1,000～2,000円',
    'high': '2,000円～'
  };
  return priceMap[priceRange] || priceRange;
}

function getCrowdednessStyle(level?: string): string {
  const styleMap: { [key: string]: string } = {
    'empty': 'bg-green-100 text-green-800',
    'moderate': 'bg-yellow-100 text-yellow-800',
    'crowded': 'bg-red-100 text-red-800'
  };
  return styleMap[level || 'moderate'];
}

function getCrowdednessText(level?: string): string {
  const textMap: { [key: string]: string } = {
    'empty': '空いている',
    'moderate': 'やや混雑',
    'crowded': '混雑'
  };
  return textMap[level || 'moderate'];
}