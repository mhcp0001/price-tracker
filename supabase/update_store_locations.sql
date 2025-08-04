-- 既存の店舗位置情報を更新するSQL
-- このファイルは既存のデータベースの店舗位置を修正する場合に使用します

-- まず、location_latとlocation_lngカラムが存在しない場合は追加
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS location_lat double precision,
ADD COLUMN IF NOT EXISTS location_lng double precision;

-- 練馬・大泉学園エリアの店舗を更新
UPDATE public.stores SET 
  location = ST_SetSRID(ST_MakePoint(139.587433, 35.748859), 4326),
  location_lat = 35.748859,
  location_lng = 139.587433,
  address = '東京都練馬区東大泉1-28-10'
WHERE name = 'いなげや 練馬東大泉店';

UPDATE public.stores SET 
  location = ST_SetSRID(ST_MakePoint(139.587891, 35.750122), 4326),
  location_lat = 35.750122,
  location_lng = 139.587891,
  address = '東京都練馬区東大泉5-41-11'
WHERE name = 'ライフ 大泉学園店';

UPDATE public.stores SET 
  location = ST_SetSRID(ST_MakePoint(139.589813, 35.750684), 4326),
  location_lat = 35.750684,
  location_lng = 139.589813,
  address = '東京都練馬区東大泉2-10-11'
WHERE name = '西友 大泉店';

UPDATE public.stores SET 
  location = ST_SetSRID(ST_MakePoint(139.580543, 35.759845), 4326),
  location_lat = 35.759845,
  location_lng = 139.580543,
  address = '東京都練馬区大泉学園町6-11-40'
WHERE name = 'サミット 大泉学園店';

-- マルフジ練馬店をマルフジ東大泉店に名称変更と位置修正
UPDATE public.stores SET 
  name = 'マルフジ 東大泉店',
  location = ST_SetSRID(ST_MakePoint(139.589659, 35.750574), 4326),
  location_lat = 35.750574,
  location_lng = 139.589659,
  address = '東京都練馬区東大泉2-10-11'
WHERE name = 'マルフジ 練馬店';

-- 新しい店舗を追加（存在しない場合のみ）
INSERT INTO public.stores (name, address, location, location_lat, location_lng) 
VALUES ('オオゼキ 大泉学園店', '東京都練馬区東大泉1-37-12', 
        ST_SetSRID(ST_MakePoint(139.587212, 35.749765), 4326), 
        35.749765, 139.587212)
ON CONFLICT DO NOTHING;

-- その他のエリアの店舗も正確な位置に更新
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
  location_lng = 139.665795,
  address = '東京都中野区中野5-52-15'
WHERE name = '東急ストア 中野店';

UPDATE public.stores SET 
  location = ST_SetSRID(ST_MakePoint(139.707676, 35.633745), 4326),
  location_lat = 35.633745,
  location_lng = 139.707676
WHERE name = 'オーケー 目黒店';

-- 確認用クエリ
SELECT name, address, location_lat, location_lng 
FROM public.stores 
WHERE name LIKE '%大泉%' OR name LIKE '%練馬%'
ORDER BY name;