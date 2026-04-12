"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import ProfileHeader from "./profile-header";
import { kentaroSatoProfile } from "./profile-content";
import SuccessModal from "./success-modal";

type ContactFieldCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

type SocialCardProps = {
  value: string;
  icon: React.ReactNode;
};

function ContactFieldCard({ label, value, icon }: ContactFieldCardProps) {
  return (
    <label className="block">
      <span className="text-[14px] font-bold text-[#5f5f5f]">{label}</span>
      <div className="mt-3 flex min-h-[80px] items-center gap-4 rounded-[18px] bg-[#f3f3f3] px-5 py-4">
        <span className="shrink-0 text-[#bdbdbd]">{icon}</span>
        <input
          type="text"
          defaultValue={value}
          className="w-full bg-transparent text-[16px] font-medium text-[#2a2a2a] outline-none"
        />
      </div>
    </label>
  );
}

function SocialCard({ value, icon }: SocialCardProps) {
  return (
    <label className="block rounded-[18px] bg-[#f3f3f3] px-5 py-5">
      <div className="flex items-center gap-4">
        <span className="shrink-0 text-black">{icon}</span>
        <input
          type="text"
          defaultValue={value}
          className="w-full bg-transparent text-[16px] font-medium text-[#6f7787] outline-none"
        />
      </div>
    </label>
  );
}

function PhoneGlyph() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.66 5.25h2.56c.28 0 .54.19.61.46l.67 2.47a.63.63 0 0 1-.18.62l-1.22 1.16a11.65 11.65 0 0 0 4.93 4.93l1.16-1.22a.63.63 0 0 1 .62-.18l2.47.67c.27.07.46.33.46.61v2.56c0 .35-.28.63-.63.63C11.59 18.14 5.88 12.43 5.88 5.88c0-.35.28-.63.63-.63Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailGlyph() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
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

function XGlyph() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 1200 1227" fill="none">
      <path
        d="M714.163 519.284 1160.89 0H1055.06L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.832l409.649-476.152 327.191 476.152H1200L714.137 519.284h.026ZM569.154 687.828l-47.438-67.894L144.87 80.04h162.604l304.797 436.204 47.438 67.894 395.2 565.353H892.305L569.154 687.854v-.026Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
      <path
        d="M13.02 20v-6.93h2.33l.35-2.7h-2.68V8.39c0-.78.22-1.31 1.35-1.31h1.44V4.66c-.25-.03-1.1-.11-2.1-.11-2.08 0-3.5 1.26-3.5 3.57v2h-2.34v2.7h2.34V20h2.81Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
      <path
        d="M7.95 3h8.1A4.95 4.95 0 0 1 21 7.95v8.1A4.95 4.95 0 0 1 16.05 21h-8.1A4.95 4.95 0 0 1 3 16.05v-8.1A4.95 4.95 0 0 1 7.95 3Zm0 1.8A3.15 3.15 0 0 0 4.8 7.95v8.1a3.15 3.15 0 0 0 3.15 3.15h8.1a3.15 3.15 0 0 0 3.15-3.15v-8.1A3.15 3.15 0 0 0 16.05 4.8h-8.1Zm8.78 1.35a1.13 1.13 0 1 1 0 2.25 1.13 1.13 0 0 1 0-2.25ZM12 7.86A4.14 4.14 0 1 1 7.86 12 4.14 4.14 0 0 1 12 7.86Zm0 1.8A2.34 2.34 0 1 0 14.34 12 2.35 2.35 0 0 0 12 9.66Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedInGlyph() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.39 8.18a1.61 1.61 0 1 1 0-3.21 1.61 1.61 0 0 1 0 3.21ZM7.78 10.01V19H5V10.01h2.78Zm4.35 0v1.23h.04c.39-.74 1.4-1.52 2.87-1.52 3.07 0 3.64 2.02 3.64 4.63V19H15.9v-3.33c0-.8-.01-1.81-1.11-1.81s-1.21.86-1.21 1.75V19h-2.79v-8.99h2.68Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ContactInfoScreen() {
  const router = useRouter();
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  const handleSavedConfirm = () => {
    setIsSavedModalOpen(false);
    router.replace("/profiles/kentaro-sato");
  };

  return (
    <MobileShell>
      <main className="px-6 pb-28">
        <div className={isSavedModalOpen ? "pointer-events-none blur-md" : ""}>
          <ProfileHeader profile={kentaroSatoProfile} avatarSize={72} className="mt-2" />

          <section className="mt-10 space-y-8">
            <ContactFieldCard label="電話番号" value="090-1234-5678" icon={<PhoneGlyph />} />
            <ContactFieldCard label="メールアドレス" value="k.sato@studio.jp" icon={<MailGlyph />} />
          </section>

          <section className="mt-9">
            <h2 className="text-[14px] font-bold text-[#5f5f5f]">SNS</h2>
            <div className="mt-5 space-y-6">
              <SocialCard value="@kento_sato" icon={<XGlyph />} />
              <SocialCard value="kento.sato.profile" icon={<FacebookGlyph />} />
              <SocialCard value="@username" icon={<InstagramGlyph />} />
              <SocialCard value="linkedin.com/in/username" icon={<LinkedInGlyph />} />
            </div>
          </section>

          <PrimaryCta className="mx-auto mt-12 w-[172px]" onClick={() => setIsSavedModalOpen(true)}>
            登録する
          </PrimaryCta>
        </div>

        {isSavedModalOpen ? <SuccessModal onConfirm={handleSavedConfirm} /> : null}
      </main>
    </MobileShell>
  );
}
