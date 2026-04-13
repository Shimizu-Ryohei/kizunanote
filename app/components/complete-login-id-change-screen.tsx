"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { completeLoginIdChange } from "@/lib/firebase/auth";

export default function CompleteLoginIdChangeScreen() {
  const searchParams = useSearchParams();
  const actionCode = searchParams.get("oobCode");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("メールアドレス変更を反映しています。");
  const [nextEmail, setNextEmail] = useState("");

  useEffect(() => {
    if (!actionCode) {
      return;
    }

    completeLoginIdChange(actionCode)
      .then((email) => {
        setNextEmail(email);
        setStatus("success");
        setMessage("ログインIDを変更しました。");
      })
      .catch((error) => {
        console.error(error);
        setStatus("error");
        setMessage("ログインIDの変更に失敗しました。リンクの有効期限を確認して再度お試しください。");
      });
  }, [actionCode]);

  if (!actionCode) {
    return (
      <main className="min-h-screen bg-[#ececec] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-[430px] rounded-[28px] bg-[#f7f7f7] px-6 pb-8 pt-10 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
          <h1 className="text-[24px] font-black text-black">キズナノート</h1>
          <h2 className="mt-8 text-[22px] font-black text-black">ログインID変更</h2>
          <p className="mt-3 text-[14px] font-medium leading-7 text-[#5f5f5f]">
            ログインID（メールアドレス）を変更しました。
          </p>
          <div className="mt-10">
            <Link
              href="/home"
              className="flex h-[58px] w-full items-center justify-center rounded-full bg-[var(--color-main)] text-[15px] font-bold text-white"
            >
              ホームへ戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#ececec] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[430px] rounded-[28px] bg-[#f7f7f7] px-6 pb-8 pt-10 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
        <h1 className="text-[24px] font-black text-black">キズナノート</h1>
        <h2 className="mt-8 text-[22px] font-black text-black">ログインID変更</h2>
        <p className="mt-3 text-[14px] font-medium leading-7 text-[#5f5f5f]">{message}</p>

        {status === "success" && nextEmail ? (
          <p className="mt-4 rounded-[16px] bg-white px-5 py-4 text-[14px] font-medium text-[#307cff]">
            {nextEmail}
          </p>
        ) : null}

        <div className="mt-10">
          <Link
            href={status === "success" ? "/home" : "/settings/change-login-id"}
            className="flex h-[58px] w-full items-center justify-center rounded-full bg-[var(--color-main)] text-[15px] font-bold text-white"
          >
            {status === "success" ? "ホームへ戻る" : "もう一度試す"}
          </Link>
        </div>
      </div>
    </main>
  );
}
