"use client";

import { useState } from "react";
import PrimaryCta from "./primary-cta";
import MobileShell from "./mobile-shell";
import { reauthenticateCurrentUser, sendLoginIdChangeLink } from "@/lib/firebase/auth";
import { useAuth } from "./auth-provider";

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M2.75 12s3.3-5.25 9.25-5.25S21.25 12 21.25 12 17.95 17.25 12 17.25 2.75 12 2.75 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.75 3.75 20.25 20.25M10.58 6.9A9.9 9.9 0 0 1 12 6.75c5.95 0 9.25 5.25 9.25 5.25a16.96 16.96 0 0 1-3.3 3.63M8.02 8.02A10.79 10.79 0 0 0 2.75 12s3.3 5.25 9.25 5.25a9.6 9.6 0 0 0 3.92-.8M9.88 9.88A3 3 0 0 0 14.12 14.12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ChangeLoginIdScreen() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("新しいメールアドレスを入力してください。");
      return;
    }

    if (!password) {
      setError("現在のパスワードを入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);
      await reauthenticateCurrentUser(password);
      await sendLoginIdChangeLink(email, window.location.origin);
      setIsSent(true);
    } catch (nextError) {
      console.error(nextError);
      setError("メール送信に失敗しました。パスワードや設定を確認して再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2 rounded-[28px] bg-[#f3f3f3] px-5 pb-8 pt-7">
          <h2 className="text-[24px] font-black text-black">ログインID変更</h2>
          <p className="mt-2 text-[14px] font-medium leading-6 text-[#7b7b7b]">
            新しいメールアドレスに確認メールを送信します。受信したメールのリンクをタップすると、ログインIDが変更されます。
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <span className="text-[13px] font-bold text-[#5b5b5b]">現在のメールアドレス</span>
              <div className="mt-2 flex min-h-[52px] w-full items-center rounded-[16px] bg-white px-5 text-[16px] font-medium text-[#5d5d5d]">
                {user?.email ?? "メールアドレスを取得できませんでした"}
              </div>
            </div>

            <label className="block">
              <span className="text-[13px] font-bold text-[#5b5b5b]">新しいメールアドレス</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-[52px] w-full rounded-[16px] bg-white px-5 text-[16px] font-medium text-black outline-none"
              />
            </label>

            <label className="block">
              <span className="text-[13px] font-bold text-[#5b5b5b]">現在のパスワード</span>
              <div className="relative mt-2">
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-[52px] w-full rounded-[16px] bg-white px-5 pr-12 text-[16px] font-medium text-black outline-none"
                />
                <button
                  type="button"
                  aria-label={isPasswordVisible ? "パスワードを非表示" : "パスワードを表示"}
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9a9a9a]"
                >
                  {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </label>

            <p className="text-[13px] font-medium leading-6 text-[#7b7b7b]">
              メールが届かない場合は、迷惑メールフォルダも確認してください。
            </p>

            {error ? <p className="text-[13px] font-medium text-[#d64253]">{error}</p> : null}
            {isSent ? (
              <p className="text-[13px] font-medium text-[#59c183]">
                メールを送信しました。リンクから変更を完了してください。
              </p>
            ) : null}

            <PrimaryCta type="submit" disabled={isSubmitting} className={isSubmitting ? "opacity-70" : ""}>
              {isSubmitting ? "送信中..." : "メールを送信する"}
            </PrimaryCta>
          </form>
        </section>
      </main>
    </MobileShell>
  );
}
