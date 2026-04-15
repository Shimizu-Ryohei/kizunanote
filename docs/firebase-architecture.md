# Firebase Architecture Plan

## Goal

現状の UI プロトタイプを、Firebase を使って本番実装へ移行するための設計メモ。

このアプリで Firebase に期待する責務は以下。

- `Firebase Authentication`
  ユーザー登録、ログイン、ログアウト、メールアドレス変更、パスワード変更
- `Cloud Firestore`
  プロフィール、連絡先、キズナノート、設定、課金状態の保持
- `Firebase Storage`
  プロフィール画像の保存
- `Stripe`
  課金、プラン変更、解約

## Recommended Firebase Services

- `Authentication`
  メールアドレス + パスワード認証から開始
- `Firestore`
  メインのアプリデータストア
- `Storage`
  プロフ画像のアップロード先
- `Functions`
  Stripe Webhook、課金状態の同期、重い更新処理

## Data Model

### 1. users

Firebase Auth の `uid` と 1 対 1 で紐づくユーザードキュメント。

Path:

```text
users/{uid}
```

Shape:

```ts
type UserDoc = {
  email: string;
  displayName: string;
  notificationEnabled: boolean;
  notificationPreferences: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    updatedAt: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  subscriptionStatus: "free" | "trialing" | "active" | "past_due" | "canceled";
  stripeCustomerId?: string;
  planId?: string;
};
```

用途:

- `/settings`
- 通知設定
- 課金状態表示

### 2. profiles

ユーザーが管理する人物プロフィール。

Path:

```text
profiles/{profileId}
```

Shape:

```ts
type ProfileDoc = {
  ownerUid: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  fullName: string;
  fullNameKana: string;
  birthday?: string | null; // "1992-11-20"
  photoUrl?: string | null;
  photoStoragePath?: string | null;
  noteCount: number;
  latestNoteAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

用途:

- `/profiles/new`
- `/profiles/[slug or id]`
- `/profiles/[id]/edit-profile`

補足:

- 現 UI はスラッグ固定だが、実装では `profileId` を主キーにするのが安全
- 表示用 URL スラッグが必要なら `slug` を追加

### 3. profileContacts

1 プロフィールにつき 1 ドキュメント。連絡先は履歴ではなく上書き前提なので、常にこの 1 ドキュメントを更新する。

Path:

```text
profiles/{profileId}/private/contact
```

Shape:

```ts
type ProfileContactDoc = {
  phone?: string;
  email?: string;
  x?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  updatedAt: Timestamp;
};
```

用途:

- `/profiles/[id]/contact-info`
- 詳細画面の連絡先カード

### 4. notes

キズナノートは時系列履歴なので、サブコレクションにするのが自然。

Path:

```text
profiles/{profileId}/notes/{noteId}
```

Shape:

```ts
type KizunaNoteDoc = {
  body: string;
  happenedAt: Timestamp;
  summarySource?: "manual" | "ai";
  createdByUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

用途:

- `/profiles/[id]`
- `/profiles/[id]/notes`
- `/profiles/[id]/notes/[noteId]`

補足:

- タイムラインの並びは `happenedAt desc`
- 要約カードは最新数件を取得して AI 要約するか、別途 `summary` を保持

### 5. profileSummaries

要約を都度生成しない運用をするなら保持すると便利。

Path:

```text
profiles/{profileId}/private/summary
```

Shape:

```ts
type ProfileSummaryDoc = {
  bullets: string[];
  generatedAt: Timestamp;
  sourceNoteIds: string[];
};
```

用途:

- `/profiles/[id]` の `キズナノート要約`

### 6. billing

課金状態は `users/{uid}` に最低限置きつつ、履歴は別で持つと扱いやすい。

Path:

```text
users/{uid}/billingEvents/{eventId}
```

Shape:

```ts
type BillingEventDoc = {
  type: "checkout_completed" | "subscription_updated" | "subscription_canceled";
  stripeEventId: string;
  createdAt: Timestamp;
  payload: Record<string, unknown>;
};
```

## Screen Mapping

### `/home`

必要データ:

- `profiles` 一覧
- 必要に応じて最新ノート有無

取得例:

- `profiles where ownerUid == currentUser.uid`
- ソートは `lastNameKana asc`

### `/profiles/new`

保存先:

- `profiles/{profileId}`
- `profiles/{profileId}/private/contact`
- `profiles/{profileId}/private/summary`
- `profiles/{profileId}/notes/{noteId}` if 初回ノートあり
- 画像ありなら Storage

保存ルール:

- ログインユーザーの `uid` を `ownerUid` に必ず保存
- `キズナノート` は履歴として `notes` サブコレクションへ追加
- 連絡先、要約、基本情報は最新状態を単一ドキュメントへ上書き

### `/profiles/[id]`

必要データ:

- `profiles/{id}`
- `profiles/{id}/private/contact`
- `profiles/{id}/notes` の最新数件
- `profiles/{id}/private/summary`

### `/profiles/[id]/edit-profile`

更新先:

- `profiles/{id}`

### `/profiles/[id]/contact-info`

更新先:

- `profiles/{id}/private/contact`

### `/profiles/[id]/notes`

取得先:

- `profiles/{id}/notes`

### `/profiles/[id]/notes/[noteId]`

更新先:

- `profiles/{id}/notes/{noteId}`

### `/settings`

必要データ:

- `users/{uid}`

更新先:

- `users/{uid}.notificationEnabled`
- メールアドレス変更は Firebase Auth
- パスワード変更は Firebase Auth

## Auth Design

初期構成:

- `createUserWithEmailAndPassword`
- `signInWithEmailAndPassword`
- `signOut`
- `updateEmail`
- `updatePassword`

推奨:

- ユーザー作成時に `users/{uid}` を同時生成
- App Router では `middleware` かサーバー読み出しで認証必須ルートを制御

## Storage Design

プロフィール画像パス:

```text
users/{uid}/profiles/{profileId}/avatar.jpg
```

保存フロー:

1. 画像選択
2. Storage にアップロード
3. ダウンロード URL を `profiles/{profileId}.photoUrl` に保存

## Firestore Security Rules Outline

最低限の方針:

- 未ログインはすべて拒否
- `ownerUid == request.auth.uid` のプロフィールだけアクセス可
- notes / contact / summary も親プロフィールの所有者だけアクセス可
- billing は本人のみ読める
- Stripe 同期用の更新は Functions 経由

考え方:

```text
allow read, write: if request.auth != null && resource.data.ownerUid == request.auth.uid
```

実際には create 時の `request.resource.data` も使って組む。

## Implementation Order

### Phase 1. Scaffold Firebase

やること:

- Firebase プロジェクト作成
- Web App 登録
- `.env.local` に接続情報追加
- `firebase` SDK 導入
- `lib/firebase/client.ts` 作成

必要な env:

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Phase 2. Auth

やること:

- 新規登録画面
- ログイン画面
- ログアウト
- ガード導入

### Phase 3. Profiles

やること:

- `/profiles/new` 保存
- `/home` 一覧取得
- `/profiles/[id]` 詳細取得
- `/edit-profile` 更新
- `/contact-info` 更新

### Phase 4. Notes

やること:

- ノート作成
- タイムライン取得
- ノート編集
- AI 要約戦略決定

### Phase 5. Settings

やること:

- 通知設定保存
- メールアドレス変更
- パスワード変更

### Phase 6. Billing

やること:

- Stripe 連携
- checkout
- subscription state sync
- `/settings` か課金ページに反映

## What To Build Next In This Repo

接続前でも先に用意してよいもの:

- `lib/firebase/` の初期構成
- `types/firestore.ts`
- `app/(auth)/sign-in`
- `app/(auth)/sign-up`
- `app/settings/change-email`
- `app/settings/change-password`
- `app/billing`

## Recommended Next Step

次の 1 手として一番よいのはこれ。

1. Firebase プロジェクトを作る
2. 接続用 env をこの repo に入れる
3. こちらで Firebase クライアント初期化と Auth 基盤を実装する

接続情報がまだない間は、この設計をベースに画面と保存処理の責務を固定して進める。
