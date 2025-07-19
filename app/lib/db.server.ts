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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      -- v2.0 新規カラム
      photos TEXT, -- JSON配列形式の写真URL
      features TEXT, -- 店舗の特徴・雰囲気
      popular_menu TEXT, -- 人気メニューと価格
      access_info TEXT, -- アクセス情報
      area TEXT, -- エリア（新宿、渋谷、池袋など）
      lunch_hours TEXT, -- ランチ営業時間
      closed_days TEXT, -- 定休日
      average_budget INTEGER, -- 平均予算
      rating REAL, -- 評価（1-5）
      review_count INTEGER DEFAULT 0 -- レビュー数
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

// Insert comprehensive restaurant data for Tokyo
export async function insertSampleData() {
  const sampleRestaurants = [
    // 新宿エリア (10店舗)
    {
      name: '新宿サザンテラス 美々卯',
      address: '東京都渋谷区代々木2-2-1 新宿サザンテラス3F',
      latitude: 35.6873,
      longitude: 139.7016,
      cuisine_type: '和食',
      price_range: 'medium',
      phone: '03-5354-0330',
      opening_hours: '11:00-15:00,17:00-23:00',
      lunch_hours: '11:00-15:00',
      closed_days: 'なし',
      description: 'うどんすきで有名な老舗和食レストラン',
      features: '落ち着いた和の空間で楽しむ本格うどんすき。ランチタイムは丼物や定食も充実',
      popular_menu: 'うどんすき御膳 1,800円、天丼セット 1,200円',
      capacity: 60,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '新宿',
      average_budget: 1500,
      rating: 4.2,
      review_count: 328,
      access_info: 'JR新宿駅南口直結、徒歩3分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: 'うどんすき', type: 'food' }
      ])
    },
    {
      name: 'つな八 新宿高島屋店',
      address: '東京都渋谷区千駄ヶ谷5-24-2 新宿高島屋14F',
      latitude: 35.6889,
      longitude: 139.7048,
      cuisine_type: '和食',
      price_range: 'high',
      phone: '03-5361-1877',
      opening_hours: '11:00-22:00',
      lunch_hours: '11:00-15:00',
      closed_days: '不定休（高島屋に準ずる）',
      description: '江戸前天ぷらの老舗として140年以上の歴史を誇る名店',
      features: '職人が目の前で揚げる江戸前天ぷら。新宿の景色を眺めながら上質な食事を',
      popular_menu: '天ぷら御膳 2,500円、海老天丼 1,800円',
      capacity: 45,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '新宿',
      average_budget: 2200,
      rating: 4.5,
      review_count: 567,
      access_info: 'JR新宿駅新南口直結、徒歩2分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: 'カウンター席', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800', alt: '海老天丼', type: 'food' }
      ])
    },
    {
      name: 'Bills お台場',
      address: '東京都港区台場1-6-1 デックス東京ビーチ シーサイドモール4F',
      latitude: 35.6895,
      longitude: 139.7020,
      cuisine_type: 'カフェ',
      price_range: 'medium',
      phone: '03-3599-2100',
      opening_hours: '09:00-22:00',
      lunch_hours: '11:00-17:00',
      closed_days: 'なし',
      description: 'シドニー発のカフェレストラン。世界一の朝食で話題',
      features: 'ふわふわのリコッタパンケーキが名物。おしゃれな空間でブランチを',
      popular_menu: 'リコッタパンケーキ 1,600円、アボカドトースト 1,400円',
      capacity: 70,
      is_open: true,
      crowdedness_level: 'crowded',
      area: '新宿',
      average_budget: 1800,
      rating: 4.3,
      review_count: 892,
      access_info: 'JR新宿駅東口 徒歩7分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800', alt: 'パンケーキ', type: 'food' }
      ])
    },
    {
      name: '新宿うな鐵',
      address: '東京都新宿区新宿3-22-12 新宿サンパークANNEX 6F',
      latitude: 35.6907,
      longitude: 139.7025,
      cuisine_type: '和食',
      price_range: 'high',
      phone: '03-3356-4560',
      opening_hours: '11:30-14:30,17:00-22:30',
      lunch_hours: '11:30-14:30',
      closed_days: '不定休',
      description: '備長炭で焼き上げる関東風うなぎの名店',
      features: '創業140年の老舗の味を継承。ふっくらとした絶品うなぎ',
      popular_menu: 'うな重（上） 2,800円、ひつまぶし 2,400円',
      capacity: 40,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '新宿',
      average_budget: 2600,
      rating: 4.4,
      review_count: 445,
      access_info: 'JR新宿駅東口 徒歩3分、新宿三丁目駅 徒歩1分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=800', alt: 'うな重', type: 'food' }
      ])
    },
    {
      name: 'リストランテ ホンダ',
      address: '東京都新宿区新宿3-26-13 新宿中村屋ビル B1F',
      latitude: 35.6912,
      longitude: 139.7040,
      cuisine_type: 'イタリアン',
      price_range: 'high',
      phone: '03-3352-2001',
      opening_hours: '12:00-14:00,18:00-21:30',
      lunch_hours: '12:00-14:00',
      closed_days: '日曜日、祝日',
      description: 'イタリア料理界の巨匠本多哲也シェフの名店',
      features: 'ミシュラン一つ星獲得の本格イタリアン。予約必須の人気店',
      popular_menu: 'ランチコース 4,500円、パスタランチ 2,800円',
      capacity: 28,
      is_open: true,
      crowdedness_level: 'empty',
      area: '新宿',
      average_budget: 3800,
      rating: 4.7,
      review_count: 234,
      access_info: 'JR新宿駅東口 徒歩5分、新宿三丁目駅 徒歩2分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800', alt: 'パスタ', type: 'food' }
      ])
    },
    {
      name: '中華そば ムタヒロ',
      address: '東京都新宿区新宿3-5-3 高山ランド会館2F',
      latitude: 35.6895,
      longitude: 139.7018,
      cuisine_type: '中華',
      price_range: 'low',
      phone: '03-3350-8108',
      opening_hours: '11:00-22:00',
      lunch_hours: '11:00-15:00',
      closed_days: 'なし',
      description: '煮干しラーメンの人気店。あっさりした優しい味わい',
      features: '煮干しの旨味を活かした透明感のあるスープが自慢',
      popular_menu: '中華そば 900円、つけ麺 1,000円',
      capacity: 16,
      is_open: true,
      crowdedness_level: 'crowded',
      area: '新宿',
      average_budget: 950,
      rating: 4.1,
      review_count: 756,
      access_info: 'JR新宿駅東口 徒歩2分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: 'カウンター席', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', alt: '中華そば', type: 'food' }
      ])
    },
    {
      name: 'すし家 新宿本店',
      address: '東京都新宿区新宿3-17-13 雀の伯父さんビル 5F',
      latitude: 35.6902,
      longitude: 139.7033,
      cuisine_type: '和食',
      price_range: 'medium',
      phone: '03-3354-1271',
      opening_hours: '11:00-23:00',
      lunch_hours: '11:00-15:00',
      closed_days: '年中無休',
      description: '新鮮なネタと職人の技が光る回転寿司店',
      features: '注文握りも可能。新宿で気軽に本格寿司を楽しめる',
      popular_menu: 'ランチ握り 1,200円、海鮮丼 1,000円',
      capacity: 35,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '新宿',
      average_budget: 1100,
      rating: 4.0,
      review_count: 623,
      access_info: 'JR新宿駅東口 徒歩3分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: 'カウンター席', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800', alt: '寿司', type: 'food' }
      ])
    },
    {
      name: '新宿やきとり 横丁',
      address: '東京都新宿区西新宿1-2-9',
      latitude: 35.6885,
      longitude: 139.6995,
      cuisine_type: '和食',
      price_range: 'low',
      phone: '03-3348-5511',
      opening_hours: '17:00-24:00',
      lunch_hours: 'なし',
      closed_days: '日曜日',
      description: '昭和レトロな雰囲気の焼き鳥横丁',
      features: '新宿の夜を彩る老舗焼き鳥横丁。複数店舗が軒を連ねる',
      popular_menu: '焼き鳥盛り合わせ 800円、生ビール 350円',
      capacity: 20,
      is_open: false,
      crowdedness_level: 'moderate',
      area: '新宿',
      average_budget: 1500,
      rating: 3.9,
      review_count: 445,
      access_info: 'JR新宿駅西口 徒歩1分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '横丁の様子', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1612309386954-5096b5e2b4d8?w=800', alt: '焼き鳥', type: 'food' }
      ])
    },
    {
      name: 'ルミネエスト レストラン街',
      address: '東京都新宿区新宿3-38-2 ルミネエスト新宿 8F',
      latitude: 35.6890,
      longitude: 139.7040,
      cuisine_type: 'カフェ',
      price_range: 'medium',
      phone: '03-5269-1111',
      opening_hours: '11:00-22:30',
      lunch_hours: '11:00-17:00',
      closed_days: 'なし',
      description: '新宿の人気複合レストランフロア',
      features: '和洋中様々なジャンルのレストランが集結。選択肢豊富',
      popular_menu: '各店舗ランチセット 1,200円〜',
      capacity: 200,
      is_open: true,
      crowdedness_level: 'crowded',
      area: '新宿',
      average_budget: 1400,
      rating: 4.2,
      review_count: 1234,
      access_info: 'JR新宿駅東口直結',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', alt: 'レストラン街', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', alt: 'フロアの様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: '料理の数々', type: 'food' }
      ])
    },
    {
      name: 'とんかつ かつくら',
      address: '東京都新宿区新宿3-22-7 指田ビル B1F',
      latitude: 35.6907,
      longitude: 139.7027,
      cuisine_type: '和食',
      price_range: 'medium',
      phone: '03-3354-4800',
      opening_hours: '11:00-22:00',
      lunch_hours: '11:00-15:00',
      closed_days: 'なし',
      description: '京都発のとんかつ専門店。上質な豚肉を使用',
      features: '厳選された豚肉をサクサクの衣で包んだ絶品とんかつ',
      popular_menu: 'ロースかつ膳 1,800円、ヒレかつ膳 1,600円',
      capacity: 45,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '新宿',
      average_budget: 1700,
      rating: 4.3,
      review_count: 567,
      access_info: 'JR新宿駅東口 徒歩3分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800', alt: 'とんかつ', type: 'food' }
      ])
    },

    // 渋谷エリア (10店舗)
    {
      name: 'bills 表参道',
      address: '東京都港区南青山3-17-15',
      latitude: 35.6650,
      longitude: 139.7123,
      cuisine_type: 'カフェ',
      price_range: 'medium',
      phone: '03-5785-5650',
      opening_hours: '08:30-22:30',
      lunch_hours: '11:00-17:00',
      closed_days: 'なし',
      description: 'シドニー発祥の人気カフェレストラン',
      features: '世界一の朝食で有名なリコッタパンケーキが絶品',
      popular_menu: 'リコッタパンケーキ 1,700円、アボカドトースト 1,500円',
      capacity: 65,
      is_open: true,
      crowdedness_level: 'crowded',
      area: '渋谷',
      average_budget: 1800,
      rating: 4.4,
      review_count: 1156,
      access_info: '表参道駅A2出口 徒歩3分、渋谷駅 徒歩12分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800', alt: 'パンケーキ', type: 'food' }
      ])
    },
    {
      name: '青山 川上庵',
      address: '東京都港区南青山5-8-5',
      latitude: 35.6638,
      longitude: 139.7097,
      cuisine_type: '和食',
      price_range: 'high',
      phone: '03-3407-4018',
      opening_hours: '11:30-15:00,17:00-22:00',
      lunch_hours: '11:30-15:00',
      closed_days: '無休',
      description: '群馬の名店が手がける本格手打ちそば',
      features: '石臼挽きそば粉を使った香り高い蕎麦と季節の天ぷら',
      popular_menu: '天せいろ 2,200円、季節の蕎麦懐石 3,500円',
      capacity: 50,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '渋谷',
      average_budget: 2400,
      rating: 4.5,
      review_count: 423,
      access_info: '表参道駅B1出口 徒歩5分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: '天せいろ', type: 'food' }
      ])
    },
    {
      name: 'スシロー 渋谷店',
      address: '東京都渋谷区宇田川町21-6 Q-front 4F',
      latitude: 35.6595,
      longitude: 139.6986,
      cuisine_type: '和食',
      price_range: 'low',
      phone: '03-3770-3888',
      opening_hours: '11:00-23:00',
      lunch_hours: '11:00-17:00',
      closed_days: 'なし',
      description: '全国展開の回転寿司チェーン',
      features: '新鮮なネタを回転寿司で気軽に。家族連れにも人気',
      popular_menu: '大とろ 200円、うに 300円、海鮮丼 500円',
      capacity: 80,
      is_open: true,
      crowdedness_level: 'crowded',
      area: '渋谷',
      average_budget: 800,
      rating: 3.8,
      review_count: 1456,
      access_info: 'JR渋谷駅ハチ公口 徒歩1分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800', alt: '寿司', type: 'food' }
      ])
    },
    {
      name: 'ラーメン二郎 渋谷店',
      address: '東京都渋谷区渋谷3-7-2',
      latitude: 35.6580,
      longitude: 139.7016,
      cuisine_type: '中華',
      price_range: 'low',
      phone: '03-3400-6955',
      opening_hours: '11:30-14:30,18:30-21:00',
      lunch_hours: '11:30-14:30',
      closed_days: '日曜日',
      description: 'ボリューム満点の極太麺ラーメン',
      features: '圧倒的なボリュームのラーメン。野菜マシマシで有名',
      popular_menu: 'ラーメン 750円、大ラーメン 850円',
      capacity: 12,
      is_open: true,
      crowdedness_level: 'crowded',
      area: '渋谷',
      average_budget: 800,
      rating: 4.2,
      review_count: 2134,
      access_info: 'JR渋谷駅東口 徒歩5分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: 'カウンター席', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', alt: 'ラーメン', type: 'food' }
      ])
    },
    {
      name: 'カフェ・ド・クリエ 渋谷店',
      address: '東京都渋谷区渋谷1-12-19',
      latitude: 35.6597,
      longitude: 139.7026,
      cuisine_type: 'カフェ',
      price_range: 'low',
      phone: '03-3400-7766',
      opening_hours: '07:00-22:00',
      lunch_hours: '11:00-17:00',
      closed_days: 'なし',
      description: 'コーヒーとパンが自慢のカフェチェーン',
      features: '香り豊かなコーヒーと焼きたてパン。朝食やランチに最適',
      popular_menu: 'ホットサンド 650円、ドリンクセット 380円',
      capacity: 35,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '渋谷',
      average_budget: 700,
      rating: 3.7,
      review_count: 567,
      access_info: 'JR渋谷駅東口 徒歩3分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800', alt: 'ホットサンド', type: 'food' }
      ])
    },
    {
      name: '食べ放題 しゃぶしゃぶ 温野菜',
      address: '東京都渋谷区道玄坂2-9-10',
      latitude: 35.6575,
      longitude: 139.6980,
      cuisine_type: '和食',
      price_range: 'medium',
      phone: '03-5428-3988',
      opening_hours: '11:30-24:00',
      lunch_hours: '11:30-17:00',
      closed_days: 'なし',
      description: 'しゃぶしゃぶ食べ放題の人気チェーン',
      features: '新鮮な野菜と上質なお肉を食べ放題で。ランチタイムがお得',
      popular_menu: 'ランチ食べ放題 1,680円、牛しゃぶコース 2,480円',
      capacity: 60,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '渋谷',
      average_budget: 1800,
      rating: 4.0,
      review_count: 892,
      access_info: 'JR渋谷駅ハチ公口 徒歩4分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: 'しゃぶしゃぶ', type: 'food' }
      ])
    },
    {
      name: 'パスタ・デ・ココ',
      address: '東京都渋谷区宇田川町13-8',
      latitude: 35.6612,
      longitude: 139.6991,
      cuisine_type: 'イタリアン',
      price_range: 'medium',
      phone: '03-3464-6266',
      opening_hours: '11:30-23:00',
      lunch_hours: '11:30-17:00',
      closed_days: 'なし',
      description: '本格イタリアンパスタの専門店',
      features: '生パスタを使った本格的なイタリア料理。カップルに人気',
      popular_menu: 'カルボナーラ 1,400円、ランチセット 1,200円',
      capacity: 40,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '渋谷',
      average_budget: 1300,
      rating: 4.1,
      review_count: 678,
      access_info: 'JR渋谷駅ハチ公口 徒歩6分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800', alt: 'パスタ', type: 'food' }
      ])
    },
    {
      name: '焼肉キング 渋谷店',
      address: '東京都渋谷区渋谷3-18-8',
      latitude: 35.6578,
      longitude: 139.7042,
      cuisine_type: '和食',
      price_range: 'medium',
      phone: '03-5485-8929',
      opening_hours: '11:30-24:00',
      lunch_hours: '11:30-17:00',
      closed_days: 'なし',
      description: '焼肉食べ放題の人気チェーン',
      features: '高品質なお肉を食べ放題で楽しめる。学生に人気',
      popular_menu: 'ランチ食べ放題 1,980円、プレミアムコース 2,980円',
      capacity: 80,
      is_open: true,
      crowdedness_level: 'crowded',
      area: '渋谷',
      average_budget: 2200,
      rating: 3.9,
      review_count: 1234,
      access_info: 'JR渋谷駅新南口 徒歩3分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1612309386954-5096b5e2b4d8?w=800', alt: '焼肉', type: 'food' }
      ])
    },
    {
      name: '渋谷 道玄坂 マンモス',
      address: '東京都渋谷区道玄坂2-25-17',
      latitude: 35.6562,
      longitude: 139.6967,
      cuisine_type: 'ファストフード',
      price_range: 'low',
      phone: '03-3780-5511',
      opening_hours: '24時間営業',
      lunch_hours: '24時間',
      closed_days: 'なし',
      description: '24時間営業の大型ファミリーレストラン',
      features: '深夜も営業、豊富なメニューで幅広い世代に対応',
      popular_menu: 'ハンバーグ定食 980円、オムライス 850円',
      capacity: 120,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '渋谷',
      average_budget: 900,
      rating: 3.6,
      review_count: 2456,
      access_info: 'JR渋谷駅ハチ公口 徒歩8分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: 'ハンバーグ', type: 'food' }
      ])
    },
    {
      name: 'タイ食堂 渋谷店',
      address: '東京都渋谷区渋谷2-20-11',
      latitude: 35.6603,
      longitude: 139.7048,
      cuisine_type: 'タイ料理',
      price_range: 'medium',
      phone: '03-3400-9900',
      opening_hours: '11:30-15:00,17:30-23:00',
      lunch_hours: '11:30-15:00',
      closed_days: '月曜日',
      description: '本場タイの味を忠実に再現したタイ料理専門店',
      features: 'タイ人シェフが作る本格的なタイ料理。辛さ調整可能',
      popular_menu: 'パッタイ 1,200円、グリーンカレー 1,400円',
      capacity: 35,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '渋谷',
      average_budget: 1350,
      rating: 4.3,
      review_count: 567,
      access_info: 'JR渋谷駅東口 徒歩4分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: 'パッタイ', type: 'food' }
      ])
    },

    // 池袋エリア (10店舗)
    {
      name: '池袋西口 大勝軒',
      address: '東京都豊島区西池袋1-17-10',
      latitude: 35.7295,
      longitude: 139.7097,
      cuisine_type: '中華',
      price_range: 'low',
      phone: '03-3982-7656',
      opening_hours: '11:00-21:00',
      lunch_hours: '11:00-17:00',
      closed_days: '木曜日',
      description: 'つけ麺発祥の名店として有名',
      features: '濃厚なスープと太麺のつけ麺が自慢。行列必至の人気店',
      popular_menu: 'つけ麺 900円、中華そば 750円',
      capacity: 18,
      is_open: true,
      crowdedness_level: 'crowded',
      area: '池袋',
      average_budget: 850,
      rating: 4.5,
      review_count: 1678,
      access_info: 'JR池袋駅西口 徒歩2分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: 'カウンター席', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', alt: 'つけ麺', type: 'food' }
      ])
    },
    {
      name: 'サンシャイン水族館 カフェ',
      address: '東京都豊島区東池袋3-1 サンシャインシティワールドインポートマートビル',
      latitude: 35.7286,
      longitude: 139.7188,
      cuisine_type: 'カフェ',
      price_range: 'medium',
      phone: '03-3989-3466',
      opening_hours: '10:00-20:00',
      lunch_hours: '11:00-17:00',
      closed_days: 'なし',
      description: '水族館隣接のテーマカフェ',
      features: '海をテーマにしたメニューと内装。ファミリーに人気',
      popular_menu: 'クラゲパフェ 1,200円、海の幸パスタ 1,500円',
      capacity: 50,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '池袋',
      average_budget: 1300,
      rating: 4.0,
      review_count: 567,
      access_info: 'JR池袋駅東口 徒歩8分、東池袋駅 徒歩3分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800', alt: 'パフェ', type: 'food' }
      ])
    },
    {
      name: '老辺餃子館 池袋店',
      address: '東京都豊島区南池袋1-25-9 MYTビル3F',
      latitude: 35.7280,
      longitude: 139.7109,
      cuisine_type: '中華',
      price_range: 'medium',
      phone: '03-3986-9888',
      opening_hours: '11:30-22:00',
      lunch_hours: '11:30-17:00',
      closed_days: 'なし',
      description: '中国・瀋陽発祥の餃子専門店',
      features: '本場中国の餃子を日本風にアレンジ。種類豊富な餃子が自慢',
      popular_menu: '老辺餃子セット 1,800円、白菜餃子 1,200円',
      capacity: 45,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '池袋',
      average_budget: 1500,
      rating: 4.2,
      review_count: 834,
      access_info: 'JR池袋駅東口 徒歩3分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: '餃子', type: 'food' }
      ])
    },
    {
      name: 'がってん寿司 池袋店',
      address: '東京都豊島区東池袋1-22-5',
      latitude: 35.7302,
      longitude: 139.7156,
      cuisine_type: '和食',
      price_range: 'medium',
      phone: '03-5951-1129',
      opening_hours: '11:00-23:00',
      lunch_hours: '11:00-17:00',
      closed_days: 'なし',
      description: '職人が握る本格寿司をリーズナブルに',
      features: '新鮮なネタと職人の技術。回転寿司とは一線を画す品質',
      popular_menu: 'おまかせ握り 1,800円、海鮮丼 1,200円',
      capacity: 55,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '池袋',
      average_budget: 1500,
      rating: 4.1,
      review_count: 923,
      access_info: 'JR池袋駅東口 徒歩4分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: 'カウンター席', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800', alt: '寿司', type: 'food' }
      ])
    },
    {
      name: 'フレンチ・キッチン',
      address: '東京都豊島区西池袋3-22-7',
      latitude: 35.7311,
      longitude: 139.7058,
      cuisine_type: 'フレンチ',
      price_range: 'high',
      phone: '03-3971-7745',
      opening_hours: '12:00-14:30,18:00-22:00',
      lunch_hours: '12:00-14:30',
      closed_days: '月曜日',
      description: 'カジュアルフレンチの名店',
      features: '本格フレンチをカジュアルな雰囲気で。ランチコースが人気',
      popular_menu: 'ランチコース 2,500円、ディナーコース 4,800円',
      capacity: 32,
      is_open: true,
      crowdedness_level: 'empty',
      area: '池袋',
      average_budget: 3200,
      rating: 4.4,
      review_count: 287,
      access_info: 'JR池袋駅西口 徒歩5分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: 'フレンチ料理', type: 'food' }
      ])
    },
    {
      name: 'インド料理 ガンジス',
      address: '東京都豊島区南池袋1-28-2',
      latitude: 35.7275,
      longitude: 139.7123,
      cuisine_type: 'インド料理',
      price_range: 'low',
      phone: '03-3988-1155',
      opening_hours: '11:00-23:00',
      lunch_hours: '11:00-17:00',
      closed_days: 'なし',
      description: '本格インドカレーと焼きたてナン',
      features: 'インド人シェフが作る本場の味。ランチセットがお得',
      popular_menu: 'カレーランチセット 980円、チキンティッカ 1,200円',
      capacity: 40,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '池袋',
      average_budget: 1100,
      rating: 4.0,
      review_count: 756,
      access_info: 'JR池袋駅東口 徒歩3分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: 'カレー', type: 'food' }
      ])
    },
    {
      name: '韓国料理 池袋ハヌリ',
      address: '東京都豊島区南池袋2-27-8',
      latitude: 35.7265,
      longitude: 139.7134,
      cuisine_type: '韓国料理',
      price_range: 'medium',
      phone: '03-3986-7788',
      opening_hours: '11:30-24:00',
      lunch_hours: '11:30-17:00',
      closed_days: 'なし',
      description: '本場韓国の味を再現した老舗韓国料理店',
      features: '韓国人シェフによる本格料理。チヂミとキムチが絶品',
      popular_menu: 'ビビンバ 1,300円、韓国焼肉セット 1,800円',
      capacity: 50,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '池袋',
      average_budget: 1450,
      rating: 4.2,
      review_count: 645,
      access_info: 'JR池袋駅東口 徒歩6分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: 'ビビンバ', type: 'food' }
      ])
    },
    {
      name: 'とんかつ まい泉',
      address: '東京都豊島区南池袋1-25-1',
      latitude: 35.7283,
      longitude: 139.7115,
      cuisine_type: '和食',
      price_range: 'medium',
      phone: '03-3988-6677',
      opening_hours: '11:00-22:00',
      lunch_hours: '11:00-17:00',
      closed_days: 'なし',
      description: 'とんかつサンドで有名な老舗とんかつ店',
      features: '柔らかいヒレ肉を使ったとんかつサンドが名物',
      popular_menu: 'ヒレカツサンド 950円、ロースカツ定食 1,600円',
      capacity: 38,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '池袋',
      average_budget: 1300,
      rating: 4.1,
      review_count: 1023,
      access_info: 'JR池袋駅東口 徒歩2分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800', alt: 'とんかつ', type: 'food' }
      ])
    },
    {
      name: 'ステーキガスト 池袋店',
      address: '東京都豊島区東池袋1-10-1',
      latitude: 35.7290,
      longitude: 139.7145,
      cuisine_type: '洋食',
      price_range: 'medium',
      phone: '03-5951-3399',
      opening_hours: '11:00-24:00',
      lunch_hours: '11:00-17:00',
      closed_days: 'なし',
      description: 'ステーキ専門のファミリーレストラン',
      features: 'リーズナブルな価格で本格ステーキ。サラダバー付き',
      popular_menu: 'ランチステーキ 1,490円、ハンバーグ&ステーキ 1,790円',
      capacity: 70,
      is_open: true,
      crowdedness_level: 'moderate',
      area: '池袋',
      average_budget: 1600,
      rating: 3.8,
      review_count: 1456,
      access_info: 'JR池袋駅東口 徒歩3分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', alt: '店舗外観', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', alt: '店内の様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: 'ステーキ', type: 'food' }
      ])
    },
    {
      name: '池袋餃子スタジアム',
      address: '東京都豊島区東池袋3-1-3 サンシャインシティ',
      latitude: 35.7288,
      longitude: 139.7190,
      cuisine_type: '中華',
      price_range: 'low',
      phone: '03-3989-3331',
      opening_hours: '11:00-22:00',
      lunch_hours: '11:00-17:00',
      closed_days: 'なし',
      description: '全国の有名餃子店が集結したフードコート',
      features: '日本各地の名店の餃子を一度に楽しめる。食べ比べが人気',
      popular_menu: '餃子食べ比べセット 1,200円、焼き餃子 600円',
      capacity: 150,
      is_open: true,
      crowdedness_level: 'crowded',
      area: '池袋',
      average_budget: 950,
      rating: 4.0,
      review_count: 2234,
      access_info: 'JR池袋駅東口 徒歩8分、東池袋駅 徒歩3分',
      photos: JSON.stringify([
        { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', alt: 'フードコート', type: 'exterior' },
        { url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800', alt: 'フロアの様子', type: 'interior' },
        { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800', alt: '餃子', type: 'food' }
      ])
    }
  ];

  for (const restaurant of sampleRestaurants) {
    await db.execute(`
      INSERT OR IGNORE INTO restaurants (
        name, address, latitude, longitude, cuisine_type, price_range,
        phone, opening_hours, description, capacity, is_open, crowdedness_level,
        photos, features, popular_menu, access_info, area, lunch_hours, closed_days,
        average_budget, rating, review_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      restaurant.crowdedness_level,
      restaurant.photos,
      restaurant.features,
      restaurant.popular_menu,
      restaurant.access_info,
      restaurant.area,
      restaurant.lunch_hours,
      restaurant.closed_days,
      restaurant.average_budget,
      restaurant.rating,
      restaurant.review_count
    ]);
  }
}