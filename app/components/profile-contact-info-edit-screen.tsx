"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import ProfileHeader from "./profile-header";
import SuccessModal from "./success-modal";
import { useAuth } from "./auth-provider";
import {
  getProfileContact,
  getProfileDetailById,
  updateProfileContact,
  type ProfileContact,
  type ProfileDetail,
} from "@/lib/firebase/profiles";
import type { ProfileHeaderData } from "./profile-content";

type ContactFieldCardProps = {
  label: string;
  value: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
};

type SocialCardProps = {
  value: string;
  icon: React.ReactNode;
  placeholder: string;
  onChange: (value: string) => void;
};

function ContactFieldCard({
  label,
  value,
  placeholder,
  inputMode,
  onChange,
}: ContactFieldCardProps) {
  return (
    <label className="block">
      <span className="text-[14px] font-bold text-[#5f5f5f]">{label}</span>
      <div className="mt-3 flex min-h-[80px] items-center rounded-[18px] bg-[#f3f3f3] px-5 py-4">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className="w-full bg-transparent text-[16px] font-medium text-[#2a2a2a] outline-none"
        />
      </div>
    </label>
  );
}

function SocialCard({ value, icon, placeholder, onChange }: SocialCardProps) {
  return (
    <label className="block rounded-[18px] bg-[#f3f3f3] px-5 py-5">
      <div className="flex items-center gap-4">
        <span className="shrink-0 text-black">{icon}</span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-[16px] font-medium text-[#2a2a2a] outline-none placeholder:text-[#a5acb8]"
        />
      </div>
    </label>
  );
}

function XGlyph() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 1200 1227" fill="none">
      <path d="M714.163 519.284 1160.89 0H1055.06L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.832l409.649-476.152 327.191 476.152H1200L714.137 519.284h.026ZM569.154 687.828l-47.438-67.894L144.87 80.04h162.604l304.797 436.204 47.438 67.894 395.2 565.353H892.305L569.154 687.854v-.026Z" fill="currentColor" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
      <path d="M13.02 20v-6.93h2.33l.35-2.7h-2.68V8.39c0-.78.22-1.31 1.35-1.31h1.44V4.66c-.25-.03-1.1-.11-2.1-.11-2.08 0-3.5 1.26-3.5 3.57v2h-2.34v2.7h2.34V20h2.81Z" fill="currentColor" />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
      <path d="M7.95 3h8.1A4.95 4.95 0 0 1 21 7.95v8.1A4.95 4.95 0 0 1 16.05 21h-8.1A4.95 4.95 0 0 1 3 16.05v-8.1A4.95 4.95 0 0 1 7.95 3Zm0 1.8A3.15 3.15 0 0 0 4.8 7.95v8.1a3.15 3.15 0 0 0 3.15 3.15h8.1a3.15 3.15 0 0 0 3.15-3.15v-8.1A3.15 3.15 0 0 0 16.05 4.8h-8.1Zm8.78 1.35a1.13 1.13 0 1 1 0 2.25 1.13 1.13 0 0 1 0-2.25ZM12 7.86A4.14 4.14 0 1 1 7.86 12 4.14 4.14 0 0 1 12 7.86Zm0 1.8A2.34 2.34 0 1 0 14.34 12 2.35 2.35 0 0 0 12 9.66Z" fill="currentColor" />
    </svg>
  );
}

function LinkedInGlyph() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
      <path d="M6.39 8.18a1.61 1.61 0 1 1 0-3.21 1.61 1.61 0 0 1 0 3.21ZM7.78 10.01V19H5V10.01h2.78Zm4.35 0v1.23h.04c.39-.74 1.4-1.52 2.87-1.52 3.07 0 3.64 2.02 3.64 4.63V19H15.9v-3.33c0-.8-.01-1.81-1.11-1.81s-1.21.86-1.21 1.75V19h-2.79v-8.99h2.68Z" fill="currentColor" />
    </svg>
  );
}

export default function ProfileContactInfoEditScreen({ profileId }: { profileId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [form, setForm] = useState<ProfileContact>({
    phoneCountryCode: "+81",
    phone: "",
    email: "",
    x: "",
    facebook: "",
    instagram: "",
    linkedin: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    Promise.all([getProfileDetailById(profileId, user.uid), getProfileContact(profileId, user.uid)])
      .then(([detail, contact]) => {
        if (!isMounted) {
          return;
        }

        setProfile(detail);
        setForm(contact);
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setErrorMessage("連絡先情報の取得に失敗しました。");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [profileId, user]);

  const headerProfile = useMemo<ProfileHeaderData | null>(() => {
    if (!profile) {
      return null;
    }

    return {
      name: profile.fullName,
      birthday: profile.birthdayLabel || "未登録",
      avatarAlt: profile.fullName,
      avatarSrc: profile.photoUrl ?? undefined,
      avatarFallback: profile.fullName.slice(0, 1),
      tags: [],
    };
  }, [profile]);

  const updateField = (key: keyof ProfileContact, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) {
      setErrorMessage("ログイン状態を確認できませんでした。");
      return;
    }

    try {
      setIsSaving(true);
      await updateProfileContact(profileId, user.uid, form);
      setErrorMessage("");
      setIsSavedModalOpen(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("連絡先情報の保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MobileShell>
      <main className="px-6 pb-28">
        {isLoading ? <p className="mt-6 text-[14px] font-medium text-[#8b8b8b]">連絡先情報を読み込み中...</p> : null}
        {!isLoading && errorMessage && !profile ? <p className="mt-6 text-[13px] font-medium text-[#d64253]">{errorMessage}</p> : null}
        {profile && headerProfile ? (
          <div className={isSavedModalOpen ? "pointer-events-none blur-md" : ""}>
            <ProfileHeader profile={headerProfile} avatarSize={72} className="mt-2" />

            <section className="mt-10 space-y-8">
              <label className="block">
                <span className="text-[14px] font-bold text-[#5f5f5f]">電話番号</span>
                <div className="mt-3 flex min-h-[80px] items-center gap-3 rounded-[18px] bg-[#f3f3f3] px-5 py-4">
                  <input
                    type="text"
                    value={form.phoneCountryCode}
                    onChange={(event) => updateField("phoneCountryCode", event.target.value.replace(/[^\d+]/g, "").slice(0, 5))}
                    placeholder="+81"
                    className="w-[64px] shrink-0 bg-transparent text-[16px] font-medium text-[#2a2a2a] outline-none placeholder:text-[#a5acb8]"
                  />
                  <span className="h-5 w-px bg-[#d8d8d8]" />
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(event) => updateField("phone", formatPhoneNumber(event.target.value))}
                    placeholder="090-1234-5678"
                    inputMode="numeric"
                    className="w-full bg-transparent text-[16px] font-medium text-[#2a2a2a] outline-none placeholder:text-[#a5acb8]"
                  />
                </div>
              </label>
              <ContactFieldCard
                label="メールアドレス"
                value={form.email}
                onChange={(value) => updateField("email", value)}
                placeholder="name@example.com"
                inputMode="email"
              />
            </section>

            <section className="mt-9">
              <h2 className="text-[14px] font-bold text-[#5f5f5f]">SNS</h2>
              <div className="mt-5 space-y-6">
                <SocialCard value={form.x} onChange={(value) => updateField("x", value)} icon={<XGlyph />} placeholder="username" />
                <SocialCard value={form.facebook} onChange={(value) => updateField("facebook", value)} icon={<FacebookGlyph />} placeholder="username" />
                <SocialCard value={form.instagram} onChange={(value) => updateField("instagram", value)} icon={<InstagramGlyph />} placeholder="username" />
                <SocialCard value={form.linkedin} onChange={(value) => updateField("linkedin", value)} icon={<LinkedInGlyph />} placeholder="username または in/username" />
              </div>
            </section>

            {errorMessage ? <p className="mt-6 text-[13px] font-medium text-[#d64253]">{errorMessage}</p> : null}
            <PrimaryCta className={`mx-auto mt-12 w-[172px] ${isSaving ? "opacity-70" : ""}`} onClick={handleSave} disabled={isSaving}>
              {isSaving ? "保存中..." : "登録する"}
            </PrimaryCta>
          </div>
        ) : null}

        {isSavedModalOpen ? <SuccessModal onConfirm={() => router.replace(`/profiles/${profileId}`)} /> : null}
      </main>
    </MobileShell>
  );
}
