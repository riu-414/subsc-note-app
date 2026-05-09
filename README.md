# Subsc Note

サブスクリプション（継続課金）サービスを一元管理して支出を最適化するための個人向け Web アプリ。
複数通貨対応・ジャンル分類・コスパ分析・トライアル/引き落としリマインダーなどを備えています。

Live Demo: [https://subsc-note-app.vercel.app](https://subsc-note-app.vercel.app/)

## 主な機能

### サブスク管理

- サービス名 / プラン名 / 価格 / 通貨 / 支払いサイクル / 備考の CRUD
- **複数通貨**（JPY / USD / EUR / GBP / KRW）に対応
- **月払い / 年払い**ごとに分けて月額・年額合計を表示
- 外貨設定時は **JPY 換算（≈ X円）** をカードに併記
- **「契約中」「解約」** の 2 タブでサブスクを管理（誤って削除されない）
- 月払いセクション → 年払いセクションでグループ表示
- 検索・並び替え・ジャンルフィルタ

### ジャンル / 支払い方法

- ユーザー定義のジャンルを **チップで複数選択**
- ジャンル管理モーダルから名前・色をインライン編集 / 削除
- 支払い方法も同様にマスタ管理＋チップ選択
- 初回オンボーディングで定番ジャンル 5 種を一括登録

### 分析・通知

- ジャンル別の月額構成を **円グラフ**で可視化
- 「金額が高い × 使用頻度が低い」サブスクを **解約候補としてハイライト**
- 直近 30 日の引き落とし予定 + 直近 14 日の **トライアル終了**を統合バナー表示
- カードの引き落とし日は「**毎月15日 · 次回 2026-05-15（7日後）**」のように、
  保存値の "日" 部分から次回日を自動計算（過去日に固定されない）

### 為替レート

- 起動時に [ExchangeRate-API](https://www.exchangerate-api.com/) から最新レートを取得
- 失敗時は [Frankfurter / ECB](https://www.frankfurter.app/) にフォールバック
- localStorage に 24 時間キャッシュ
- ヘッダーの「為替」バッジをクリックすると、
  `1 USD = ¥155.20` 形式の通貨ペア一覧と取得元を確認可能

## 技術スタック

| カテゴリ | 採用技術 |
| --- | --- |
| フロントエンド | React / TypeScript / Vite |
| スタイリング | Tailwind CSS v4（`@tailwindcss/vite`）+ `clsx` + `tailwind-merge` |
| アイコン | lucide-react |
| グラフ | Recharts（`React.lazy` で遅延ロード） |
| バックエンド / 認証 / DB | Supabase（PostgreSQL + Auth + RLS） |
| デプロイ想定 | Vercel |

## セットアップ手順

### 1. リポジトリクローン & 依存インストール

```bash
git clone <repo>
cd subsc-note-app
npm install
```

### 2. Supabase プロジェクトを作成

1. [Supabase](https://supabase.com) で新規プロジェクトを作成
2. **Settings → API** から `Project URL` と `anon public` キーを控える
3. **SQL Editor** で次の DDL を実行（テーブル + RLS + 自動 updated_at + 既存データ移行）

```sql
create extension if not exists "uuid-ossp";

-- 1. subscriptions
create table if not exists public.subscriptions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  plan_name         text,
  price             numeric not null check (price >= 0),
  currency          text not null default 'JPY',
  billing_cycle     text not null check (billing_cycle in ('monthly', 'yearly')),
  payment_method    text,
  next_billing_date date,
  trial_end_date    date,
  usage_frequency   text check (usage_frequency in ('high','medium','low','none')),
  status            text not null default 'active' check (status in ('active','archived')),
  remarks           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);
create index if not exists subscriptions_next_billing_date_idx on public.subscriptions(next_billing_date);

-- 2. genres
create table if not exists public.genres (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create index if not exists genres_user_id_idx on public.genres(user_id);

-- 3. subscription_genres (M:N)
create table if not exists public.subscription_genres (
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  genre_id        uuid not null references public.genres(id) on delete cascade,
  primary key (subscription_id, genre_id)
);
create index if not exists subscription_genres_genre_id_idx on public.subscription_genres(genre_id);

-- 4. payment_methods (master list)
create table if not exists public.payment_methods (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create index if not exists payment_methods_user_id_idx on public.payment_methods(user_id);

-- 5. updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- 6. RLS 有効化
alter table public.subscriptions       enable row level security;
alter table public.genres              enable row level security;
alter table public.subscription_genres enable row level security;
alter table public.payment_methods     enable row level security;

-- 7. RLS ポリシー: subscriptions
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (auth.uid() = user_id);
drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own" on public.subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "subscriptions_delete_own" on public.subscriptions;
create policy "subscriptions_delete_own" on public.subscriptions
  for delete using (auth.uid() = user_id);

-- 8. RLS ポリシー: genres
drop policy if exists "genres_select_own" on public.genres;
create policy "genres_select_own" on public.genres
  for select using (auth.uid() = user_id);
drop policy if exists "genres_insert_own" on public.genres;
create policy "genres_insert_own" on public.genres
  for insert with check (auth.uid() = user_id);
drop policy if exists "genres_update_own" on public.genres;
create policy "genres_update_own" on public.genres
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "genres_delete_own" on public.genres;
create policy "genres_delete_own" on public.genres
  for delete using (auth.uid() = user_id);

-- 9. RLS ポリシー: subscription_genres (親リソースの所有者で判定)
drop policy if exists "subscription_genres_select_own" on public.subscription_genres;
create policy "subscription_genres_select_own" on public.subscription_genres
  for select using (
    exists (select 1 from public.subscriptions s
            where s.id = subscription_genres.subscription_id and s.user_id = auth.uid())
  );
drop policy if exists "subscription_genres_insert_own" on public.subscription_genres;
create policy "subscription_genres_insert_own" on public.subscription_genres
  for insert with check (
    exists (select 1 from public.subscriptions s
            where s.id = subscription_genres.subscription_id and s.user_id = auth.uid())
    and exists (select 1 from public.genres g
                where g.id = subscription_genres.genre_id and g.user_id = auth.uid())
  );
drop policy if exists "subscription_genres_delete_own" on public.subscription_genres;
create policy "subscription_genres_delete_own" on public.subscription_genres
  for delete using (
    exists (select 1 from public.subscriptions s
            where s.id = subscription_genres.subscription_id and s.user_id = auth.uid())
  );

-- 10. RLS ポリシー: payment_methods
drop policy if exists "payment_methods_select_own" on public.payment_methods;
create policy "payment_methods_select_own" on public.payment_methods
  for select using (auth.uid() = user_id);
drop policy if exists "payment_methods_insert_own" on public.payment_methods;
create policy "payment_methods_insert_own" on public.payment_methods
  for insert with check (auth.uid() = user_id);
drop policy if exists "payment_methods_update_own" on public.payment_methods;
create policy "payment_methods_update_own" on public.payment_methods
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "payment_methods_delete_own" on public.payment_methods;
create policy "payment_methods_delete_own" on public.payment_methods
  for delete using (auth.uid() = user_id);

-- 11. 検証
select 'tables' as kind,
       (select count(*) from pg_tables where schemaname='public'
        and tablename in ('subscriptions','genres','subscription_genres','payment_methods')) as count;
```

最後の `select` 文で `count = 4` が返れば成功です。

### 3. 環境変数を設定

プロジェクトルートに `.env.local` を作成（`.env.local.example` をコピー）：

```bash
cp .env.local.example .env.local
```

`.env.local`:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. 開発サーバ起動

```bash
npm run dev
```

`http://localhost:5173` を開き、Sign Up からアカウントを作成すれば利用開始できます。

## 利用可能なスクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | Vite 開発サーバ（HMR 有効） |
| `npm run build` | TypeScript 型チェック + プロダクションビルド（`dist/` 出力） |
| `npm run preview` | ビルド済成果物のローカルプレビュー |
| `npm run lint` | ESLint 実行 |

## プロジェクト構成

```
src/
├── components/
│   ├── analytics/        # 円グラフ・解約候補
│   ├── auth/             # ログイン / サインアップ
│   ├── genres/           # ジャンル選択 / 管理モーダル
│   ├── layout/           # ヘッダー / ダッシュボード / 為替ステータス
│   ├── onboarding/       # 初回プリセット追加カード
│   ├── payment-methods/  # 支払い方法選択
│   ├── reminders/        # リマインダーバナー
│   ├── subscriptions/    # CRUD UI / カード / ツールバー
│   └── ui/               # Button / Modal / TextField
├── hooks/
│   ├── useAuth.ts            # Supabase Auth セッション監視
│   ├── useExchangeRates.ts   # 為替レート取得 (useSyncExternalStore)
│   ├── useGenres.ts          # ジャンル CRUD
│   ├── usePaymentMethods.ts  # 支払い方法 CRUD
│   └── useSubscriptions.ts   # サブスク CRUD + ジャンル紐付け
├── lib/
│   ├── analytics.ts      # ジャンル集計 / 解約候補 / リマインダー
│   ├── auth.ts           # Supabase Auth ラッパー
│   ├── billing.ts        # 次回引落日の自動算出 / 「毎月◯日」表記
│   ├── constants.ts      # 通貨候補・サイクル・使用頻度・プリセット
│   ├── currency.ts       # 通貨換算 / フォーマット
│   ├── exchangeRates.ts  # レート格納 (Pub/Sub ストア)
│   ├── supabase.ts       # 型付き Supabase クライアント
│   └── utils.ts          # cn() (clsx + tailwind-merge)
└── types/
    └── database.ts       # Supabase Database 型
```

## データベーススキーマ

| テーブル | 役割 |
| --- | --- |
| `subscriptions` | サブスクのメインデータ |
| `genres` | ユーザー定義ジャンル（マスタ） |
| `subscription_genres` | サブスクとジャンルの多対多中間テーブル |
| `payment_methods` | 支払い方法（マスタ）。`subscriptions.payment_method` には名前を文字列で保持 |

全テーブルに **Row Level Security** を有効化。`auth.uid() = user_id` のレコードのみ CRUD 可能です。

## コーディング規約

- TypeScript 厳格モード（`any` は極力使わない、型は `type` で定義）
- React 関数コンポーネント + アロー関数で定義
- ファイル名は PascalCase（コンポーネント） / camelCase（フック・ユーティリティ）
- スタイリングは Tailwind CSS。条件分岐クラスは `cn()`（`clsx` + `tailwind-merge`）で結合
- 早期リターンでネストを浅く保つ
- 非同期処理は `async/await` + `try/catch` で統一

詳細は `CLAUDE.md` を参照。

## 為替レートの取得元

| 用途 | エンドポイント | 提供元 |
| --- | --- | --- |
| プライマリ | `https://open.er-api.com/v6/latest/JPY` | [ExchangeRate-API](https://www.exchangerate-api.com/) |
| フォールバック | `https://api.frankfurter.app/latest?from=JPY` | [Frankfurter](https://www.frankfurter.app/)（ECB データ） |

両方失敗した場合は `src/lib/exchangeRates.ts` に埋め込んだ参考値で動作します。

## ライセンス

個人プロジェクト。
