"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MobileShell from "./mobile-shell";
import { useAuth } from "./auth-provider";
import { getCurrentPlan, getPlanLabel, type PlanId } from "@/lib/firebase/subscription";

function PlanCard({
  name,
  price,
  description,
  features,
  isCurrent,
  ctaLabel,
}: {
  name: string;
  price: string;
  description?: string;
  features: string[];
  isCurrent?: boolean;
  ctaLabel?: string;
}) {
  const isUpgradeCta = ctaLabel?.includes("アップグレード") ?? false;
  const ctaClassName = isUpgradeCta
    ? "bg-[var(--color-main)] text-white font-black"
    : "bg-[var(--color-sub)] text-[var(--color-main)] font-bold";

  return (
    <section className="rounded-[18px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-black text-[#202020]">{name}</h2>
            {isCurrent ? (
              <span className="rounded-full bg-[var(--color-sub)] px-3 py-1 text-[10px] font-black text-[var(--color-main)]">
                利用中
              </span>
            ) : null}
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
      {ctaLabel ? (
        <button
          type="button"
          disabled
          className={`mt-5 flex h-[44px] w-full items-center justify-center rounded-full text-[13px] ${ctaClassName}`}
        >
          {ctaLabel}
        </button>
      ) : null}
    </section>
  );
}

export default function PlanUpgradeScreen() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanId>("standard");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    getCurrentPlan(user.uid)
      .then((planId) => {
        if (!isMounted) {
          return;
        }

        setCurrentPlan(planId);
        setErrorMessage("");
      })
      .catch((error) => {
        console.error(error);

        if (!isMounted) {
          return;
        }

        setErrorMessage("現在のプラン情報の取得に失敗しました。");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2">
          <div className="rounded-[18px] bg-white px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
            <p className="text-[11px] font-bold tracking-[0] text-[#8a8a8a]">現在ご利用中のプラン</p>
            <p className="mt-2 text-[20px] font-black text-[#202020]">
              {isLoading ? "読み込み中..." : getPlanLabel(currentPlan)}
            </p>
            {errorMessage ? (
              <p className="mt-2 text-[12px] font-medium text-[#d64253]">{errorMessage}</p>
            ) : null}
          </div>
          <p className="text-[13px] font-medium leading-6 text-[#7a7a7a]">
            利用スタイルに合わせて、キズナを積み上げるためのプランを選べます。
          </p>
          <div className="mt-4 space-y-4">
            <PlanCard
              name="Standard"
              price="無料"
              isCurrent={currentPlan === "standard"}
              ctaLabel={
                currentPlan === "plus" || currentPlan === "pro"
                  ? "Standardにダウングレードする"
                  : undefined
              }
              features={[
                "20名までのプロフィール登録",
                "無制限のキズナノート要約（毎日要約が実行されます）",
                "勤務先や誕生日などその人を表すタグの表示",
              ]}
            />
            <PlanCard
              name="Plus"
              price="480円/月"
              isCurrent={currentPlan === "plus"}
              ctaLabel="近日リリース予定です"
              description="Standardのすべての機能に加えて："
              features={[
                "無制限のプロフィール登録",
                "誕生日前の連絡サジェスト等、キズナを積み上げるためのサポート通知",
              ]}
            />
            <PlanCard
              name="Pro"
              price="980円/月"
              isCurrent={currentPlan === "pro"}
              ctaLabel="近日リリース予定です"
              description="Plusのすべての機能に加えて："
              features={[
                "即時の要約実行が可能",
                "プロフィールに関連する情報（勤務先のニュースリリース等）をクロールし自動でキズナノートに記録。",
              ]}
            />
          </div>
          <Link
            href="/legal/commerce"
            className="mx-auto mt-6 block w-fit text-[11px] font-medium leading-none text-[#8a8a8a] underline"
          >
            特定商取引法に基づく表記
          </Link>
        </section>
      </main>
    </MobileShell>
  );
}
