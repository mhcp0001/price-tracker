-- =====================================
-- Price Tracker MVP - Complete Database Setup
-- =====================================
-- このファイルを実行することで、Price TrackerのMVPに必要な
-- 全てのデータベース構造とデータが作成されます。
--
-- 実行順序:
-- 1. PostGIS拡張の有効化
-- 2. テーブル作成
-- 3. インデックス作成
-- 4. ビュー作成
-- 5. 関数作成
-- 6. RLSポリシー設定
-- 7. 初期データ投入
-- =====================================

-- =====================================
-- 1. PostGIS拡張を有効化
-- =====================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- 日本語検索用

-- =====================================
-- 2. テーブル作成
-- =====================================

-- 匿名ユーザーテーブル（auth.usersへの依存を削除）
CREATE TABLE IF NOT EXISTS public.anonymous_users (
  "id" uuid NOT NULL PRIMARY KEY,
  "display_name" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- 店舗テーブル
CREATE TABLE IF NOT EXISTS public.stores (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text NOT NULL,
  "address" text,
  "location" geography(Point, 4326),
  "location_lat" double precision,
  "location_lng" double precision,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- 商品テーブル
CREATE TABLE IF NOT EXISTS public.products (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "jan_code" text UNIQUE,
  "image_url" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- 価格テーブル
CREATE TABLE IF NOT EXISTS public.prices (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "product_id" uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  "store_id" uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  "price" integer NOT NULL,
  "reported_by" uuid REFERENCES public.anonymous_users(id) ON DELETE SET NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

-- =====================================
-- 3. インデックス作成
-- =====================================

-- 位置情報検索用インデックス
CREATE INDEX IF NOT EXISTS idx_stores_location ON public.stores USING GIST (location);

-- 商品名検索用インデックス（pg_trgm使用）
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING GIN (name gin_trgm_ops);

-- 店舗名検索用インデックス（pg_trgm使用）
CREATE INDEX IF NOT EXISTS idx_stores_name_trgm ON public.stores USING GIN (name gin_trgm_ops);

-- 価格検索用インデックス
CREATE INDEX IF NOT EXISTS idx_prices_product_store ON public.prices(product_id, store_id);
CREATE INDEX IF NOT EXISTS idx_prices_created_at ON public.prices(created_at DESC);

-- =====================================
-- 4. ビュー作成
-- =====================================

-- 最新価格ビュー
CREATE OR REPLACE VIEW public.latest_prices AS
SELECT DISTINCT ON (product_id, store_id)
  id,
  product_id,
  store_id,
  price,
  reported_by,
  created_at
FROM public.prices
ORDER BY product_id, store_id, created_at DESC;

-- =====================================
-- 5. 関数作成
-- =====================================

-- 近隣店舗検索関数
CREATE OR REPLACE FUNCTION public.get_nearby_stores(
  user_lat double precision,
  user_lng double precision,
  radius_meters integer DEFAULT 2000
)
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  location_lat double precision,
  location_lng double precision,
  distance_meters double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.address,
    s.location_lat,
    s.location_lng,
    ST_Distance(
      s.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    )::double precision as distance_meters
  FROM public.stores s
  WHERE ST_DWithin(
    s.location::geography,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_meters
  )
  ORDER BY distance_meters;
END;
$$;

-- 商品検索関数（pg_trgm使用）
CREATE OR REPLACE FUNCTION public.search_products(
  search_query text,
  limit_count integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  jan_code text,
  similarity_score real
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.jan_code,
    similarity(p.name, search_query) as similarity_score
  FROM public.products p
  WHERE 
    p.name % search_query  -- pg_trgmによる類似度検索
    OR p.name ILIKE '%' || search_query || '%'
  ORDER BY 
    similarity(p.name, search_query) DESC
  LIMIT limit_count;
END;
$$;

-- =====================================
-- 6. RLS (Row Level Security) 設定
-- =====================================

-- RLSを有効化
ALTER TABLE public.anonymous_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

-- Anonymous Users ポリシー
CREATE POLICY IF NOT EXISTS "Anyone can create anonymous user"
ON public.anonymous_users FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can read anonymous users"
ON public.anonymous_users FOR SELECT
TO anon
USING (true);

-- Stores ポリシー
CREATE POLICY IF NOT EXISTS "Anyone can read stores"
ON public.stores FOR SELECT
TO anon
USING (true);

-- Products ポリシー
CREATE POLICY IF NOT EXISTS "Anyone can read products"
ON public.products FOR SELECT
TO anon
USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can create products"
ON public.products FOR INSERT
TO anon
WITH CHECK (true);

-- Prices ポリシー
CREATE POLICY IF NOT EXISTS "Anyone can read prices"
ON public.prices FOR SELECT
TO anon
USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can submit prices"
ON public.prices FOR INSERT
TO anon
WITH CHECK (true);

-- =====================================
-- 7. 初期データ投入
-- =====================================

-- 東京都内の主要なスーパーマーケット店舗（実際の位置情報に修正）
INSERT INTO public.stores (name, address, location, location_lat, location_lng) VALUES
-- 新宿・渋谷エリア
('イトーヨーカドー 新宿店', '東京都新宿区新宿3-23-7', ST_SetSRID(ST_MakePoint(139.703444, 35.690921), 4326), 35.690921, 139.703444),
('成城石井 新宿店', '東京都新宿区西新宿1-1-3', ST_SetSRID(ST_MakePoint(139.700258, 35.689607), 4326), 35.689607, 139.700258),

-- 池袋エリア
('西友 池袋店', '東京都豊島区南池袋1-28-1', ST_SetSRID(ST_MakePoint(139.713344, 35.729985), 4326), 35.729985, 139.713344),
('東武ストア 池袋店', '東京都豊島区西池袋1-1-25', ST_SetSRID(ST_MakePoint(139.710779, 35.729523), 4326), 35.729523, 139.710779),

-- 練馬・大泉学園エリア（ユーザーの現在地周辺）
('いなげや 練馬東大泉店', '東京都練馬区東大泉1-28-10', ST_SetSRID(ST_MakePoint(139.587433, 35.748859), 4326), 35.748859, 139.587433),
('ライフ 大泉学園店', '東京都練馬区東大泉5-41-11', ST_SetSRID(ST_MakePoint(139.587891, 35.750122), 4326), 35.750122, 139.587891),
('西友 大泉店', '東京都練馬区東大泉2-10-11', ST_SetSRID(ST_MakePoint(139.589813, 35.750684), 4326), 35.750684, 139.589813),
('サミット 大泉学園店', '東京都練馬区大泉学園町6-11-40', ST_SetSRID(ST_MakePoint(139.580543, 35.759845), 4326), 35.759845, 139.580543),
('マルフジ 東大泉店', '東京都練馬区東大泉2-10-11', ST_SetSRID(ST_MakePoint(139.589659, 35.750574), 4326), 35.750574, 139.589659),
('オオゼキ 大泉学園店', '東京都練馬区東大泉1-37-12', ST_SetSRID(ST_MakePoint(139.587212, 35.749765), 4326), 35.749765, 139.587212),

-- 中野エリア
('東急ストア 中野店', '東京都中野区中野5-52-15', ST_SetSRID(ST_MakePoint(139.665795, 35.708359), 4326), 35.708359, 139.665795),
('西友 中野店', '東京都中野区中野4-3-1', ST_SetSRID(ST_MakePoint(139.663829, 35.708649), 4326), 35.708649, 139.663829),

-- 杉並エリア
('いなげや 杉並新高円寺店', '東京都杉並区梅里1-7-7', ST_SetSRID(ST_MakePoint(139.649632, 35.697872), 4326), 35.697872, 139.649632),
('サミット 杉並和泉店', '東京都杉並区和泉4-50-11', ST_SetSRID(ST_MakePoint(139.624851, 35.675432), 4326), 35.675432, 139.624851),

-- 世田谷エリア
('サミット 世田谷船橋店', '東京都世田谷区船橋1-1-1', ST_SetSRID(ST_MakePoint(139.622831, 35.655871), 4326), 35.655871, 139.622831),
('オーケー 世田谷店', '東京都世田谷区桜新町1-34-6', ST_SetSRID(ST_MakePoint(139.644157, 35.631268), 4326), 35.631268, 139.644157),

-- 目黒・品川エリア
('オーケー 目黒店', '東京都目黒区下目黒2-20-28', ST_SetSRID(ST_MakePoint(139.707676, 35.633745), 4326), 35.633745, 139.707676),
('ライフ 品川御殿山店', '東京都品川区北品川5-3-1', ST_SetSRID(ST_MakePoint(139.735843, 35.621654), 4326), 35.621654, 139.735843)
ON CONFLICT DO NOTHING;

-- サンプル商品データ
INSERT INTO public.products (name, description, jan_code) VALUES
('明治おいしい牛乳 1L', '成分無調整の牛乳', '4902705000012'),
('サントリー天然水 2L', 'ミネラルウォーター', '4901777000123'),
('コカ・コーラ 500ml', '炭酸飲料', '4902102000234'),
('カルビーポテトチップス うすしお味 60g', 'スナック菓子', '4901330000345'),
('日清カップヌードル', 'インスタントラーメン', '4902105000456'),
('山崎製パン 食パン 6枚切', '食パン', '4903110000567'),
('味の素 ほんだし 120g', '和風だしの素', '4901001000678'),
('キッコーマン しょうゆ 1L', '濃口醤油', '4901515000789'),
('サトウのごはん 200g×3', 'パックご飯', '4973360000890'),
('ネスカフェ ゴールドブレンド 90g', 'インスタントコーヒー', '4902201000901')
ON CONFLICT (jan_code) DO NOTHING;

-- サンプル価格データ
-- 明治おいしい牛乳の価格データ
WITH product AS (
  SELECT id FROM public.products WHERE name = '明治おいしい牛乳 1L' LIMIT 1
),
store_ids AS (
  SELECT id, name FROM public.stores
)
INSERT INTO public.prices (product_id, store_id, price) 
SELECT 
  product.id,
  store_ids.id,
  CASE store_ids.name
    WHEN 'オーケー 目黒店' THEN 218
    WHEN 'オーケー 世田谷店' THEN 225
    WHEN '西友 池袋店' THEN 228
    WHEN '西友 大泉店' THEN 235
    WHEN '西友 中野店' THEN 238
    WHEN 'ライフ 大泉学園店' THEN 248
    WHEN 'ライフ 品川御殿山店' THEN 245
    WHEN '成城石井 新宿店' THEN 268
    WHEN 'サミット 大泉学園店' THEN 242
    WHEN 'サミット 世田谷船橋店' THEN 240
    WHEN 'サミット 杉並和泉店' THEN 238
    WHEN 'いなげや 練馬東大泉店' THEN 235
    WHEN 'いなげや 杉並新高円寺店' THEN 238
    WHEN 'マルフジ 東大泉店' THEN 232
    WHEN 'オオゼキ 大泉学園店' THEN 229
    WHEN '東急ストア 中野店' THEN 245
    WHEN '東武ストア 池袋店' THEN 242
    ELSE 238
  END
FROM product, store_ids
WHERE store_ids.name IN (
  'イトーヨーカドー 新宿店', '成城石井 新宿店', '西友 池袋店', '東武ストア 池袋店',
  'いなげや 練馬東大泉店', 'ライフ 大泉学園店', '西友 大泉店', 'サミット 大泉学園店',
  'マルフジ 東大泉店', 'オオゼキ 大泉学園店', '東急ストア 中野店', '西友 中野店',
  'いなげや 杉並新高円寺店', 'サミット 杉並和泉店', 'サミット 世田谷船橋店',
  'オーケー 世田谷店', 'オーケー 目黒店', 'ライフ 品川御殿山店'
)
ON CONFLICT DO NOTHING;

-- =====================================
-- 実行完了メッセージ
-- =====================================
-- すべてのセットアップが完了しました。
-- Price Tracker MVPを使用する準備ができています。