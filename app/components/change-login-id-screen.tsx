"use client";

import { useState } from "react";
import PrimaryCta from "./primary-cta";
import MobileShell from "./mobile-shell";
import { sendLoginIdChangeLink } from "@/lib/firebase/auth";

export default function ChangeLoginIdScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("新しいメールアドレスを入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);
      await sendLoginIdChangeLink(email, window.location.origin);
      setIsSent(true);
    } catch (nextError) {
      console.error(nextError);
      setError("メール送信に失敗しました。設定を確認して再度お試しください。");
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
            <label className="block">
              <span className="text-[13px] font-bold text-[#5b5b5b]">新しいメールアドレス</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-[52px] w-full rounded-[16px] bg-white px-5 text-[16px] font-medium text-black outline-none"
              />
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
