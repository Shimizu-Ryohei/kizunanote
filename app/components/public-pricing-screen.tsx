"use client";

import Image from "next/image";
import Link from "next/link";

function PlanCard({
  name,
  price,
  description,
  features,
}: {
  name: string;
  price: string;
  description?: string;
  features: string[];
}) {
  return (
    <section className="rounded-[18px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-black text-[#202020]">{name}</h2>
          </div>
          {description ? (
            <p className="mt-2 text-[12px] font-medium leading-5 text-[#6a6a6a]">{description}</p>
          ) : null}
        </div>
        <p className="shrink-0 pt-1 text-right text-[14px] font-black text-[#202020]">{price}</p>
      </div>
      <ul className="mt-5 space-y-3 text-[13px] font-medium leading-6 text-[#404040]">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-main)]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PublicPricingScreen() {
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <div className="mx-auto max-w-[430px]">
        <header className="flex h-[68px] items-center justify-between bg-white px-5">
          <Image
            src="/brand/kizunanote-logotype.svg"
            alt="キズナノート"
            width={202}
            height={44}
            className="h-11 w-auto"
            priority
          />
          <Link
            href="/sign-up"
            className="inline-flex h-[38px] items-center justify-center rounded-full bg-[var(--color-main)] px-4 text-[12px] font-black text-white"
          >
            新規登録する
          </Link>
        </header>

        <main className="px-4 pb-12 pt-5">
          <section>
            <h1 className="text-[24px] font-black text-[#202020]">料金プラン</h1>
            <p className="mt-3 text-[13px] font-medium leading-6 text-[#7a7a7a]">
              利用スタイルに合わせて、プランを選べます。「Plus」「Pro」は新規登録後にアップグレードできます。
            </p>
            <div className="mt-5 space-y-4">
              <PlanCard
                name="Standard"
                price="無料"
                features={[
                  "20名までのプロフィール登録",
                  "無制限のキズナノート要約（毎日要約が実行されます）",
                  "勤務先や誕生日などその人を表すタグの表示",
                ]}
              />
              <PlanCard
                name="Plus"
                price="480円/月"
                description="Standardのすべての機能に加えて："
                features={[
                  "無制限のプロフィール登録",
                  "誕生日前の連絡サジェスト等、キズナを積み上げるためのサポート通知",
                ]}
              />
              <PlanCard
                name="Pro"
                price="980円/月"
                description="Plusのすべての機能に加えて："
                features={[
                  "即時の要約実行が可能",
                  "プロフィールに関連する情報（勤務先のニュースリリース等）をクロールし自動でキズナノートに記録。",
                ]}
              />
            </div>
          </section>
        </main>
      </div>
    </main>
  );
}
