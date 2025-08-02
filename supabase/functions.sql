-- 近隣店舗検索関数
CREATE OR REPLACE FUNCTION get_nearby_stores(
  lat DECIMAL, 
  lng DECIMAL, 
  radius_meters INTEGER DEFAULT 2000
)
RETURNS TABLE(
  id UUID, 
  name TEXT, 
  address TEXT,
  distance_meters INTEGER, 
  location_lat DECIMAL, 
  location_lng DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id, 
    s.name,
    s.address,
    ROUND(ST_Distance(s.location::geography, ST_Point(lng, lat)::geography))::INTEGER as distance_meters,
    ST_Y(s.location::geometry)::DECIMAL as location_lat,
    ST_X(s.location::geometry)::DECIMAL as location_lng
  FROM stores s
  WHERE ST_DWithin(s.location::geography, ST_Point(lng, lat)::geography, radius_meters)
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- 最新価格ビュー
CREATE OR REPLACE VIEW latest_prices AS
SELECT DISTINCT ON (product_id, store_id)
  id, 
  product_id, 
  store_id, 
  price, 
  reported_by,
  created_at
FROM prices 
ORDER BY product_id, store_id, created_at DESC;

-- 商品検索関数（日本語対応）
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  jan_code VARCHAR(13),
  image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.jan_code,
    p.image_url
  FROM products p
  WHERE 
    to_tsvector('pg_catalog.japanese', p.name) @@ to_tsquery('pg_catalog.japanese', search_query)
    OR p.name ILIKE '%' || search_query || '%'
  ORDER BY 
    ts_rank(to_tsvector('pg_catalog.japanese', p.name), to_tsquery('pg_catalog.japanese', search_query)) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;