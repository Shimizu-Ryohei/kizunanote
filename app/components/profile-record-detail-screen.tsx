"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import ProfileHeader from "./profile-header";
import SuccessModal from "./success-modal";
import { useAuth } from "./auth-provider";
import { addProfileNote, getProfileDetailById, type ProfileDetail } from "@/lib/firebase/profiles";
import type { ProfileHeaderData } from "./profile-content";

function PhoneIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.66 5.25h2.56c.28 0 .54.19.61.46l.67 2.47a.63.63 0 0 1-.18.62l-1.22 1.16a11.65 11.65 0 0 0 4.93 4.93l1.16-1.22a.63.63 0 0 1 .62-.18l2.47.67c.27.07.46.33.46.61v2.56c0 .35-.28.63-.63.63C11.59 18.14 5.88 12.43 5.88 5.88c0-.35.28-.63.63-.63Z"
        stroke="currentColor"
        strokeWidth="1.6"
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

function SparklesIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 text-[var(--color-main)]" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3.75 13.64 8.36 18.25 10 13.64 11.64 12 16.25 10.36 11.64 5.75 10l4.61-1.64L12 3.75ZM18 15l.82 2.18L21 18l-2.18.82L18 21l-.82-2.18L15 18l2.18-.82L18 15ZM6 15l.82 2.18L9 18l-2.18.82L6 21l-.82-2.18L3 18l2.18-.82L6 15Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ContactCard({
  icon,
  value,
  href,
}: {
  icon: ReactNode;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-[#444]">
        {icon}
      </div>
      <p className="truncate text-[14px] font-bold text-[#2a2a2a]">{value}</p>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block" target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
        {content}
      </a>
    );
  }

  return content;
}

export default function ProfileRecordDetailScreen({ profileId }: { profileId: string }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    getProfileDetailById(profileId, user.uid)
      .then((detail) => {
        if (!isMounted) {
          return;
        }

        setProfile(detail);
        setErrorMessage("");
      })
      .catch((error) => {
        console.error(error);

        if (!isMounted) {
          return;
        }

        setErrorMessage("プロフィール詳細の取得に失敗しました。");
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

  const contactItems = useMemo(() => {
    if (!profile) {
      return [];
    }

    const normalizedPhone = `${profile.contacts.phoneCountryCode}${profile.contacts.phone}`.replace(/[^\d+]/g, "");
    const xHandle = profile.contacts.x.replace(/^@/, "");
    const facebookPath = profile.contacts.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, "").replace(/^@/, "");
    const instagramHandle = profile.contacts.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/^@/, "").replace(/\/$/, "");
    const linkedInValue = profile.contacts.linkedin
      .replace(/^https?:\/\/(www\.)?linkedin\.com\//, "")
      .replace(/^\/+/, "")
      .replace(/\/$/, "");
    const linkedInPath = linkedInValue
      ? linkedInValue.startsWith("in/") || linkedInValue.startsWith("company/")
        ? linkedInValue
        : `in/${linkedInValue.replace(/^@/, "")}`
      : "";
    const linkedInUrl = linkedInPath ? `https://www.linkedin.com/${linkedInPath}` : "";

    return [
      {
        key: "phone",
        icon: <PhoneIcon />,
        value: `${profile.contacts.phoneCountryCode} ${profile.contacts.phone}`.trim(),
        href: normalizedPhone ? `tel:${normalizedPhone}` : "",
      },
      {
        key: "email",
        icon: <MailIcon />,
        value: profile.contacts.email,
        href: profile.contacts.email ? `mailto:${profile.contacts.email}` : "",
      },
      {
        key: "x",
        icon: <XIcon />,
        value: profile.contacts.x,
        href: xHandle ? `https://x.com/${xHandle}` : "",
      },
      {
        key: "facebook",
        icon: <FacebookIcon />,
        value: profile.contacts.facebook,
        href: facebookPath ? `https://www.facebook.com/${facebookPath}` : "",
      },
      {
        key: "instagram",
        icon: <InstagramIcon />,
        value: profile.contacts.instagram,
        href: instagramHandle ? `https://www.instagram.com/${instagramHandle}` : "",
      },
      {
        key: "linkedin",
        icon: <LinkedInIcon />,
        value: profile.contacts.linkedin,
        href: linkedInUrl,
      },
    ].filter((item) => item.value);
  }, [profile]);

  const summaryBullets = profile?.summaryBullets ?? [];

  const handleSaveNote = async () => {
    if (!user) {
      setErrorMessage("ログイン状態を確認できませんでした。");
      return;
    }

    if (!noteBody.trim()) {
      setErrorMessage("キズナノートを入力してください。");
      return;
    }

    try {
      setIsSaving(true);
      await addProfileNote(profileId, noteBody, user.uid);
      const refreshed = await getProfileDetailById(profileId, user.uid);
      setProfile(refreshed);
      setNoteBody("");
      setErrorMessage("");
      setIsSavedModalOpen(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("キズナノートの保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MobileShell>
      <main className="px-4 pb-28">
        {isLoading ? <p className="mt-6 text-[14px] font-medium text-[#8b8b8b]">プロフィールを読み込み中...</p> : null}
        {!isLoading && errorMessage && !profile ? (
          <p className="mt-6 text-[13px] font-medium text-[#d64253]">{errorMessage}</p>
        ) : null}

        {profile && headerProfile ? (
          <div className={isSavedModalOpen ? "pointer-events-none blur-md" : ""}>
            <ProfileHeader profile={headerProfile} editHref={`/profiles/${profileId}/edit-profile`} />

            <p className="mt-4 text-[14px] font-medium text-[#9f9f9f]">
              {profile.latestNoteLabel ? `最終コンタクト: ${profile.latestNoteLabel}` : "最終コンタクト: 未登録"}
            </p>

            <section className="mt-4 rounded-lg bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
              <h2 className="flex items-center gap-2 text-[14px] font-bold text-[#1f1f1f]">
                <SparklesIcon />
                <span>キズナノート要約</span>
              </h2>
              {summaryBullets.length ? (
                <ul className="mt-3 space-y-3 text-[14px] font-medium leading-6 text-[#333]">
                  {summaryBullets.map((bullet, index) => (
                    <li key={`${index}-${bullet}`} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : profile.summaryStatus === "pending" || profile.summaryStatus === "processing" ? (
                <p className="mt-3 text-[14px] font-medium text-[#9f9f9f]">
                  要約は次回の自動更新後に表示されます。
                </p>
              ) : (
                <p className="mt-3 text-[14px] font-medium text-[#9f9f9f]">
                  まだキズナノート要約がありません。
                </p>
              )}
              <Link
                href={`/profiles/${profileId}/notes`}
                className="mt-4 ml-auto block w-fit text-right text-[14px] font-medium text-[#a8a8a8] underline"
              >
                すべてのキズナノートを見る
              </Link>
            </section>

            <section className="mt-6">
              <h2 className="text-[14px] font-bold text-[#4b4b4b]">キズナノートを書く</h2>
              <textarea
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                placeholder="現在の内容、前回や前後など、このヒトの情報を、なんでもよいので入力してください。"
                className="mt-3 min-h-[140px] w-full resize-none rounded-lg bg-white px-4 py-4 text-[14px] font-medium text-black outline-none placeholder:text-[#c0c0c0]"
              />
              {errorMessage && profile ? (
                <p className="mt-4 text-[13px] font-medium text-[#d64253]">{errorMessage}</p>
              ) : null}
              <PrimaryCta className={`mt-6 ${isSaving ? "opacity-70" : ""}`} onClick={handleSaveNote} disabled={isSaving}>
                {isSaving ? "保存中..." : "保存する"}
              </PrimaryCta>
            </section>

            <section className="mt-7">
              <h2 className="text-[14px] font-bold text-[#4b4b4b]">連絡先情報</h2>
              <div className="mt-3 rounded-lg bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
                {contactItems.length ? (
                  <div className="space-y-3">
                    {contactItems.map((contact) => (
                      <ContactCard
                        key={contact.key}
                        icon={contact.icon}
                        value={contact.value}
                        href={contact.href}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] font-medium text-[#9f9f9f]">まだ連絡先情報がありません。</p>
                )}
                <Link
                  href={`/profiles/${profileId}/contact-info`}
                  className="mx-auto mt-5 block w-fit text-center text-[14px] font-medium text-[#8d8d8d] underline"
                >
                  編集する
                </Link>
              </div>
            </section>
          </div>
        ) : null}

        {isSavedModalOpen ? <SuccessModal onConfirm={() => setIsSavedModalOpen(false)} /> : null}
      </main>
    </MobileShell>
  );
}
