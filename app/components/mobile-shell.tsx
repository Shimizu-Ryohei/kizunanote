"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type MobileShellProps = {
  children: ReactNode;
};

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
      <path
        d="M4.75 10.5 12 4.75l7.25 5.75v8.75a1 1 0 0 1-1 1h-4.1v-5.4h-4.3v5.4h-4.1a1 1 0 0 1-1-1V10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
      <path
        d="M9.86 4.6c.1-.38.44-.64.84-.64h2.6c.4 0 .74.26.84.64l.39 1.45c.46.19.88.43 1.28.74l1.43-.42c.38-.11.78.04 1 .38l1.3 2.25c.2.35.14.79-.14 1.06l-1.05 1.05c.03.23.05.46.05.7s-.02.47-.05.7l1.05 1.05c.28.27.34.71.14 1.06l-1.3 2.25c-.22.34-.62.49-1 .38l-1.43-.42c-.4.31-.82.55-1.28.74l-.39 1.45c-.1.38-.44.64-.84.64h-2.6a.87.87 0 0 1-.84-.64l-.39-1.45a6.27 6.27 0 0 1-1.28-.74l-1.43.42c-.38.11-.78-.04-1-.38l-1.3-2.25a.9.9 0 0 1 .14-1.06l1.05-1.05A5.76 5.76 0 0 1 5.8 12c0-.24.02-.47.05-.7L4.8 10.25a.9.9 0 0 1-.14-1.06l1.3-2.25c.22-.34.62-.49 1-.38l1.43.42c.4-.31.82-.55 1.28-.74l.39-1.45Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function AppHeader() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-30 mx-auto max-w-[430px] bg-white/95 px-7 pb-3 backdrop-blur"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
    >
      <Link href="/home" aria-label="キズナノート" className="inline-block">
        <Image src="/brand/kizunanote-header.svg" alt="キズナノート" width={202} height={44} className="h-[22px] w-auto" priority />
      </Link>
    </header>
  );
}

export function BottomMenu() {
  const pathname = usePathname();
  const isHomeActive =
    pathname === "/home" || (pathname.startsWith("/profiles") && pathname !== "/profiles/new");
  const isSettingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <nav
      aria-label="メインメニュー"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-black/5 bg-white/95 shadow-[0_-10px_28px_rgba(0,0,0,0.04)] backdrop-blur"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.75rem)" }}
    >
      <div className="grid h-[72px] grid-cols-3 items-end px-6 pb-2">
        <Link
          href="/home"
          aria-label="ホーム"
          className={`justify-self-center flex flex-col items-center gap-1 transition-colors ${
            isHomeActive ? "text-black" : "text-[#b8b8b8]"
          }`}
        >
          <HomeIcon />
          <span className="text-[10px] font-bold leading-none">ホーム</span>
        </Link>
        <Link
          href="/profiles/new"
          aria-label="新規作成"
          className="justify-self-center flex flex-col items-center gap-1 text-[var(--color-main)] transition-colors"
        >
          <span className="relative -top-1 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--color-main)] text-[30px] font-black leading-none text-white">
            <span className="relative -top-px">+</span>
          </span>
          <span className="text-[10px] font-bold leading-none">プロフィール追加</span>
        </Link>
        <Link
          href="/settings"
          aria-label="プロフィール"
          className={`justify-self-center flex flex-col items-center gap-1 transition-colors ${
            isSettingsActive ? "text-black" : "text-[#b8b8b8]"
          }`}
        >
          <SettingsIcon />
          <span className="text-[10px] font-bold leading-none">設定</span>
        </Link>
      </div>
    </nav>
  );
}

export default function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-white sm:bg-[#dedede]">
      <div className="mx-auto min-h-screen max-w-[430px] overflow-hidden bg-[#f7f7f7] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
        <AppHeader />
        <div style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 70px)" }}>{children}</div>
        <BottomMenu />
      </div>
    </div>
  );
}
