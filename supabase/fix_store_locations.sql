-- 既存データベースの店舗位置情報を修正するSQL
-- このファイルは既にデータが入っているデータベースの位置情報を修正します

-- 1. location_latとlocation_lngカラムを追加（存在しない場合）
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS location_lat double precision,
ADD COLUMN IF NOT EXISTS location_lng double precision;

-- 2. 既存の店舗データを削除して新しいデータを挿入
-- （位置情報が大きく異なるため、更新より再作成が確実）

-- 既存データをクリア
DELETE FROM public.stores WHERE name IN (
  'いなげや 練馬東大泉店',
  'ライフ 大泉学園店', 
  '西友 大泉店',
  'サミット 大泉学園店'
);

-- 正確な位置情報で再挿入
INSERT INTO public.stores (name, address, location, location_lat, location_lng) VALUES
-- 練馬・大泉学園エリア（最も重要）
('いなげや 練馬東大泉店', '東京都練馬区東大泉1-28-10', 
  ST_SetSRID(ST_MakePoint(139.587433, 35.748859), 4326), 35.748859, 139.587433),
('ライフ 大泉学園店', '東京都練馬区東大泉5-41-11', 
  ST_SetSRID(ST_MakePoint(139.587891, 35.750122), 4326), 35.750122, 139.587891),
('西友 大泉店', '東京都練馬区東大泉2-10-11', 
  ST_SetSRID(ST_MakePoint(139.589813, 35.750684), 4326), 35.750684, 139.589813),
('サミット 大泉学園店', '東京都練馬区大泉学園町6-11-40', 
  ST_SetSRID(ST_MakePoint(139.580543, 35.759845), 4326), 35.759845, 139.580543)
ON CONFLICT DO NOTHING;

-- 3. その他の主要店舗も必要に応じて位置修正
UPDATE public.stores SET 
  location = ST_SetSRID(ST_MakePoint(139.703444, 35.690921), 4326),
  location_lat = 35.690921,
  location_lng = 139.703444
WHERE name = 'イトーヨーカドー 新宿店';

UPDATE public.stores SET 
  location = ST_SetSRID(ST_MakePoint(139.713344, 35.729985), 4326),
  location_lat = 35.729985,
  location_lng = 139.713344
WHERE name = '西友 池袋店';

UPDATE public.stores SET 
  location = ST_SetSRID(ST_MakePoint(139.665795, 35.708359), 4326),
  location_lat = 35.708359,
  location_lng = 139.665795
WHERE name = '東急ストア 中野店';

-- 4. 確認クエリ
SELECT 
  name, 
  address, 
  location_lat, 
  location_lng,
  ST_Distance(
    location::geography,
    ST_SetSRID(ST_MakePoint(139.588, 35.750), 4326)::geography
  )::integer as distance_from_oizumi_meters
FROM public.stores 
WHERE location_lat IS NOT NULL
  AND location_lng IS NOT NULL
ORDER BY distance_from_oizumi_meters
LIMIT 10;