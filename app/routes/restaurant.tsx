import type { Route } from "./+types/restaurant";
import { useLoaderData, Link } from "react-router";
import type { Restaurant } from "~/types/restaurant";

export async function loader({ params }: Route.LoaderArgs) {
  // Dynamic import to avoid client-side bundling
  const { getRestaurantById } = await import("~/lib/db.server");
  
  const id = parseInt(params.id);
  if (isNaN(id)) {
    throw new Response("Invalid restaurant ID", { status: 400 });
  }
  
  const restaurant = await getRestaurantById(id);
  if (!restaurant) {
    throw new Response("Restaurant not found", { status: 404 });
  }
  
  return { restaurant };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.restaurant) {
    return [
      { title: "店舗が見つかりません - ランチマップ" },
    ];
  }
  
  const restaurant = data.restaurant;
  return [
    { title: `${restaurant.name} - ランチマップ` },
    { name: "description", content: `${restaurant.name}の詳細情報。${restaurant.address}にある${restaurant.cuisine_type}のお店です。` },
  ];
}

export default function RestaurantPage() {
  const { restaurant } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-gray-800">
              🍽️ ランチマップ
            </Link>
            <Link
              to="/map"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              地図に戻る
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link to="/" className="hover:text-blue-600">ホーム</Link></li>
            <li>/</li>
            <li><Link to="/map" className="hover:text-blue-600">地図</Link></li>
            <li>/</li>
            <li className="text-gray-900">{restaurant.name}</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Restaurant Image Placeholder */}
          <div className="h-64 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-6xl mb-4">{getEmoji(restaurant.cuisine_type)}</div>
              <p className="text-lg opacity-90">写真準備中</p>
            </div>
          </div>

          <div className="p-6">
            {/* Basic Info */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {restaurant.cuisine_type}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {getPriceDisplay(restaurant.price_range)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${restaurant.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {restaurant.is_open ? '営業中' : '営業時間外'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCrowdednessStyle(restaurant.crowdedness_level)}`}>
                  {getCrowdednessText(restaurant.crowdedness_level)}
                </span>
              </div>
              {restaurant.description && (
                <p className="text-gray-700 leading-relaxed">{restaurant.description}</p>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact & Location */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">店舗情報</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-gray-500 w-6 mt-1">📍</span>
                    <div>
                      <p className="text-gray-900">{restaurant.address}</p>
                    </div>
                  </div>
                  
                  {restaurant.phone && (
                    <div className="flex items-center">
                      <span className="text-gray-500 w-6">📞</span>
                      <a 
                        href={`tel:${restaurant.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {restaurant.phone}
                      </a>
                    </div>
                  )}

                  {restaurant.opening_hours && (
                    <div className="flex items-start">
                      <span className="text-gray-500 w-6 mt-1">🕒</span>
                      <div>
                        <p className="text-gray-900">{restaurant.opening_hours}</p>
                      </div>
                    </div>
                  )}

                  {restaurant.capacity && (
                    <div className="flex items-center">
                      <span className="text-gray-500 w-6">👥</span>
                      <p className="text-gray-900">約{restaurant.capacity}席</p>
                    </div>
                  )}

                  {restaurant.website && (
                    <div className="flex items-center">
                      <span className="text-gray-500 w-6">🌐</span>
                      <a 
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        公式サイト
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Map */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">アクセス</h2>
                <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p>詳細地図</p>
                    <p className="text-sm mt-1">
                      緯度: {restaurant.latitude.toFixed(6)}<br />
                      経度: {restaurant.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                  >
                    Google Mapsで開く
                  </a>
                  <Link
                    to="/map"
                    className="block w-full bg-gray-600 text-white text-center py-2 px-4 rounded hover:bg-gray-700 transition-colors"
                  >
                    ランチマップで表示
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">混雑状況について</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  混雑状況は推定値です。実際の状況と異なる場合があります。<br />
                  最新の情報については店舗に直接お問い合わせください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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