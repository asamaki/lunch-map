import type { Route } from "./+types/map";
import { useLoaderData, Link } from "react-router";
import { useState, useEffect } from "react";
import type { Restaurant, RestaurantFilters } from "~/types/restaurant";
import { Map } from "~/components/Map";

export async function loader() {
  // Dynamic import to avoid client-side bundling
  const { getRestaurants, initDatabase, insertSampleData } = await import("~/lib/db.server");
  
  // Initialize database and insert sample data if needed
  await initDatabase();
  
  // Check if we have any restaurants, if not, insert sample data
  const existingRestaurants = await getRestaurants();
  if (existingRestaurants.length === 0) {
    await insertSampleData();
  }
  
  const restaurants = await getRestaurants();
  return { restaurants };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "地図 - ランチマップ" },
    { name: "description", content: "東京都内のランチスポットを地図で検索・表示" },
  ];
}

export default function MapPage() {
  const { restaurants: initialRestaurants } = useLoaderData<typeof loader>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<RestaurantFilters>({});

  // Make viewRestaurant available globally for popup buttons
  useEffect(() => {
    (window as any).viewRestaurant = (id: number) => {
      const restaurant = restaurants.find(r => r.id === id);
      if (restaurant) {
        setSelectedRestaurant(restaurant);
        setSidebarOpen(true);
      }
    };

    return () => {
      delete (window as any).viewRestaurant;
    };
  }, [restaurants]);

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setSidebarOpen(true);
  };

  const handleFilterChange = async (newFilters: RestaurantFilters) => {
    setFilters(newFilters);
    // In a real app, this would make an API call
    // For now, we'll filter on the client side
    let filteredRestaurants = initialRestaurants;

    if (newFilters.cuisineType) {
      filteredRestaurants = filteredRestaurants.filter(r => r.cuisine_type === newFilters.cuisineType);
    }
    if (newFilters.priceRange) {
      filteredRestaurants = filteredRestaurants.filter(r => r.price_range === newFilters.priceRange);
    }
    if (newFilters.isOpen !== undefined) {
      filteredRestaurants = filteredRestaurants.filter(r => r.is_open === newFilters.isOpen);
    }
    if (newFilters.crowdedness) {
      filteredRestaurants = filteredRestaurants.filter(r => r.crowdedness_level === newFilters.crowdedness);
    }

    setRestaurants(filteredRestaurants);
  };

  return (
    <div className="h-screen flex flex-col bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b z-30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <Link to="/" className="text-lg font-bold text-secondary-800 font-heading">
                🍽️ ランチマップ
              </Link>
            </div>
            
            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="お店を検索"
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-secondary-50"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-full hover:bg-secondary-100 transition-colors"
              >
                <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Simplified Sidebar for Filters */}
        <div className={`
          w-full md:w-80 bg-white shadow-lg z-20 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          absolute md:relative h-full
        `}>
          {/* Filter Header */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-secondary-800">絞り込み</h2>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1 rounded-full hover:bg-secondary-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Quick Filter Chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {['和食', 'イタリアン', 'カフェ', '中華'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange({...filters, cuisineType: filters.cuisineType === type ? undefined : type})}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.cuisineType === type 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            {/* Clear All */}
            {(filters.cuisineType || filters.priceRange || filters.isOpen !== undefined || filters.crowdedness) && (
              <button
                onClick={() => {
                  setFilters({});
                  setRestaurants(initialRestaurants);
                }}
                className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                すべてクリア
              </button>
            )}
          </div>

          {/* Restaurant List */}
          <div className="flex-1 overflow-y-auto bg-secondary-50">
            <div className="p-3 bg-white border-b">
              <h3 className="text-sm font-medium text-secondary-700">
                {restaurants.length}件のお店
              </h3>
            </div>
            
            <div className="space-y-0">
              {restaurants.map((restaurant) => {
                // Parse photos
                let photos = [];
                try {
                  photos = restaurant.photos ? JSON.parse(restaurant.photos) : [];
                } catch (e) {
                  photos = [];
                }
                const mainPhoto = photos.length > 0 ? photos[0] : null;
                
                return (
                  <div
                    key={restaurant.id}
                    onClick={() => handleRestaurantClick(restaurant)}
                    className={`
                      bg-white border-b border-secondary-200 cursor-pointer transition-all hover:bg-secondary-50
                      ${selectedRestaurant?.id === restaurant.id ? 'bg-primary-50 border-primary-200' : ''}
                    `}
                  >
                    <div className="p-3">
                      <div className="flex">
                        {/* Restaurant Photo */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary-200 flex-shrink-0">
                          {mainPhoto ? (
                            <img 
                              src={mainPhoto.url} 
                              alt={mainPhoto.alt}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-secondary-400">
                              🍽️
                            </div>
                          )}
                        </div>
                        
                        {/* Restaurant Info */}
                        <div className="ml-3 flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-secondary-900 truncate">
                            {restaurant.name}
                          </h4>
                          
                          {/* Rating & Reviews */}
                          {restaurant.rating && (
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-amber-500">★{restaurant.rating}</span>
                              <span className="text-xs text-secondary-500 ml-1">
                                ({restaurant.review_count || 0})
                              </span>
                            </div>
                          )}
                          
                          {/* Tags */}
                          <div className="flex items-center gap-1 mt-1">
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                              {restaurant.cuisine_type}
                            </span>
                            <span className="px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded text-xs">
                              {getPriceDisplay(restaurant.price_range)}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              restaurant.is_open 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {restaurant.is_open ? '営業中' : '営業時間外'}
                            </span>
                          </div>
                          
                          {/* Access Info */}
                          {restaurant.access_info && (
                            <p className="text-xs text-secondary-500 mt-1 truncate">
                              🚶 {restaurant.access_info}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {restaurants.length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-secondary-600">条件に合うお店が見つかりませんでした</p>
                  <button
                    onClick={() => {
                      setFilters({});
                      setRestaurants(initialRestaurants);
                    }}
                    className="mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    フィルターをクリア
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map 
            restaurants={restaurants}
            onRestaurantClick={handleRestaurantClick}
            center={[35.6762, 139.6503]} // Tokyo center
            zoom={12}
          />
          
          {/* Map Controls */}
          <div className="absolute bottom-6 right-6 z-10 space-y-3">
            {/* Current Location Button */}
            <button
              onClick={() => {
                // Get user's current location
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    // Center map on user location
                    console.log('Current position:', position.coords);
                  });
                }
              }}
              className="w-12 h-12 bg-white rounded-full shadow-card hover:shadow-card-hover transition-shadow flex items-center justify-center border border-secondary-200"
              title="現在地を表示"
            >
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {/* Filter Toggle for Mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-12 h-12 bg-primary-600 rounded-full shadow-card hover:shadow-card-hover transition-shadow flex items-center justify-center"
              title="絞り込み"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
          
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div 
              className="md:hidden absolute inset-0 bg-black bg-opacity-50 z-10"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function getCrowdednessStyle(level?: string): string {
  const styleMap: { [key: string]: string } = {
    'empty': 'bg-green-100 text-green-800',
    'moderate': 'bg-yellow-100 text-yellow-800',
    'crowded': 'bg-red-100 text-red-800'
  };
  return styleMap[level || 'moderate'];
}

function getPriceDisplay(priceRange: string): string {
  const priceMap: { [key: string]: string } = {
    'low': '～1,000円',
    'medium': '1,000～2,000円',
    'high': '2,000円～'
  };
  return priceMap[priceRange] || priceRange;
}

function getCrowdednessText(level?: string): string {
  const textMap: { [key: string]: string } = {
    'empty': '空いている',
    'moderate': 'やや混雑',
    'crowded': '混雑'
  };
  return textMap[level || 'moderate'];
}