// Shared types that can be used on both client and server
export interface Restaurant {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  cuisine_type: string;
  price_range: string;
  phone?: string;
  opening_hours?: string;
  website?: string;
  photo_url?: string;
  description?: string;
  capacity?: number;
  is_open?: boolean;
  crowdedness_level?: 'empty' | 'moderate' | 'crowded';
  created_at: string;
  updated_at: string;
  // v2.0 新規フィールド
  photos?: string; // JSON配列形式の写真URL
  features?: string; // 店舗の特徴・雰囲気
  popular_menu?: string; // 人気メニューと価格
  access_info?: string; // アクセス情報
  area?: string; // エリア（新宿、渋谷、池袋など）
  lunch_hours?: string; // ランチ営業時間
  closed_days?: string; // 定休日
  average_budget?: number; // 平均予算
  rating?: number; // 評価（1-5）
  review_count?: number; // レビュー数
}

export interface RestaurantPhoto {
  url: string;
  alt: string;
  type: 'exterior' | 'interior' | 'food' | 'menu';
}

export interface RestaurantFilters {
  cuisineType?: string;
  priceRange?: string;
  isOpen?: boolean;
  crowdedness?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
}