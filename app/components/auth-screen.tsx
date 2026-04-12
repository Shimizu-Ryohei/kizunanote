"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import PrimaryCta from "./primary-cta";
import { signInWithEmail, signUpWithEmail } from "@/lib/firebase/auth";

type AuthMode = "sign-in" | "sign-up";

type AuthScreenProps = {
  mode: AuthMode;
};

function Field({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-bold text-[#5b5b5b]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-[52px] w-full rounded-[16px] bg-white px-5 text-[16px] font-medium text-black outline-none"
      />
    </label>
  );
}

export default function AuthScreen({ mode }: AuthScreenProps) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    try {
      setIsSubmitting(true);

      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }

      router.replace(redirectTo);
    } catch (nextError) {
      setError("認証に失敗しました。入力内容を確認して再度お試しください。");
      console.error(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#ececec] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[430px] rounded-[28px] bg-[#f7f7f7] px-6 pb-8 pt-10 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
        <h1 className="text-[24px] font-black text-black">キズナノート</h1>
        <p className="mt-2 text-[14px] font-medium text-[#7b7b7b]">
          {isSignUp ? "新規登録して利用を開始" : "ログインして続ける"}
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <Field label="メールアドレス" type="email" value={email} onChange={setEmail} />
          <Field label="パスワード" type="password" value={password} onChange={setPassword} />
          {isSignUp ? (
            <Field
              label="パスワード確認"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          ) : null}

          {error ? <p className="text-[13px] font-medium text-[#d64253]">{error}</p> : null}

          <PrimaryCta type="submit" disabled={isSubmitting} className={isSubmitting ? "opacity-70" : ""}>
            {isSubmitting ? "送信中..." : isSignUp ? "新規登録する" : "ログインする"}
          </PrimaryCta>
        </form>

        <p className="mt-6 text-center text-[13px] font-medium text-[#7b7b7b]">
          {isSignUp ? "すでにアカウントをお持ちですか？" : "アカウントをお持ちでないですか？"}{" "}
          <Link
            href={isSignUp ? "/sign-in" : "/sign-up"}
            className="font-bold text-[var(--color-main)]"
          >
            {isSignUp ? "ログイン" : "新規登録"}
          </Link>
        </p>
      </div>
    </main>
  );
}
