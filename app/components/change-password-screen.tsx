"use client";

import Link from "next/link";
import { useState } from "react";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import { changeCurrentUserPassword } from "@/lib/firebase/auth";

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

function PasswordField({
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

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSaved(false);

    if (!currentPassword) {
      setError("現在のパスワードを入力してください。");
      return;
    }

    if (!nextPassword) {
      setError("新しいパスワードを入力してください。");
      return;
    }

    if (nextPassword.length < 6) {
      setError("新しいパスワードは6文字以上で入力してください。");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    try {
      setIsSubmitting(true);
      await changeCurrentUserPassword(currentPassword, nextPassword);
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setIsSaved(true);
    } catch (nextError) {
      console.error(nextError);
      setError("パスワード変更に失敗しました。入力内容を確認して再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2 rounded-[28px] bg-[#f3f3f3] px-5 pb-8 pt-7">
          <h2 className="text-[24px] font-black text-black">パスワード変更</h2>
          <p className="mt-2 text-[14px] font-medium leading-6 text-[#7b7b7b]">
            現在のパスワードを確認後、新しいパスワードへ変更します。
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <PasswordField label="現在のパスワード" value={currentPassword} onChange={setCurrentPassword} />
            <PasswordField label="新しいパスワード" value={nextPassword} onChange={setNextPassword} />
            <PasswordField
              label="新しいパスワード（確認）"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />

            {error ? <p className="text-[13px] font-medium text-[#d64253]">{error}</p> : null}
            {isSaved ? (
              <p className="text-[13px] font-medium text-[#59c183]">
                パスワードを変更しました。
              </p>
            ) : null}

            <PrimaryCta type="submit" disabled={isSubmitting} className={isSubmitting ? "opacity-70" : ""}>
              {isSubmitting ? "変更中..." : "確認する"}
            </PrimaryCta>
          </form>

          <Link
            href="/settings/change-password/reset"
            className="mx-auto mt-6 block w-fit text-center text-[10px] leading-none font-medium text-[#b5b5b5] underline"
          >
            パスワードをリセットする
          </Link>
        </section>
      </main>
    </MobileShell>
  );
}
