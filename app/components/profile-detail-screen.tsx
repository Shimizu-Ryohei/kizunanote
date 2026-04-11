"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import { kentaroSatoProfile } from "./profile-content";
import ProfileHeader from "./profile-header";
import SuccessModal from "./success-modal";

const notes = [
  "Tech Conf 2025で登壇。AI駆動のウェブレイアウト設計について話したのが最初の接点。",
  "コーヒー派（ブラック）。幼馴染のゆみこであることを記憶。",
  "現在はデザイントリオ、ブランディング設計に特化した小規模スタジオを経営。",
  "週末は野球と写真。今年のテーマは\"シンプルな光\"。",
  "次回は新しいプロジェクトのプロトタイプについて相談予定。",
];

const contacts = [
  { icon: <PhoneIcon />, label: "電話番号", value: "090-1234-5678" },
  { icon: <MailIcon />, label: "メールアドレス", value: "k.sato@studio.jp" },
  { icon: <XIcon />, label: "X", value: "@kento_sato" },
  { icon: <FacebookIcon />, label: "FACEBOOK", value: "kento.sato.profile" },
  { icon: <InstagramIcon />, label: "INSTAGRAM", value: "kento.sato.profile" },
  { icon: <LinkedInIcon />, label: "LINKEDIN", value: "linkedin.com/in/username" },
];

function PhoneIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M7.8 4.75h2.1c.35 0 .66.24.75.57l.7 2.6a.76.76 0 0 1-.22.75l-1.3 1.24a12.5 12.5 0 0 0 4.56 4.56l1.24-1.3a.76.76 0 0 1 .75-.22l2.6.7c.33.09.57.4.57.75v2.1c0 .41-.33.75-.75.75C11.62 19.75 4.25 12.38 4.25 5.5c0-.42.33-.75.75-.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M5.75 7.25h12.5A1.25 1.25 0 0 1 19.5 8.5v7A1.25 1.25 0 0 1 18.25 16.75H5.75A1.25 1.25 0 0 1 4.5 15.5v-7a1.25 1.25 0 0 1 1.25-1.25Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m5 8 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 1200 1227" fill="none">
      <path
        d="M714.163 519.284 1160.89 0H1055.06L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.832l409.649-476.152 327.191 476.152H1200L714.137 519.284h.026ZM569.154 687.828l-47.438-67.894L144.87 80.04h162.604l304.797 436.204 47.438 67.894 395.2 565.353H892.305L569.154 687.854v-.026Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M13.02 20v-6.93h2.33l.35-2.7h-2.68V8.39c0-.78.22-1.31 1.35-1.31h1.44V4.66c-.25-.03-1.1-.11-2.1-.11-2.08 0-3.5 1.26-3.5 3.57v2h-2.34v2.7h2.34V20h2.81Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M7.95 3h8.1A4.95 4.95 0 0 1 21 7.95v8.1A4.95 4.95 0 0 1 16.05 21h-8.1A4.95 4.95 0 0 1 3 16.05v-8.1A4.95 4.95 0 0 1 7.95 3Zm0 1.8A3.15 3.15 0 0 0 4.8 7.95v8.1a3.15 3.15 0 0 0 3.15 3.15h8.1a3.15 3.15 0 0 0 3.15-3.15v-8.1A3.15 3.15 0 0 0 16.05 4.8h-8.1Zm8.78 1.35a1.13 1.13 0 1 1 0 2.25 1.13 1.13 0 0 1 0-2.25ZM12 7.86A4.14 4.14 0 1 1 7.86 12 4.14 4.14 0 0 1 12 7.86Zm0 1.8A2.34 2.34 0 1 0 14.34 12 2.35 2.35 0 0 0 12 9.66Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.39 8.18a1.61 1.61 0 1 1 0-3.21 1.61 1.61 0 0 1 0 3.21ZM7.78 10.01V19H5V10.01h2.78Zm4.35 0v1.23h.04c.39-.74 1.4-1.52 2.87-1.52 3.07 0 3.64 2.02 3.64 4.63V19H15.9v-3.33c0-.8-.01-1.81-1.11-1.81s-1.21.86-1.21 1.75V19h-2.79v-8.99h2.68Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ContactCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-[#444]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-[#9d9d9d]">{label}</p>
        <p className="truncate text-[14px] font-bold text-[#2a2a2a]">{value}</p>
      </div>
    </div>
  );
}

export default function ProfileDetailScreen() {
  const router = useRouter();
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  const handleSavedConfirm = () => {
    setIsSavedModalOpen(false);
    router.replace("/profiles/kentaro-sato");
  };

  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <div className={isSavedModalOpen ? "pointer-events-none blur-md" : ""}>
          <ProfileHeader
            profile={kentaroSatoProfile}
            editHref="/profiles/kentaro-sato/edit-profile"
          />

          <p className="mt-4 text-[14px] font-medium text-[#9f9f9f]">
            最終コンタクト: 2024年11月18日
          </p>

          <section className="mt-4 rounded-lg bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
            <h2 className="text-[14px] font-bold text-[#1f1f1f]">キズナノート要約</h2>
            <ul className="mt-3 space-y-3 text-[14px] font-medium leading-6 text-[#333]">
              {notes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/profiles/kentaro-sato/notes"
              className="mt-4 ml-auto block w-fit text-right text-[14px] font-medium text-[#a8a8a8] underline"
            >
              すべてのキズナノートを見る
            </Link>
          </section>

          <section className="mt-6">
            <h2 className="text-[14px] font-bold text-[#4b4b4b]">キズナノート</h2>
            <textarea
              placeholder="現在の内容、前回や前後など、このヒトの情報を、なんでもよいので入力してください。"
              className="mt-3 min-h-[140px] w-full resize-none rounded-lg bg-white px-4 py-4 text-[14px] font-medium text-black outline-none placeholder:text-[#c0c0c0]"
            />
            <PrimaryCta className="mt-6" onClick={() => setIsSavedModalOpen(true)}>
              保存する
            </PrimaryCta>
          </section>

          <section className="mt-7">
            <h2 className="text-[14px] font-bold text-[#4b4b4b]">連絡先情報</h2>
            <div className="mt-3 rounded-lg bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
              <div className="mt-4 space-y-3">
                {contacts.map((contact) => (
                  <ContactCard key={contact.label} {...contact} />
                ))}
              </div>
              <Link
                href="/profiles/kentaro-sato/contact-info"
                className="mx-auto mt-5 block w-fit text-center text-[14px] font-medium text-[#8d8d8d]"
              >
                編集する
              </Link>
            </div>
          </section>
        </div>

        {isSavedModalOpen ? <SuccessModal onConfirm={handleSavedConfirm} /> : null}
      </main>
    </MobileShell>
  );
}
