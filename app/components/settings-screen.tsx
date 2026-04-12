"use client";

import { useState } from "react";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import MobileShell from "./mobile-shell";

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
}: {
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex h-[52px] w-full items-center rounded-[14px] bg-white px-5 text-left text-[14px] font-medium text-[#2f2f2f] shadow-[0_1px_0_rgba(0,0,0,0.01)]"
    >
      <span className="flex-1 text-[14px] font-medium leading-none">{label}</span>
      <span className="text-[#c8c8c8]">
        <ChevronRight />
      </span>
    </button>
  );
}

function NotificationRow() {
  const [enabled, setEnabled] = useState(true);

  return (
    <button
      type="button"
      onClick={() => setEnabled((current) => !current)}
      className="flex h-[52px] w-full items-center rounded-[14px] bg-white px-5 text-left text-[14px] font-medium text-[#2f2f2f] shadow-[0_1px_0_rgba(0,0,0,0.01)]"
    >
      <span className="flex-1 text-[14px] font-medium leading-none">通知設定</span>
      <span
        className={`flex h-5 w-9 items-center rounded-full p-[2px] transition-colors ${
          enabled ? "bg-[#59c183]" : "bg-[#dedede]"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full transition-transform ${
            enabled ? "translate-x-4 bg-white" : "translate-x-0 bg-white"
          }`}
        />
      </span>
    </button>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2">
          <div className="space-y-3">
            <SettingRow label="ログインID変更" />
            <SettingRow label="パスワード変更" />
            <NotificationRow />
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
          <button
            type="button"
            className="mx-auto mt-6 block text-[10px] leading-none font-medium text-[#b5b5b5] underline"
            style={{ fontSize: "10px", lineHeight: 1 }}
          >
            アカウントを削除する
          </button>
        </section>
      </main>
    </MobileShell>
  );
}
