import type { ReactNode } from "react";
import Link from "next/link";

type MobileShellProps = {
  children: ReactNode;
};

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 24 24" fill="none">
      <path
        d="M4.75 10.5 12 4.75l7.25 5.75v8.75a1 1 0 0 1-1 1h-4.1v-5.4h-4.3v5.4h-4.1a1 1 0 0 1-1-1V10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 12.25a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5.75 19.25c.65-2.6 2.95-4.15 6.25-4.15s5.6 1.55 6.25 4.15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 mx-auto max-w-[430px] bg-white/95 px-7 pb-3 pt-5 backdrop-blur">
      <h1 className="text-[22px] font-black tracking-[0] text-black">キズナノート</h1>
    </header>
  );
}

export function BottomMenu() {
  return (
    <nav
      aria-label="メインメニュー"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto h-[58px] max-w-[430px] border-t border-black/5 bg-white/95 shadow-[0_-10px_28px_rgba(0,0,0,0.04)] backdrop-blur"
    >
      <div className="grid h-full grid-cols-3 items-center px-8">
        <Link
          href="/home"
          aria-label="ホーム"
          className="flex h-10 items-center justify-center text-[#b8b8b8]"
        >
          <HomeIcon />
        </Link>
        <button
          type="button"
          aria-label="新規作成"
          className="justify-self-center flex h-[42px] w-[42px] items-center justify-center rounded-full bg-black text-[26px] font-light leading-none text-white shadow-[0_10px_18px_rgba(0,0,0,0.18)]"
        >
          +
        </button>
        <Link
          href="#"
          aria-label="プロフィール"
          className="flex h-10 items-center justify-center text-[#b8b8b8]"
        >
          <UserIcon />
        </Link>
      </div>
    </nav>
  );
}

export default function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-[#ececec] sm:bg-[#dedede]">
      <div className="mx-auto min-h-screen max-w-[430px] overflow-hidden bg-[#f7f7f7] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
        <AppHeader />
        <div className="pt-[54px]">{children}</div>
        <BottomMenu />
      </div>
    </div>
  );
}
