"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PrimaryCta from "./primary-cta";
import {
  completeSignUpWithEmailLink,
  isEmailLinkSignIn,
  PENDING_SIGN_UP_EMAIL_KEY,
} from "@/lib/firebase/auth";

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-[13px] font-bold text-[#5b5b5b]">{label}</span>
      <div className="relative mt-2">
        <input
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-[52px] w-full rounded-[16px] bg-white px-5 pr-12 text-[16px] font-medium text-black outline-none"
        />
        <button
          type="button"
          aria-label={isVisible ? "パスワードを非表示" : "パスワードを表示"}
          onClick={() => setIsVisible((current) => !current)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9a9a9a]"
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
}

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

export default function CompleteSignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(PENDING_SIGN_UP_EMAIL_KEY) || "";
    setEmail(savedEmail);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isEmailLinkSignIn(window.location.href)) {
      setError("無効な登録リンクです。メールから再度お試しください。");
      return;
    }

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    try {
      setIsSubmitting(true);
      await completeSignUpWithEmailLink(email, password, window.location.href);
      window.localStorage.removeItem(PENDING_SIGN_UP_EMAIL_KEY);
      router.replace("/home");
    } catch (nextError) {
      console.error(nextError);
      setError("新規登録に失敗しました。リンクの有効期限や入力内容を確認してください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#ececec] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[430px] rounded-[28px] bg-[#f7f7f7] px-6 pb-8 pt-10 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
        <h1 className="text-[24px] font-black text-black">キズナノート</h1>
        <p className="mt-2 text-[14px] font-medium text-[#7b7b7b]">
          メール確認が完了しました。パスワードを設定して登録を完了してください。
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

          <Field label="パスワード" value={password} onChange={setPassword} />
          <Field label="パスワード確認" value={confirmPassword} onChange={setConfirmPassword} />

          {error ? <p className="text-[13px] font-medium text-[#d64253]">{error}</p> : null}

          <PrimaryCta type="submit" disabled={isSubmitting} className={isSubmitting ? "opacity-70" : ""}>
            {isSubmitting ? "登録中..." : "新規登録する"}
          </PrimaryCta>
        </form>
      </div>
    </main>
  );
}
