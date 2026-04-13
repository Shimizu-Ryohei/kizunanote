This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Firebase Setup

1. Create a Firebase project and add a Web App in the Firebase console.
2. Copy `.env.local.example` to `.env.local`.
3. Fill in the `NEXT_PUBLIC_FIREBASE_*` values from your Firebase Web App config.
4. Fill in `OPENAI_API_KEY` if you want to enable daily profile summarization.
4. Use [`lib/firebase/client.ts`](/Users/ryoheishimizu/kizunanote/lib/firebase/client.ts) to access:
   - `firebaseAuth`
   - `firestore`
   - `storage`

## Scheduled Summaries

- Profile summaries are stored in Firestore at `profiles/{profileId}/private/summary`.
- Notes mark the profile as `summaryStatus: "pending"` when added or edited.
- A Firebase scheduled function runs every day at `05:00` (`Asia/Tokyo`) and refreshes summaries for pending profiles.
- Function source lives in [functions/index.js](/Users/ryoheishimizu/kizunanote/functions/index.js).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
