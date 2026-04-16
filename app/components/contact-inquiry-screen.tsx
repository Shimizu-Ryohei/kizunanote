"use client";

import { useState } from "react";
import { useAuth } from "./auth-provider";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import { submitContactInquiry } from "@/lib/firebase/contact-inquiries";

export default function ContactInquiryScreen() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isSignedIn = Boolean(user?.email);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitted(false);

    if (!email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage("メールアドレス、件名、お問い合わせ内容を入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);
      await submitContactInquiry({
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      if (!isSignedIn) {
        setEmail("");
      }
      setSubject("");
      setMessage("");
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("お問い合わせの送信に失敗しました。時間を置いて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2">
          <h1 className="text-[22px] font-black text-black">お問い合わせ</h1>
          <p className="mt-2 text-[14px] font-medium leading-6 text-[#7c7c7c]">
            ご不明点や不具合、ご要望がある場合は以下のフォームからお問い合わせください。
          </p>
        </section>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-[13px] font-bold text-[#5b5b5b]">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              readOnly={isSignedIn}
              className="mt-2 h-[52px] w-full rounded-[16px] bg-white px-5 text-[16px] font-medium text-black outline-none read-only:text-[#5d5d5d]"
            />
          </label>

          <label className="block">
            <span className="text-[13px] font-bold text-[#5b5b5b]">件名</span>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-2 h-[52px] w-full rounded-[16px] bg-white px-5 text-[16px] font-medium text-black outline-none"
            />
          </label>

          <label className="block">
            <span className="text-[13px] font-bold text-[#5b5b5b]">お問い合わせ内容</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-2 min-h-[180px] w-full rounded-[16px] bg-white px-5 py-4 text-[16px] font-medium text-black outline-none"
            />
          </label>

          {errorMessage ? (
            <p className="text-[13px] font-medium text-[#d64253]">{errorMessage}</p>
          ) : null}
          {isSubmitted ? (
            <p className="text-[13px] font-medium text-[#59c183]">
              お問い合わせを送信しました。確認のうえ順次対応します。
            </p>
          ) : null}

          <PrimaryCta
            type="submit"
            disabled={isSubmitting}
            className={isSubmitting ? "opacity-70" : ""}
          >
            {isSubmitting ? "送信中..." : "送信する"}
          </PrimaryCta>
        </form>
      </main>
    </MobileShell>
  );
}
