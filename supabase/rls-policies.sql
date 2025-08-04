-- RLS Policies for Price Tracker MVP

-- 1. Anonymous Users テーブル
-- 誰でも自分の匿名ユーザー情報を作成・読み取りできる
CREATE POLICY "Anyone can create anonymous user"
ON public.anonymous_users FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anyone can read anonymous users"
ON public.anonymous_users FOR SELECT
TO anon
USING (true);

-- 2. Stores テーブル
-- 誰でも店舗情報を読み取れる
CREATE POLICY "Anyone can read stores"
ON public.stores FOR SELECT
TO anon
USING (true);

-- 3. Products テーブル
-- 誰でも商品情報を読み取れる
CREATE POLICY "Anyone can read products"
ON public.products FOR SELECT
TO anon
USING (true);

-- 誰でも商品を作成できる（MVP用）
CREATE POLICY "Anyone can create products"
ON public.products FOR INSERT
TO anon
WITH CHECK (true);

-- 4. Prices テーブル
-- 誰でも価格情報を読み取れる
CREATE POLICY "Anyone can read prices"
ON public.prices FOR SELECT
TO anon
USING (true);

-- 誰でも価格を投稿できる（MVP用）
CREATE POLICY "Anyone can submit prices"
ON public.prices FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Latest Prices ビューは自動的に権限が継承される