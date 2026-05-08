# プロジェクト概要
このプロジェクトは、ユーザーが契約しているサブスクリプション（継続課金）サービスを一元管理し、支出の最適化をサポートするWebアプリケーションです。

## 技術スタック
* **Frontend:** React, TypeScript, Next.js (App Router推奨) または Vite
* **Backend / Database / Auth:** Supabase (PostgreSQL)
* **Hosting:** Vercel

## 基本機能
1.  **サブスクリプションのCRUD管理**
    * サービス名、プラン名、備考（テキスト）の登録。
    * 契約状態の管理（アクティブ / 解約済みアーカイブ）。
2.  **支払いサイクルの設定**
    * 「月払い」「年払い」の区分け。
    * 年額・月額の自動換算機能（年額を12で割った月額換算、月額を12倍した年額換算）。
3.  **支払い詳細の設定**
    * 支払い方法（クレジットカード〇〇、銀行振込、PayPalなど）の登録。
    * 次回の引き落とし日（更新日）の設定。
4.  **外貨対応**
    * 支払い通貨の選択（JPY, USD, EURなど）。
    * 登録時の為替レート、またはAPIによる最新レートを用いた日本円（JPY）への自動換算。
5.  **ジャンル分け（マルチセレクト）**
    * 「動画」「音楽」「健康」「仕事（AIツール）」など、ユーザーが自由にタグを作成し、複数設定できる機能。
6.  **使用頻度の設定**
    * 「毎日」「週に数回」「月に数回」「ほとんど使っていない」など、利用状況を記録する機能。

## 拡張・分析機能
1.  **ダッシュボード（支出・分析ビュー）**
    * 毎月の支払い総額（日本円換算済み）の表示。
    * ジャンル別の支出割合グラフ（円グラフ等）。
    * **コストパフォーマンス分析:** 「金額が高い」かつ「使用頻度が低い」サブスクをハイライトし、解約候補として提案する機能。
2.  **リマインダー・通知機能**
    * 無料トライアル終了日の〇日前に通知。
    * 年額支払いの更新月（1ヶ月前など）に通知。
    * ※初期はアプリ内のUIアラートで実装し、将来的にメール/Push通知を検討。

## コーディング規約
* **Language:** TypeScriptを厳格に使用し、型定義を徹底する（`any`型の使用は極力避ける）。型定義には原則として `type` を使用する。
* **Components:** Reactの関数コンポーネントを使用し、アロー関数で定義する（例: `const Component = () => {}`）。
* **Naming Conventions:**
    * コンポーネント名・ファイル名（コンポーネント）: PascalCase (例: `SubscriptionCard.tsx`)
    * 変数名・関数名: camelCase (例: `calculateTotalCost`, `handleSave`)
    * 定数: UPPER_SNAKE_CASE (例: `MAX_RETRY_COUNT`)
* **Styling:**
    * スタイリングには **Tailwind CSS** を使用する。
    * 複雑な条件分岐によるクラス名の切り替えには `clsx` や `tailwind-merge` などのライブラリを適宜使用し、可読性を保つこと。
* **Code Structure:**
    * 可読性を高めるため、早期リターン（Early Return）を積極的に使用し、ネストを浅く保つ。
    * 1つのファイルが長くなりすぎないよう、コンポーネントやロジック（カスタムフック）を適切に分割する。
* **Data Fetching:** 非同期処理は `.then()` ではなく `async/await` で統一し、エラーハンドリング（`try/catch`）を必ず実装する。

## Database Schema (Supabase / PostgreSQL)

### 1. `subscriptions` テーブル
サブスクリプションのメインデータを保持します。
* `id`: uuid (Primary Key, default: uuid_generate_v4())
* `user_id`: uuid (References auth.users.id, NOT NULL)
* `name`: text (サービス名, NOT NULL)
* `plan_name`: text (プラン名)
* `price`: numeric (価格, NOT NULL)
* `currency`: text (通貨コード: 'JPY', 'USD', 'EUR' など, default: 'JPY')
* `billing_cycle`: text ('monthly' or 'yearly', NOT NULL)
* `payment_method`: text (支払い方法)
* `next_billing_date`: date (次回引き落とし日)
* `usage_frequency`: text (使用頻度: 'high', 'medium', 'low', 'none' など)
* `status`: text (ステータス: 'active' or 'archived', default: 'active')
* `remarks`: text (備考)
* `created_at`: timestamptz (default: now())
* `updated_at`: timestamptz (default: now())

### 2. `genres` テーブル
ユーザーが自由に設定できるジャンル（タグ）のマスタです。
* `id`: uuid (Primary Key, default: uuid_generate_v4())
* `user_id`: uuid (References auth.users.id, NOT NULL)
* `name`: text (ジャンル名: '動画', '健康', '仕事' など, NOT NULL)
* `color`: text (UI表示用のカラーコード等)
* `created_at`: timestamptz (default: now())

### 3. `subscription_genres` テーブル
サブスクとジャンルを紐付ける中間テーブル（多対多の関係）。
* `subscription_id`: uuid (References subscriptions.id, ON DELETE CASCADE)
* `genre_id`: uuid (References genres.id, ON DELETE CASCADE)
* Primary Key: (`subscription_id`, `genre_id`)

## RLS (Row Level Security) Policies
* 全てのテーブルにおいて `Row Level Security` を有効化する。
* `user_id` が `auth.uid()` と一致するデータのみ、ユーザーが CRUD 操作を行えるように制限する。