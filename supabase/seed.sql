-- サンプルデータの投入

-- 1. 店舗データ（東京都内の架空のスーパーマーケット）
INSERT INTO public.stores (name, address, location) VALUES 
  ('スーパーマルエツ 渋谷店', '東京都渋谷区渋谷1-1-1', ST_Point(139.7038, 35.6581)),
  ('イトーヨーカドー 新宿店', '東京都新宿区新宿3-2-1', ST_Point(139.7044, 35.6896)),
  ('西友 池袋店', '東京都豊島区池袋2-3-4', ST_Point(139.7100, 35.7295)),
  ('ライフ 品川店', '東京都港区品川1-2-3', ST_Point(139.7454, 35.6284)),
  ('サミット 世田谷店', '東京都世田谷区世田谷1-1-1', ST_Point(139.6534, 35.6432)),
  ('オーケー 目黒店', '東京都目黒区目黒1-1-1', ST_Point(139.7155, 35.6340)),
  ('マルフジ 練馬店', '東京都練馬区練馬1-1-1', ST_Point(139.6540, 35.7356)),
  ('いなげや 杉並店', '東京都杉並区杉並1-1-1', ST_Point(139.6365, 35.6994)),
  ('東急ストア 中野店', '東京都中野区中野1-1-1', ST_Point(139.6638, 35.7057)),
  ('成城石井 港区店', '東京都港区六本木1-1-1', ST_Point(139.7295, 35.6627));

-- 2. 商品データ（一般的な食品）
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
  ('ネスカフェ ゴールドブレンド 90g', 'インスタントコーヒー', '4902201000901');

-- 3. 価格データ（各店舗での商品価格）
-- 明治おいしい牛乳の価格
INSERT INTO public.prices (product_id, store_id, price) 
SELECT 
  p.id,
  s.id,
  CASE 
    WHEN s.name LIKE '%オーケー%' THEN 218
    WHEN s.name LIKE '%西友%' THEN 228
    WHEN s.name LIKE '%成城石井%' THEN 268
    ELSE 238
  END
FROM products p, stores s
WHERE p.name = '明治おいしい牛乳 1L';

-- サントリー天然水の価格
INSERT INTO public.prices (product_id, store_id, price) 
SELECT 
  p.id,
  s.id,
  CASE 
    WHEN s.name LIKE '%オーケー%' THEN 88
    WHEN s.name LIKE '%西友%' THEN 98
    WHEN s.name LIKE '%成城石井%' THEN 128
    ELSE 108
  END
FROM products p, stores s
WHERE p.name = 'サントリー天然水 2L';

-- カップヌードルの価格
INSERT INTO public.prices (product_id, store_id, price) 
SELECT 
  p.id,
  s.id,
  CASE 
    WHEN s.name LIKE '%オーケー%' THEN 158
    WHEN s.name LIKE '%西友%' THEN 168
    WHEN s.name LIKE '%成城石井%' THEN 198
    ELSE 178
  END
FROM products p, stores s
WHERE p.name = '日清カップヌードル';