# Infrastructure Overview

このドキュメントは、`kizunanote` が現在どの外部サービスを使っているか、何に使っているか、どこで設定するかをざっくり把握するための運用メモ。

## Services

### 1. Vercel

用途:

- Next.js アプリ本体のホスティング
- GitHub 連携による自動デプロイ

主な対象:

- `/home`
- `/profiles/*`
- `/settings/*`
- `/sign-in`, `/sign-up`

設定場所:

- Vercel Project Settings
- Environment Variables

主な環境変数:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

デプロイ方法:

- GitHub に push
- Vercel が自動デプロイ

### 2. Firebase Authentication

用途:

- ログイン
- 新規登録
- メールアドレス変更
- パスワード変更
- アカウント削除

設定場所:

- Firebase Console
- `Authentication`

補足:

- メールリンク認証を使う導線があるため、`Authorized domains` 管理が重要

### 3. Cloud Firestore

用途:

- プロフィール本体
- 連絡先情報
- キズナノート履歴
- 要約データ
- ユーザー設定の一部

主な保存先:

- `users/{uid}`
- `profiles/{profileId}`
- `profiles/{profileId}/notes/{noteId}`
- `profiles/{profileId}/private/contact`
- `profiles/{profileId}/private/summary`

補足:

- 要約は履歴ではなく上書き保存
- 表示系画面は Firestore を読んで描画する

### 4. Firebase Storage

用途:

- プロフィール画像の保存

保存パス例:

- `users/{uid}/profiles/{profileId}/avatar`

補足:

- 画像はクライアント側で圧縮後にアップロード

### 5. Firebase Functions

用途:

- OpenAI を使ったプロフィール要約の定期実行

現在の関数:

- `summarizeProfilesDaily`

実行条件:

- 毎日 `05:00`
- `Asia/Tokyo`
- `summaryStatus` が `pending` または `error` のプロフィールを対象

コード場所:

- [functions/index.js](/Users/ryoheishimizu/kizunanote/functions/index.js)

### 6. Cloud Scheduler

用途:

- `summarizeProfilesDaily` の定期実行トリガー

補足:

- 手動テスト時は `Run now` で強制実行できる

### 7. OpenAI API

用途:

- キズナノート要約の生成

現在の使い方:

- Firebase Functions からサーバー側で呼び出し
- Responses API を利用
- `gpt-4o-mini` を既定モデルとして利用

Secret:

- `OPENAI_API_KEY`

補足:

- Secret は Firebase Functions Secret Manager 経由で参照
- key はチャットや Git に貼らない

### 8. GitHub

用途:

- ソースコード管理
- Vercel 連携の起点

補足:

- GitHub 自体はコード保管
- 実アプリ配信は Vercel

## Runtime Flow

### Web app

1. ユーザーが Vercel 上の Next.js アプリを開く
2. フロントは Firebase Auth / Firestore / Storage に接続
3. データ取得と保存を行う

### Summary flow

1. ノート追加または編集
2. `profiles/{profileId}.summaryStatus = "pending"`
3. 毎朝 5:00 に Cloud Scheduler が `summarizeProfilesDaily` を実行
4. Function が Firestore から対象プロフィールとノートを取得
5. OpenAI API で要約生成
6. `profiles/{profileId}/private/summary` を上書き
7. `/profiles/[profileId]` が Firestore の summary を表示

## Deploy Flow

### Next.js app

1. GitHub に push
2. Vercel が自動デプロイ

### Firebase Functions

1. `functions/` のコードを更新
2. 必要なら Secret 更新
3. `firebase deploy --only functions`

## Secrets And Env

### ローカル `.env.local`

用途:

- Next.js クライアントが参照する Firebase Web App 設定

主な値:

- `NEXT_PUBLIC_FIREBASE_*`

注意:

- `.env.local` は Git 管理しない

### Firebase Functions Secret

用途:

- OpenAI API key の保管

設定コマンド:

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

注意:

- ターミナル上では入力がマスクされる
- key はこのチャットやリポジトリに貼らない

## Cost Points

料金が発生しやすい順に見ると:

1. OpenAI API
2. Firebase Functions / Scheduler / Firestore / Storage
3. Vercel
4. GitHub

補足:

- テキスト主体の更新は GitHub / Vercel では比較的軽い
- 画像・API 呼び出し・関数実行がコスト源になりやすい
- 要約処理は `更新があったプロフィールのみ` を対象にしているため、無駄な実行を抑える設計

## Where To Check When Something Breaks

### ログインや登録が失敗する

- Firebase Console > Authentication
- Vercel Environment Variables

### 画像が保存されない

- Firebase Storage
- Storage Rules

### 一覧や詳細が出ない

- Firestore データ
- Firestore Rules

### 要約が出ない

- Cloud Scheduler の `Run now`
- Firebase Functions logs
- Firestore の `profiles/{profileId}/private/summary`
- OpenAI quota / billing

## Related Docs

- [README.md](/Users/ryoheishimizu/kizunanote/README.md)
- [firebase-architecture.md](/Users/ryoheishimizu/kizunanote/docs/firebase-architecture.md)
- [functions/README.md](/Users/ryoheishimizu/kizunanote/functions/README.md)
