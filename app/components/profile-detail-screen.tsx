import Image from "next/image";
import type { ReactNode } from "react";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";

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
  { icon: <XIcon />, label: "X(TWITTER)", value: "@kento_sato" },
  { icon: <InstagramIcon />, label: "INSTAGRAM", value: "kento.sato.profile" },
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
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="m6 5 12 14M18 5 6 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <rect
        x="5.25"
        y="5.25"
        width="13.5"
        height="13.5"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.4" cy="7.8" r="0.9" fill="currentColor" />
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
  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="flex items-start gap-4">
          <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ededed]">
            <Image
              alt="佐藤健太郎"
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&h=160&q=80"
              width={58}
              height={58}
              className="h-full w-full object-cover grayscale"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-[24px] font-black text-[#222]">佐藤 健太郎</h1>
            <div className="mt-2 flex min-w-0 items-center gap-3">
              <span className="max-w-[104px] truncate rounded-full bg-[#d8d8d8] px-3 py-1 text-[9px] font-black tracking-[0] text-[#777]">
                株式会社モノ
              </span>
              <span className="max-w-[104px] truncate rounded-full bg-[#d8d8d8] px-3 py-1 text-[9px] font-black tracking-[0] text-[#777]">
                デザイナー
              </span>
            </div>
            <p className="mt-1 text-[14px] font-medium text-[#aeaeae]">
              Birthday: 1992年11月20日
            </p>
          </div>
        </section>

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
          <button
            type="button"
            className="mt-4 ml-auto block text-[14px] font-medium text-[#a8a8a8] underline"
          >
            すべてのキズナノートを見る
          </button>
        </section>

        <section className="mt-6">
          <h2 className="text-[14px] font-bold text-[#4b4b4b]">キズナノート</h2>
          <textarea
            placeholder="現在の内容、前回や前後など、このヒトの情報を、なんでもよいので入力してください。"
            className="mt-3 min-h-[140px] w-full resize-none rounded-lg bg-white px-4 py-4 text-[14px] font-medium text-black outline-none placeholder:text-[#c0c0c0]"
          />
          <PrimaryCta className="mt-6">
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
            <button
              type="button"
              className="mx-auto mt-5 block text-[14px] font-medium text-[#8d8d8d]"
            >
              編集する
            </button>
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
