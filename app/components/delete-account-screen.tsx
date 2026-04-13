"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmModal from "./confirm-modal";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import { deleteCurrentUserAccount } from "@/lib/firebase/auth";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsSubmitting(true);
      await deleteCurrentUserAccount(password);
      router.replace("/sign-up");
    } catch (error) {
      console.error(error);
      setErrorMessage("アカウント削除に失敗しました。パスワードを確認して再度お試しください。");
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileShell>
      <main className="px-5 pb-28">
        <div className={isConfirmOpen ? "pointer-events-none blur-md" : ""}>
          <section className="mt-2">
            <h1 className="text-[22px] font-black text-black">アカウントを削除する</h1>
            <p className="mt-2 text-[14px] font-medium leading-6 text-[#7c7c7c]">
              削除を続けるには、現在のパスワードを入力してください。
            </p>
          </section>

          <section className="mt-10">
            <label className="block">
              <span className="text-[13px] font-bold text-[#5b5b5b]">パスワード</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 h-[52px] w-full rounded-[16px] bg-white px-5 text-[16px] font-medium text-black outline-none"
              />
            </label>

            {errorMessage ? (
              <p className="mt-4 text-[13px] font-medium text-[#d64253]">{errorMessage}</p>
            ) : null}

            <PrimaryCta
              className={`mt-10 ${isSubmitting ? "opacity-70" : ""}`}
              disabled={isSubmitting}
              onClick={() => {
                setErrorMessage("");

                if (!password) {
                  setErrorMessage("パスワードを入力してください。");
                  return;
                }

                setIsConfirmOpen(true);
              }}
            >
              解約する
            </PrimaryCta>
          </section>
        </div>

        {isConfirmOpen ? (
          <ConfirmModal
            message="本当に解約しますか？"
            onCancel={() => setIsConfirmOpen(false)}
            onConfirm={handleDeleteAccount}
          />
        ) : null}
      </main>
    </MobileShell>
  );
}
