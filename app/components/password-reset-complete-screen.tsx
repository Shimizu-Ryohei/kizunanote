"use client";

import Link from "next/link";

export default function PasswordResetCompleteScreen() {
  return (
    <main className="min-h-screen bg-[#ececec] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[430px] rounded-[28px] bg-[#f7f7f7] px-6 pb-8 pt-10 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
        <h1 className="text-[24px] font-black text-black">キズナノート</h1>
        <h2 className="mt-8 text-[22px] font-black text-black">パスワード再設定</h2>
        <p className="mt-3 text-[14px] font-medium leading-7 text-[#5f5f5f]">
          パスワードを再設定しました。新しいパスワードでログインしてください。
        </p>

        <div className="mt-10">
          <Link
            href="/sign-in"
            className="flex h-[58px] w-full items-center justify-center rounded-full bg-[var(--color-main)] text-[15px] font-bold text-white"
          >
            ログイン画面へ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
