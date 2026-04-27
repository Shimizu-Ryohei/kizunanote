"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/firebase/auth";
import { getCurrentSubscription, getPlanLabel, type PlanId } from "@/lib/firebase/subscription";
import { useRouter } from "next/navigation";
import MobileShell from "./mobile-shell";
import { useAuth } from "./auth-provider";

function ChevronRight() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="m10 7 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingRow({
  label,
  href,
  value,
}: {
  label: string;
  href?: string;
  value?: string;
}) {
  const content = (
    <span className="flex h-[52px] w-full items-center rounded-[14px] bg-white px-5 text-left text-[14px] font-medium text-[#2f2f2f] shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <span className="flex flex-1 items-center gap-2 text-[14px] font-medium leading-none">
        <span>{label}</span>
        {value ? (
          <span className="rounded-full bg-[var(--color-sub)] px-2.5 py-1 text-[10px] font-black leading-none text-[var(--color-main)]">
            {value}
          </span>
        ) : null}
      </span>
      <span className="text-[#c8c8c8]">
        <ChevronRight />
      </span>
    </span>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return <button type="button" className="block w-full">{content}</button>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanId>("standard");

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    getCurrentSubscription(user.uid)
      .then((subscription) => {
        if (isMounted) {
          setCurrentPlan(subscription.effectivePlanId);
        }
      })
      .catch((error) => {
        console.error("Failed to load current plan", error);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2">
          <div className="space-y-3">
            <SettingRow
              label="プラン変更"
              href="/settings/upgrade"
              value={getPlanLabel(currentPlan)}
            />
            <SettingRow label="ログインID変更" href="/settings/change-login-id" />
            <SettingRow label="パスワード変更" href="/settings/change-password" />
            <SettingRow label="通知設定" href="/settings/notifications" />
            <SettingRow label="よくある質問" href="/settings/faq" />
            <SettingRow label="利用規約等" href="/settings/legal" />
            <SettingRow label="特定商取引法に基づく表記" href="/legal/commerce" />
          </div>
        </section>

        <section className="mt-16">
          <button
            type="button"
            className="mx-auto flex h-[40px] w-[150px] items-center justify-center rounded-full border border-[#ededed] bg-white text-center text-[12px] font-medium text-[#7c7c7c]"
            onClick={async () => {
              await signOut();
              router.replace("/sign-in");
            }}
          >
            <span>ログアウトする</span>
          </button>
          <Link
            href="/settings/delete-account"
            className="mx-auto mt-6 block w-fit text-center text-[10px] leading-none font-medium text-[#b5b5b5] underline"
            style={{ fontSize: "10px", lineHeight: 1 }}
          >
            アカウントを削除する
          </Link>
          <Link
            href="/contact"
            className="mx-auto mt-4 block w-fit text-center text-[10px] leading-none font-medium text-[#b5b5b5] underline"
            style={{ fontSize: "10px", lineHeight: 1 }}
          >
            お問い合わせはこちら
          </Link>
        </section>
      </main>
    </MobileShell>
  );
}
