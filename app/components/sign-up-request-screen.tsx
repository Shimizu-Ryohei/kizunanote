"use client";

import Link from "next/link";
import { useState } from "react";
import PrimaryCta from "./primary-cta";
import { PENDING_SIGN_UP_EMAIL_KEY, sendSignUpLink } from "@/lib/firebase/auth";

export default function SignUpRequestScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("メールアドレスを入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);
      await sendSignUpLink(email, window.location.origin);
      window.localStorage.setItem(PENDING_SIGN_UP_EMAIL_KEY, email);
      setIsSent(true);
    } catch (nextError) {
      console.error(nextError);
      setError("メール送信に失敗しました。設定を確認して再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#ececec] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[430px] rounded-[28px] bg-[#f7f7f7] px-6 pb-8 pt-10 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
        <h1 className="text-[24px] font-black text-black">キズナノート</h1>
        <p className="mt-2 text-[14px] font-medium text-[#7b7b7b]">
          メールアドレス確認後にパスワードを設定して新規登録します。
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-[13px] font-bold text-[#5b5b5b]">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-[52px] w-full rounded-[16px] bg-white px-5 text-[16px] font-medium text-black outline-none"
            />
          </label>

          <p className="text-[13px] font-medium leading-6 text-[#7b7b7b]">
            入力したメールアドレスに認証リンクを送信します。メール内のリンクをクリックして、パスワード設定へ進んでください。
          </p>

          {error ? <p className="text-[13px] font-medium text-[#d64253]">{error}</p> : null}
          {isSent ? (
            <p className="text-[13px] font-medium text-[#59c183]">
              メールを送信しました。リンクから続けてください。
            </p>
          ) : null}

          <PrimaryCta type="submit" disabled={isSubmitting} className={isSubmitting ? "opacity-70" : ""}>
            {isSubmitting ? "送信中..." : "メールを送信する"}
          </PrimaryCta>
        </form>

        <p className="mt-6 text-center text-[13px] font-medium text-[#7b7b7b]">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/sign-in" className="font-bold text-[var(--color-main)]">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
