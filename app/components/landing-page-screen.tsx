"use client";

import Image from "next/image";
import Link from "next/link";

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-[24px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <h2 className="text-[16px] font-black text-[#1f1f1f]">{title}</h2>
      <p className="mt-3 text-[13px] font-medium leading-7 text-[#676767]">{description}</p>
    </section>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-[22px] border border-[#e6eefc] bg-white px-5 py-5">
      <span className="inline-flex rounded-full bg-[var(--color-sub)] px-3 py-1 text-[10px] font-black text-[var(--color-main)]">
        {step}
      </span>
      <h3 className="mt-4 text-[15px] font-black text-[#1f1f1f]">{title}</h3>
      <p className="mt-2 text-[13px] font-medium leading-7 text-[#676767]">{description}</p>
    </section>
  );
}

export default function LandingPageScreen() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] px-0 py-0 sm:px-0">
      <div className="mx-auto max-w-[430px]">
        <header className="flex h-[68px] items-center justify-between bg-white px-5">
          <Image
            src="/brand/kizunanote-header.svg"
            alt="キズナノート"
            width={202}
            height={44}
            className="h-[22px] w-auto"
            priority
          />
          <Link
            href="/sign-up"
            className="inline-flex h-[38px] items-center justify-center rounded-full bg-[var(--color-main)] px-4 text-[12px] font-black text-white"
          >
            新規登録する
          </Link>
        </header>

        <section>
          <Image
            src="/brand/lp-hero-v2.png"
            alt="キズナノートの利用イメージ"
            width={1366}
            height={768}
            className="h-auto w-full"
            priority
          />
        </section>

        <section className="mt-4 space-y-3 px-5">
          <Link
            href="/sign-up"
            className="flex h-[56px] w-full items-center justify-center rounded-full bg-[var(--color-main)] text-[15px] font-black text-white shadow-[0_12px_28px_rgba(48,124,255,0.2)]"
          >
            無料で新規登録する
          </Link>
          <Link
            href="/sign-in"
            className="flex h-[52px] w-full items-center justify-center rounded-full border border-[#dce7ff] bg-white text-[14px] font-bold text-[var(--color-main)]"
          >
            ログイン
          </Link>
        </section>

        <section className="mt-5 space-y-4 px-5">
          <FeatureCard
            title="相手のことを自然に思い出せる"
            description="キズナノートに会話内容や趣味、家族情報などを記録しておくことで、次に会うときのきっかけや自然な話題づくりに役立ちます。"
          />
          <FeatureCard
            title="AIがキズナノートを要約"
            description="登録したキズナノートは毎朝自動で要約されます。勤務先や誕生日など、その人を表す情報を一覧や詳細で見返せます。"
          />
          <FeatureCard
            title="連絡のきっかけを逃さない"
            description="誕生日や最近連絡していない相手を思い出しやすくし、関係を少しずつ積み上げていくための土台になります。"
          />
        </section>

        <section className="mt-8 px-5">
          <h2 className="text-[18px] font-black text-[#1f1f1f]">はじめ方</h2>
          <div className="mt-4 space-y-3">
            <StepCard
              step="STEP 1"
              title="知り合いを登録"
              description="氏名、生年月日、写真を登録して、まずは覚えておきたい相手のプロフィールを作成します。"
            />
            <StepCard
              step="STEP 2"
              title="キズナノートを書く"
              description="会話した内容や趣味、家族情報などを簡単にメモして、次のコミュニケーションに活かせる情報を残します。"
            />
            <StepCard
              step="STEP 3"
              title="要約やタグで見返す"
              description="積み上がったメモを AI が要約し、一覧と詳細ページで相手の情報をすぐに思い出せる形に整えます。"
            />
          </div>
        </section>

        <section className="mx-5 mt-8 rounded-[28px] bg-white px-6 py-6 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
          <h2 className="text-[18px] font-black text-[#1f1f1f]">まずは無料で始める</h2>
          <p className="mt-3 text-[13px] font-medium leading-7 text-[#676767]">
            Standardプランでは20名までのプロフィール登録と、毎日の要約機能を無料で利用できます。
          </p>
          <Link
            href="/sign-up"
            className="mt-5 flex h-[56px] w-full items-center justify-center rounded-full bg-[var(--color-main)] text-[15px] font-black text-white"
          >
            新規登録へ進む
          </Link>
        </section>

        <section className="px-5 pb-10 pt-6 text-center">
          <Link
            href="/legal"
            className="mx-auto block w-fit text-[11px] font-medium leading-none text-[#8a8a8a] underline"
          >
            利用規約等
          </Link>
          <Link
            href="/contact"
            className="mx-auto mt-4 block w-fit text-[11px] font-medium leading-none text-[#8a8a8a] underline"
          >
            お問い合わせはこちら
          </Link>
        </section>
      </div>
    </main>
  );
}
