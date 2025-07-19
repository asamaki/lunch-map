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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-800">
                🍽️ ランチマップ
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden bg-blue-600 text-white px-4 py-2 rounded"
              >
                {sidebarOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`
          w-full md:w-80 bg-white shadow-lg z-20 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          absolute md:relative h-full
        `}>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-4">検索・絞り込み</h2>
            
            {/* Filters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  料理ジャンル
                </label>
                <select
                  value={filters.cuisineType || ''}
                  onChange={(e) => handleFilterChange({...filters, cuisineType: e.target.value || undefined})}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="和食">和食</option>
                  <option value="中華">中華</option>
                  <option value="イタリアン">イタリアン</option>
                  <option value="フレンチ">フレンチ</option>
                  <option value="カフェ">カフェ</option>
                  <option value="洋食">洋食</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  価格帯
                </label>
                <select
                  value={filters.priceRange || ''}
                  onChange={(e) => handleFilterChange({...filters, priceRange: e.target.value || undefined})}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="low">～1,000円</option>
                  <option value="medium">1,000～2,000円</option>
                  <option value="high">2,000円～</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  営業状況
                </label>
                <select
                  value={filters.isOpen === undefined ? '' : String(filters.isOpen)}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange({
                      ...filters, 
                      isOpen: value === '' ? undefined : value === 'true'
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="true">営業中</option>
                  <option value="false">営業時間外</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  混雑状況
                </label>
                <select
                  value={filters.crowdedness || ''}
                  onChange={(e) => handleFilterChange({...filters, crowdedness: e.target.value || undefined})}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="empty">空いている</option>
                  <option value="moderate">やや混雑</option>
                  <option value="crowded">混雑</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setFilters({});
                  setRestaurants(initialRestaurants);
                }}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
              >
                フィルターをクリア
              </button>
            </div>
          </div>

          {/* Restaurant List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-semibold mb-3">
              検索結果 ({restaurants.length}件)
            </h3>
            <div className="space-y-3">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => handleRestaurantClick(restaurant)}
                  className={`
                    p-3 border rounded-lg cursor-pointer transition-colors hover:bg-blue-50
                    ${selectedRestaurant?.id === restaurant.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                  `}
                >
                  <h4 className="font-medium text-sm">{restaurant.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{restaurant.cuisine_type}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${restaurant.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {restaurant.is_open ? '営業中' : '営業時間外'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getCrowdednessStyle(restaurant.crowdedness_level)}`}>
                      {getCrowdednessText(restaurant.crowdedness_level)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map 
            restaurants={restaurants}
            onRestaurantClick={handleRestaurantClick}
            center={[35.6762, 139.6503]} // Tokyo center
            zoom={11}
          />
          
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

function getCrowdednessText(level?: string): string {
  const textMap: { [key: string]: string } = {
    'empty': '空いている',
    'moderate': 'やや混雑',
    'crowded': '混雑'
  };
  return textMap[level || 'moderate'];
}