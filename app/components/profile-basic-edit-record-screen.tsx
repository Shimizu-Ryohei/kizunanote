"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import SuccessModal from "./success-modal";
import { useAuth } from "./auth-provider";
import { compressImage } from "@/lib/image/compress-image";
import { getProfileDetailById, updateProfileBasics, type ProfileDetail } from "@/lib/firebase/profiles";
import type { ProfileHeaderData } from "./profile-content";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="flex flex-col gap-2 text-[14px] font-bold text-[#4b4b4b]">{children}</label>;
}

function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-[44px] w-full rounded-lg bg-white px-5 text-[16px] font-medium text-black outline-none"
    />
  );
}

export default function ProfileBasicEditRecordScreen({ profileId }: { profileId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastNameKana, setLastNameKana] = useState("");
  const [firstNameKana, setFirstNameKana] = useState("");
  const [birthday, setBirthday] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

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

        const [last = "", first = ""] = detail.fullName.split(" ");
        const [lastKana = "", firstKana = ""] = detail.fullNameKana.split(" ");
        setProfile(detail);
        setLastName(last);
        setFirstName(first);
        setLastNameKana(lastKana);
        setFirstNameKana(firstKana);
        setBirthday(detail.birthday ? detail.birthday.replace(/-/g, "/") : "");
        setPhotoPreview(detail.photoUrl);
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setErrorMessage("プロフィール情報の取得に失敗しました。");
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

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    try {
      const compressedFile = await compressImage(selectedFile);
      setPhotoFile(compressedFile);
      setPhotoPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error(error);
      setPhotoFile(selectedFile);
      setPhotoPreview(URL.createObjectURL(selectedFile));
    }
  };

  const formatBirthday = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const yearRaw = digits.slice(0, 4);
    const monthRaw = digits.slice(4, 6);
    const dayRaw = digits.slice(6, 8);
    let year = yearRaw;
    let month = monthRaw;
    let day = dayRaw;

    if (yearRaw.length === 4) {
      year = String(Math.min(Number(yearRaw), currentYear));
    }
    if (monthRaw.length === 2) {
      month = String(Math.min(Math.max(Number(monthRaw), 1), 12)).padStart(2, "0");
    }
    if (dayRaw.length === 2) {
      day = String(Math.min(Math.max(Number(dayRaw), 1), 31)).padStart(2, "0");
    }
    if (digits.length <= 4) {
      return year;
    }
    if (digits.length <= 6) {
      return `${year}/${month}`;
    }
    return `${year}/${month}/${day}`;
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setErrorMessage("ログイン状態を確認できませんでした。");
      return;
    }

    try {
      setIsSaving(true);
      await updateProfileBasics(profileId, user.uid, {
        lastName,
        firstName,
        lastNameKana,
        firstNameKana,
        birthday,
        photoFile,
      });
      const refreshed = await getProfileDetailById(profileId, user.uid);
      setProfile(refreshed);
      setPhotoFile(null);
      setErrorMessage("");
      setIsSavedModalOpen(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("プロフィールの保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <MobileShell>
      <main className="relative px-5 pb-[168px]">
        {isLoading ? <p className="mt-6 text-[14px] font-medium text-[#8b8b8b]">プロフィールを読み込み中...</p> : null}
        {!isLoading && errorMessage && !profile ? <p className="mt-6 text-[13px] font-medium text-[#d64253]">{errorMessage}</p> : null}
        {profile && headerProfile ? (
          <div className={isSavedModalOpen ? "pointer-events-none blur-md" : ""}>
            <form className="mt-1 space-y-8" noValidate onSubmit={handleSave}>
              <section className="flex items-start gap-4">
                <button
                  type="button"
                  aria-label="プロフィール画像を変更"
                  onClick={() => fileInputRef.current?.click()}
                  className="self-center flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e2e2e2] bg-[#f4f4f4]"
                >
                  {photoPreview ? (
                    <Image src={photoPreview} alt="選択したプロフィール画像" width={72} height={72} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[22px] font-bold text-[#bdbdbd]">{headerProfile.avatarFallback}</span>
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoSelect} />
                <div className="grid flex-1 grid-cols-2 gap-3">
                  <FieldLabel><span>姓</span><TextInput value={lastName} onChange={setLastName} /></FieldLabel>
                  <FieldLabel><span>名</span><TextInput value={firstName} onChange={setFirstName} /></FieldLabel>
                  <FieldLabel><span>せい</span><TextInput value={lastNameKana} onChange={setLastNameKana} /></FieldLabel>
                  <FieldLabel><span>めい</span><TextInput value={firstNameKana} onChange={setFirstNameKana} /></FieldLabel>
                </div>
              </section>

              <FieldLabel>
                <span>生年月日</span>
                <div className="flex h-[46px] items-center rounded-lg bg-white px-5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={birthday}
                    onChange={(event) => setBirthday(formatBirthday(event.target.value))}
                    className="w-full bg-transparent text-[16px] font-medium text-black outline-none"
                  />
                </div>
              </FieldLabel>

              {errorMessage ? <p className="text-[13px] font-medium text-[#d64253]">{errorMessage}</p> : null}
              <PrimaryCta type="submit" className={`relative z-40 mt-10 ${isSaving ? "opacity-70" : ""}`} disabled={isSaving}>
                {isSaving ? "保存中..." : "保存する"}
              </PrimaryCta>
            </form>
          </div>
        ) : null}

        {isSavedModalOpen ? <SuccessModal onConfirm={() => router.replace(`/profiles/${profileId}`)} /> : null}
      </main>
    </MobileShell>
  );
}
