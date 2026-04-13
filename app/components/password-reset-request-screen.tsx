"use client";

import { useState } from "react";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import { useAuth } from "./auth-provider";
import { sendPasswordResetLinkToCurrentUser } from "@/lib/firebase/auth";

export default function PasswordResetRequestScreen() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSend = async () => {
    setErrorMessage("");

    try {
      setIsSubmitting(true);
      await sendPasswordResetLinkToCurrentUser(window.location.origin);
      setIsSent(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("メール送信に失敗しました。時間を置いて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2 rounded-[28px] bg-[#f3f3f3] px-5 pb-8 pt-7">
          <h2 className="text-[24px] font-black text-black">パスワードをリセットする</h2>
          <p className="mt-2 text-[14px] font-medium leading-6 text-[#7b7b7b]">
            現在のメールアドレスに再設定リンクを送信します。メール内のリンクからパスワードを再設定してください。
          </p>

          <div className="mt-8">
            <span className="text-[13px] font-bold text-[#5b5b5b]">メールアドレス</span>
            <div className="mt-2 flex min-h-[52px] w-full items-center rounded-[16px] bg-white px-5 text-[16px] font-medium text-[#5d5d5d]">
              {user?.email ?? "メールアドレスを取得できませんでした"}
            </div>
          </div>

          <p className="mt-5 text-[13px] font-medium leading-6 text-[#7b7b7b]">
            メールが届かない場合は、迷惑メールフォルダも確認してください。
          </p>

          {errorMessage ? <p className="mt-5 text-[13px] font-medium text-[#d64253]">{errorMessage}</p> : null}
          {isSent ? (
            <p className="mt-5 text-[13px] font-medium text-[#59c183]">
              メールを送信しました。リンクからパスワードを再設定してください。
            </p>
          ) : null}

          <PrimaryCta className={`mt-8 ${isSubmitting ? "opacity-70" : ""}`} onClick={handleSend} disabled={isSubmitting}>
            {isSubmitting ? "送信中..." : "メールを送信する"}
          </PrimaryCta>
        </section>
      </main>
    </MobileShell>
  );
}
