-- Row Level Security (RLS) ポリシー定義
-- MVPでは匿名アクセスを許可するシンプルなポリシーを設定

-- 1. stores テーブルのポリシー
-- 全員が店舗情報を閲覧可能
CREATE POLICY "Allow anyone to read stores"
ON public.stores FOR SELECT
TO anon
USING (true);

-- 2. products テーブルのポリシー
-- 全員が商品情報を閲覧可能
CREATE POLICY "Allow anyone to read products"
ON public.products FOR SELECT
TO anon
USING (true);

-- 全員が商品を作成可能（重複チェックはアプリケーション側で実施）
CREATE POLICY "Allow anyone to create products"
ON public.products FOR INSERT
TO anon
WITH CHECK (true);

-- 3. prices テーブルのポリシー
-- 全員が価格情報を閲覧可能
CREATE POLICY "Allow anyone to read prices"
ON public.prices FOR SELECT
TO anon
USING (true);

-- 全員が価格を投稿可能
CREATE POLICY "Allow anyone to create prices"
ON public.prices FOR INSERT
TO anon
WITH CHECK (true);

-- 4. anonymous_users テーブルのポリシー
-- 自分の情報のみ閲覧・作成可能
CREATE POLICY "Allow users to manage their own profile"
ON public.anonymous_users FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);