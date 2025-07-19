import { createClient } from '@libsql/client';
import type { Restaurant, RestaurantFilters } from '~/types/restaurant';

// Turso Cloud database configuration
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize database schema
export async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      cuisine_type TEXT NOT NULL,
      price_range TEXT NOT NULL CHECK (price_range IN ('low', 'medium', 'high')),
      phone TEXT,
      opening_hours TEXT,
      website TEXT,
      photo_url TEXT,
      description TEXT,
      capacity INTEGER,
      is_open BOOLEAN DEFAULT false,
      crowdedness_level TEXT DEFAULT 'moderate' CHECK (crowdedness_level IN ('empty', 'moderate', 'crowded')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants (latitude, longitude)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants (cuisine_type)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_restaurants_price ON restaurants (price_range)
  `);
}

// Get all restaurants
export async function getRestaurants() {
  const result = await db.execute('SELECT * FROM restaurants ORDER BY name');
  return result.rows as Restaurant[];
}

// Get restaurants by filters
export async function getRestaurantsByFilters(filters: RestaurantFilters) {
  let query = 'SELECT * FROM restaurants WHERE 1=1';
  const params: any[] = [];

  if (filters.cuisineType) {
    query += ' AND cuisine_type = ?';
    params.push(filters.cuisineType);
  }

  if (filters.priceRange) {
    query += ' AND price_range = ?';
    params.push(filters.priceRange);
  }

  if (filters.isOpen !== undefined) {
    query += ' AND is_open = ?';
    params.push(filters.isOpen);
  }

  if (filters.crowdedness) {
    query += ' AND crowdedness_level = ?';
    params.push(filters.crowdedness);
  }

  // Simple distance filter (approximate)
  if (filters.latitude && filters.longitude && filters.radius) {
    const latRange = filters.radius / 111; // Approximate km to degree conversion
    const lngRange = filters.radius / (111 * Math.cos(filters.latitude * Math.PI / 180));
    
    query += ' AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?';
    params.push(
      filters.latitude - latRange,
      filters.latitude + latRange,
      filters.longitude - lngRange,
      filters.longitude + lngRange
    );
  }

  query += ' ORDER BY name';

  const result = await db.execute(query, params);
  return result.rows as Restaurant[];
}

// Get restaurant by ID
export async function getRestaurantById(id: number) {
  const result = await db.execute('SELECT * FROM restaurants WHERE id = ?', [id]);
  return result.rows[0] as Restaurant | undefined;
}

// Insert sample data for Tokyo
export async function insertSampleData() {
  const sampleRestaurants = [
    {
      name: '寿司 銀座',
      address: '東京都中央区銀座1-1-1',
      latitude: 35.6712,
      longitude: 139.7671,
      cuisine_type: '和食',
      price_range: 'high',
      phone: '03-1234-5678',
      opening_hours: '11:30-14:00,17:00-22:00',
      description: '老舗の寿司店です',
      capacity: 20,
      is_open: true,
      crowdedness_level: 'moderate'
    },
    {
      name: 'イタリアン渋谷',
      address: '東京都渋谷区渋谷2-2-2',
      latitude: 35.6598,
      longitude: 139.7006,
      cuisine_type: 'イタリアン',
      price_range: 'medium',
      phone: '03-2345-6789',
      opening_hours: '11:00-15:00,17:30-23:00',
      description: '本格イタリアンレストラン',
      capacity: 40,
      is_open: true,
      crowdedness_level: 'crowded'
    },
    {
      name: 'ラーメン新宿',
      address: '東京都新宿区新宿3-3-3',
      latitude: 35.6896,
      longitude: 139.7006,
      cuisine_type: '中華',
      price_range: 'low',
      phone: '03-3456-7890',
      opening_hours: '11:00-23:00',
      description: '美味しいラーメン店',
      capacity: 15,
      is_open: true,
      crowdedness_level: 'moderate'
    },
    {
      name: 'カフェ表参道',
      address: '東京都港区表参道4-4-4',
      latitude: 35.6646,
      longitude: 139.7279,
      cuisine_type: 'カフェ',
      price_range: 'medium',
      phone: '03-4567-8901',
      opening_hours: '08:00-20:00',
      description: 'おしゃれなカフェ',
      capacity: 25,
      is_open: true,
      crowdedness_level: 'empty'
    },
    {
      name: '焼き鳥上野',
      address: '東京都台東区上野5-5-5',
      latitude: 35.7074,
      longitude: 139.7754,
      cuisine_type: '和食',
      price_range: 'low',
      phone: '03-5678-9012',
      opening_hours: '17:00-24:00',
      description: '美味しい焼き鳥屋',
      capacity: 30,
      is_open: false,
      crowdedness_level: 'moderate'
    }
  ];

  for (const restaurant of sampleRestaurants) {
    await db.execute(`
      INSERT OR IGNORE INTO restaurants (
        name, address, latitude, longitude, cuisine_type, price_range,
        phone, opening_hours, description, capacity, is_open, crowdedness_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      restaurant.name,
      restaurant.address,
      restaurant.latitude,
      restaurant.longitude,
      restaurant.cuisine_type,
      restaurant.price_range,
      restaurant.phone,
      restaurant.opening_hours,
      restaurant.description,
      restaurant.capacity,
      restaurant.is_open,
      restaurant.crowdedness_level
    ]);
  }
}