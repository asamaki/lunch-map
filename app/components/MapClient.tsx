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

      // Add Japanese OpenStreetMap tiles
      L.tileLayer('https://tile.openstreetmap.jp/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors, © OpenStreetMap Japan'
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
          <div class="restaurant-marker-v2 ${iconClass}">
            <div class="marker-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.20-1.10-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12.88 11.53z"/>
              </svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 2px;">
                <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7z"/>
              </svg>
            </div>
          </div>
        `,
        className: 'custom-marker-v2',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      const marker = L.marker([restaurant.latitude, restaurant.longitude], {
        icon: customIcon
      });

      // Parse photos if available
      let photos = [];
      try {
        photos = restaurant.photos ? JSON.parse(restaurant.photos) : [];
      } catch (e) {
        photos = [];
      }
      
      const mainPhoto = photos.length > 0 ? photos[0] : null;
      
      // Create popup content with food app style
      const popupContent = `
        <div class="popup-content-v2">
          ${mainPhoto ? `
            <div class="restaurant-photo" style="background-image: url('${mainPhoto.url}')">
              <div class="photo-overlay">
                ${restaurant.rating ? `
                  <div class="rating-badge">
                    <span class="rating-score">★${restaurant.rating}</span>
                    <span class="review-count">(${restaurant.review_count || 0})</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <div class="restaurant-info">
            <h3 class="restaurant-name">${restaurant.name}</h3>
            
            <div class="restaurant-tags">
              <span class="tag cuisine-tag">${restaurant.cuisine_type}</span>
              <span class="tag price-tag">${getPriceDisplay(restaurant.price_range)}</span>
              <span class="tag status-tag ${restaurant.is_open ? 'open' : 'closed'}">
                ${restaurant.is_open ? '営業中' : '営業時間外'}
              </span>
            </div>
            
            ${restaurant.features ? `
              <p class="restaurant-description">${restaurant.features}</p>
            ` : ''}
            
            ${restaurant.popular_menu ? `
              <div class="popular-menu">
                <span class="menu-label">人気メニュー</span>
                <span class="menu-text">${restaurant.popular_menu}</span>
              </div>
            ` : ''}
            
            ${restaurant.access_info ? `
              <div class="access-info">
                <span class="access-icon">🚶</span>
                <span class="access-text">${restaurant.access_info}</span>
              </div>
            ` : ''}
            
            <button onclick="window.viewRestaurant(${restaurant.id})" class="view-detail-btn">
              店舗詳細を見る
            </button>
          </div>
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
        .custom-marker-v2 {
          background: none !important;
          border: none !important;
        }
        .restaurant-marker-v2 {
          width: 36px;
          height: 36px;
          background: #FF6B35;
          border-radius: 18px 18px 18px 4px;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .restaurant-marker-v2:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0,0,0,0.3);
        }
        .marker-icon {
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .restaurant-marker-v2.closed {
          opacity: 0.7;
          background: #94a3b8;
        }
        .popup-content {
          min-width: 280px;
          max-width: 320px;
          font-family: 'Hiragino Kaku Gothic ProN', sans-serif;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0 !important;
          padding: 0 !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        
        /* v2.0 Popup Styles */
        .popup-content-v2 {
          width: 300px;
          font-family: 'Hiragino Kaku Gothic ProN', sans-serif;
        }
        
        .restaurant-photo {
          width: 100%;
          height: 140px;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        
        .photo-overlay {
          position: absolute;
          bottom: 8px;
          right: 8px;
        }
        
        .rating-badge {
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .rating-score {
          color: #FFD700;
          font-weight: bold;
        }
        
        .restaurant-info {
          padding: 12px;
        }
        
        .restaurant-name {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin: 0 0 8px 0;
          line-height: 1.3;
        }
        
        .restaurant-tags {
          display: flex;
          gap: 6px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        
        .tag {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .cuisine-tag {
          background: #FF6B35;
          color: white;
        }
        
        .price-tag {
          background: #F3F4F6;
          color: #6B7280;
        }
        
        .status-tag.open {
          background: #D1FAE5;
          color: #065F46;
        }
        
        .status-tag.closed {
          background: #FEE2E2;
          color: #991B1B;
        }
        
        .restaurant-description {
          font-size: 12px;
          color: #6B7280;
          line-height: 1.4;
          margin: 8px 0;
        }
        
        .popular-menu {
          background: #FFF7ED;
          border: 1px solid #FDBA74;
          border-radius: 6px;
          padding: 6px 8px;
          margin: 8px 0;
        }
        
        .menu-label {
          font-size: 10px;
          color: #EA580C;
          font-weight: bold;
          display: block;
        }
        
        .menu-text {
          font-size: 11px;
          color: #9A3412;
        }
        
        .access-info {
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 8px 0;
          font-size: 11px;
          color: #6B7280;
        }
        
        .view-detail-btn {
          width: 100%;
          background: #FF6B35;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 12px;
          transition: background-color 0.2s;
        }
        
        .view-detail-btn:hover {
          background: #E63E00;
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