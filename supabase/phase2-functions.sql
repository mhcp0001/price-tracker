-- Phase 2 Functions for Product Detail Page

-- RPC: 商品の全店舗価格を距離付きで取得
CREATE OR REPLACE FUNCTION get_product_prices_with_distance(
  product_id_param uuid,
  user_lat double precision DEFAULT NULL,
  user_lng double precision DEFAULT NULL
)
RETURNS TABLE(
  store_id uuid,
  store_name text,
  address text,
  price integer,
  distance_meters double precision,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.address,
    lp.price,
    CASE 
      WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL THEN
        ST_Distance(
          s.location::geography,
          ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        )::double precision
      ELSE NULL
    END as distance_meters,
    lp.created_at
  FROM stores s
  JOIN latest_prices lp ON s.id = lp.store_id
  WHERE lp.product_id = product_id_param
  ORDER BY lp.price ASC, distance_meters ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- 日別価格集計
CREATE OR REPLACE FUNCTION get_price_history(
  product_id_param uuid,
  period_days integer DEFAULT 30
)
RETURNS TABLE(
  date date,
  min_price integer,
  avg_price numeric,
  max_price integer,
  sample_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('day', created_at)::date as date,
    MIN(price)::integer as min_price,
    AVG(price)::numeric(10, 2) as avg_price,
    MAX(price)::integer as max_price,
    COUNT(*)::integer as sample_count
  FROM prices
  WHERE product_id = product_id_param
    AND created_at >= CURRENT_DATE - interval '1 day' * period_days
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql;

-- 商品検索（価格情報付き）
CREATE OR REPLACE FUNCTION search_products_with_prices(
  search_query text DEFAULT NULL,
  limit_count integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  jan_code text,
  min_price integer,
  max_price integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.jan_code,
    MIN(lp.price)::integer as min_price,
    MAX(lp.price)::integer as max_price
  FROM products p
  LEFT JOIN latest_prices lp ON p.id = lp.product_id
  WHERE 
    search_query IS NULL 
    OR p.name % search_query 
    OR p.name ILIKE '%' || search_query || '%'
  GROUP BY p.id, p.name, p.description, p.jan_code
  ORDER BY 
    CASE WHEN search_query IS NOT NULL 
      THEN similarity(p.name, search_query) 
      ELSE 0 
    END DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- インデックス追加（パフォーマンス改善）
CREATE INDEX IF NOT EXISTS idx_prices_product_created 
ON prices(product_id, created_at DESC);

-- latest_pricesはビューなので、基となるpricesテーブルにインデックスを作成
-- product_idのインデックスは既に存在している可能性が高いが、念のため作成
CREATE INDEX IF NOT EXISTS idx_prices_product 
ON prices(product_id);