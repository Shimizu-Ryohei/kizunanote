# Project Memory

このファイルは、このプロジェクトをいったん離れてから戻ってきたときに、重要な前提と最近の実装判断をすぐ思い出せるようにするためのメモです。

## Stack

- Frontend: Next.js App Router
- Backend: Firebase
  - Firestore
  - Storage
  - Cloud Functions Gen2
  - Cloud Scheduler
  - Firebase Cloud Messaging
- Hosting / deploy:
  - Next.js は Vercel
  - Functions / Rules は Firebase CLI

## Deploy Notes

- Next.js の変更反映:
  - `git push` で Vercel の Production deploy
- Functions の変更反映:
  - `firebase deploy --only functions`
- Rules の変更反映:
  - `firebase deploy --only firestore:rules,storage`

## Environment Variables

- Web Push では VAPID key が必要
- Vercel では少なくとも以下を設定する
  - `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
  - 必要に応じて `FIREBASE_VAPID_KEY` も同値で設定
- フロントでは build-time 埋め込みではなく、`/api/push-config` から runtime 取得する実装に変更済み

## Push Notifications

- 通知設定 UI:
  - `lib/firebase/notification-settings.ts`
  - デフォルト `pushEnabled` は `false`
- Push 初期化:
  - `lib/firebase/push-notifications.ts`
  - VAPID key は runtime fetch
  - 成功した key はメモリキャッシュ
  - 失敗後 5 秒は再試行抑制
- Service Worker:
  - `public/firebase-messaging-sw.js`
- 誕生日通知:
  - `functions/index.js`
  - `sendBirthdayPushNotifications`
  - 毎朝 8:00 JST
  - 対象は `planId === "plus" || planId === "pro"`
  - 3日前: `3日後に{氏名}さんの誕生日です！`
  - 当日: `今日は{氏名}さんの誕生日です！`

## Push Notification Behavior

- バックエンドの送信自体は Cloud Functions ログで `successCount` / `failureCount` を確認できる
- フロントは前面表示中でも通知を抑止しない実装に変更済み
- 「送信成功なのに見えない」時は、まず前面抑止ではなく token / OS 表示側を疑う

## Summary Rules

- 要約生成は `functions/index.js` の OpenAI 呼び出しで実施
- 日本語の要約ルール:
  - `プロフィール本人` は使わない
  - 通常の説明では `本人は` のような主語を省く
  - 関係を示す必要がある時だけ `本人の息子` のように書く
- 保存前正規化で対応済み:
  - `プロフィール本人` -> `本人`
  - 文頭の不自然な `本人は` などを削る
  - 文頭に助詞だけが残る壊れ方を防ぐ

## Workplace Tag

- `workplaceTag` は `functions/index.js` の再要約時に更新される
- 方針:
  - タグは「会社名だけ」に揃える
  - 役職や部署は優先順位の判定には使うが、保存値には残さない
  - 弱い値は採用しない
- 弱い値の例:
  - `株式会社`
  - `有限会社`
  - `合同会社`
  - `会社`
  - `所属`
  - `勤務先`
  - 部署名や役職だけ
- typo 補正:
  - `株式会` -> `株式会社`
  - `有限会` -> `有限会社`
  - `合同会` -> `合同会社`
- 優先順位:
  - `代表取締役` `社長` `会長` `CEO` などの高い役職つき候補を優先
  - `取締役` `執行役員` `創業者` などが次点
  - `経営` `運営` `主宰`
  - `勤務` `所属`
  - `出向` は減点
- 診断ログ:
  - `Workplace tag extraction evaluated.`
  - `bullets`
  - `workplaceCandidates`
  - `existingWorkplaceTag`
  - `extractedWorkplaceTag`
  - `resolvedWorkplaceTag`
  が出る

## Security Notes

- `firebase-debug.log` を誤って commit したことがある
- 対応済み:
  - Git history から除去
  - `.gitignore` に追加
- 再発防止:
  - `firebase-debug.log` は commit しない

## Admin Auth Note

- 管理者メールのハードコードが複数箇所にある
- 将来的には Firebase Custom Claims に寄せるのが望ましい
- env だけへの集約では Firestore Rules の本質的解決にならない

## Useful Checks

- Functions lint:
```bash
npm --prefix functions run lint
```

- Frontend lint:
```bash
npm run lint
```

- 誕生日通知ログ確認:
```bash
firebase functions:log --only sendBirthdayPushNotifications -n 100
```

## Return Checklist

このプロジェクトに戻ってきたら、まず確認すると良いこと:

1. `docs/project-memory.md`
2. `docs/firebase-architecture.md`
3. `functions/index.js` の最近触った周辺
4. 通知や summary を触るなら Firebase / Vercel env が揃っているか
