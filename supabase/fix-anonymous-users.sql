-- anonymous_usersテーブルの外部キー制約を削除して、独立したテーブルにする

-- 1. まず既存の外部キー制約を削除
ALTER TABLE public.anonymous_users 
DROP CONSTRAINT IF EXISTS anonymous_users_id_fkey;

-- 2. idカラムを通常のUUIDカラムに変更（auth.usersへの参照を削除）
-- 既存のテーブル定義はそのまま使えるので、制約の削除のみで十分

-- 3. 確認のためテーブル構造を表示
-- \d anonymous_users

-- これで anonymous_users テーブルは auth.users から独立し、
-- 任意のUUIDを使って匿名ユーザーを作成できるようになります