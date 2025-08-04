-- 1. 拡張機能の有効化
-- PostGIS (地理空間情報)
CREATE EXTENSION IF NOT EXISTS postgis;
-- pg_trgm (全文検索の高速化に貢献)
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- 2. updated_atを自動更新するためのトリガー関数
-- テーブルの行が更新されるたびに `updated_at` カラムを現在時刻に設定します。
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 3. テーブル定義
-- 3.1. anonymous_users テーブル
-- Supabaseの認証ユーザー(auth.users)と連携するためのテーブル。
-- 匿名ユーザーの情報を格納します。
CREATE TABLE public.anonymous_users (
  "id" uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "display_name" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
-- コメント
COMMENT ON TABLE public.anonymous_users IS '匿名ユーザー情報を格納するテーブル。Supabaseのauth.usersと連携。';
COMMENT ON COLUMN public.anonymous_users.id IS 'Supabaseの認証ユーザーID';
COMMENT ON COLUMN public.anonymous_users.display_name IS 'ユーザーの表示名';

-- updated_at トリガーの設定
CREATE TRIGGER on_anonymous_users_updated
  BEFORE UPDATE ON public.anonymous_users
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();


-- 3.2. stores テーブル
-- 店舗情報を格納します。PostGISのgeography型で位置情報を持ちます。
CREATE TABLE public.stores (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "name" text NOT NULL,
  "address" text,
  "location" geography(Point, 4326), -- 経度・緯度 (WGS 84)
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
-- コメント
COMMENT ON TABLE public.stores IS '店舗情報を格納するテーブル';
COMMENT ON COLUMN public.stores.name IS '店舗名';
COMMENT ON COLUMN public.stores.address IS '住所';
COMMENT ON COLUMN public.stores.location IS '店舗の地理的位置 (経度, 緯度)';

-- updated_at トリガーの設定
CREATE TRIGGER on_stores_updated
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();


-- 3.3. products テーブル
-- 商品情報を格納します。
CREATE TABLE public.products (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "jan_code" varchar(13) UNIQUE,
  "image_url" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
-- コメント
COMMENT ON TABLE public.products IS '商品情報を格納するテーブル';
COMMENT ON COLUMN public.products.name IS '商品名';
COMMENT ON COLUMN public.products.description IS '商品説明';
COMMENT ON COLUMN public.products.jan_code IS 'JANコード (13桁)';
COMMENT ON COLUMN public.products.image_url IS '商品画像のURL';

-- updated_at トリガーの設定
CREATE TRIGGER on_products_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();


-- 3.4. prices テーブル
-- 店舗ごとの商品価格を記録するテーブル。
CREATE TABLE public.prices (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "product_id" uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  "store_id" uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  "price" integer NOT NULL,
  "reported_by" uuid REFERENCES public.anonymous_users(id) ON DELETE SET NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
  -- updated_at は価格情報の更新を想定しないため設定しない
);
-- コメント
COMMENT ON TABLE public.prices IS '店舗ごとの商品価格履歴';
COMMENT ON COLUMN public.prices.product_id IS '商品ID (products.idへのFK)';
COMMENT ON COLUMN public.prices.store_id IS '店舗ID (stores.idへのFK)';
COMMENT ON COLUMN public.prices.price IS '価格 (円)';
COMMENT ON COLUMN public.prices.reported_by IS '価格を報告したユーザーID (anonymous_users.idへのFK)';
COMMENT ON COLUMN public.prices.created_at IS '価格の報告日時';


-- 4. インデックスの作成
-- 4.1. 外部キーに対するインデックス (PostgreSQLでは自動で作成されますが、明示的に記載)
CREATE INDEX ON public.prices ("product_id");
CREATE INDEX ON public.prices ("store_id");
CREATE INDEX ON public.prices ("reported_by");

-- 4.2. 地理空間インデックス
-- 距離計算などの地理的クエリを高速化します。
CREATE INDEX idx_stores_location ON public.stores USING GIST (location);

-- 4.3. 日本語全文検索用のインデックス
-- pg_trgmを使用した日本語対応の全文検索インデックス
-- stores テーブル
CREATE INDEX idx_stores_name_trgm ON public.stores USING GIN (name gin_trgm_ops);

-- products テーブル
CREATE INDEX idx_products_name_trgm ON public.products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm ON public.products USING GIN (description gin_trgm_ops);


-- 5. Row Level Security (RLS) の有効化
-- Supabaseの基本的なセキュリティ設定。各テーブルでRLSを有効にします。
-- この後、各操作(SELECT, INSERT, UPDATE, DELETE)に対するポリシー(POLICY)を定義する必要があります。
ALTER TABLE public.anonymous_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

-- RLSポリシーのサンプル (必要に応じて定義してください)
/*
-- 例: ログインしているユーザーは全ての店舗情報を閲覧できる
CREATE POLICY "Allow logged-in users to read stores"
ON public.stores FOR SELECT
TO authenticated
USING (true);

-- 例: 自分のユーザー情報のみ閲覧・更新できる
CREATE POLICY "Allow users to manage their own profile"
ON public.anonymous_users FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
*/