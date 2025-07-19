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