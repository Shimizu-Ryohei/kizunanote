"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-provider";
import MobileShell from "./mobile-shell";
import { CameraPlusIcon } from "./icons";
import PrimaryCta from "./primary-cta";
import SuccessModal from "./success-modal";
import { createProfile } from "@/lib/firebase/profiles";
import { compressImage } from "@/lib/image/compress-image";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-[14px] font-bold text-[#4b4b4b]">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-[44px] w-full rounded-lg bg-white px-5 text-[16px] font-medium text-black outline-none placeholder:text-[#b0b0b0]"
    />
  );
}

export default function AddProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastNameKana, setLastNameKana] = useState("");
  const [firstNameKana, setFirstNameKana] = useState("");
  const [birthday, setBirthday] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (photoPreview) {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!user) {
      setErrorMessage("ログイン状態を確認できませんでした。再度ログインしてください。");
      return;
    }

    if (!lastName || !firstName || !lastNameKana || !firstNameKana) {
      setErrorMessage("必須項目を入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);

      await createProfile({
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        lastNameKana: lastNameKana.trim(),
        firstNameKana: firstNameKana.trim(),
        birthday,
        noteBody,
        photoFile,
      });

      setIsSavedModalOpen(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("プロフィールの保存に失敗しました。時間を置いて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileShell>
      <main className="relative px-5 pb-[168px]">
        <div className={isSavedModalOpen ? "pointer-events-none blur-md" : ""}>
          <form className="mt-1 space-y-8" noValidate onSubmit={handleSubmit}>
            <section className="flex items-start gap-4">
              <button
                type="button"
                aria-label="プロフィール画像を追加"
                onClick={() => fileInputRef.current?.click()}
                className="self-center flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e2e2e2] bg-[#f4f4f4] text-[#c8c8c8]"
              >
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="選択したプロフィール画像"
                    width={72}
                    height={72}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <CameraPlusIcon className="h-8 w-8" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoSelect}
              />
              <div className="grid flex-1 grid-cols-2 gap-3">
                <FieldLabel>
                  <span>
                    姓 <span className="text-[#6c6c6c]">（必須）</span>
                  </span>
                  <TextInput placeholder="山田" value={lastName} onChange={setLastName} />
                </FieldLabel>
                <FieldLabel>
                  <span>
                    名 <span className="text-[#6c6c6c]">（必須）</span>
                  </span>
                  <TextInput placeholder="太郎" value={firstName} onChange={setFirstName} />
                </FieldLabel>
                <FieldLabel>
                  <span>
                    せい <span className="text-[#6c6c6c]">（必須）</span>
                  </span>
                  <TextInput placeholder="やまだ" value={lastNameKana} onChange={setLastNameKana} />
                </FieldLabel>
                <FieldLabel>
                  <span>
                    めい <span className="text-[#6c6c6c]">（必須）</span>
                  </span>
                  <TextInput placeholder="たろう" value={firstNameKana} onChange={setFirstNameKana} />
                </FieldLabel>
              </div>
            </section>

            <FieldLabel>
              <span>生年月日</span>
              <div className="flex h-[46px] items-center rounded-lg bg-white px-5 text-[#b0b0b0]">
                <input
                  type="text"
                  placeholder="YYYY/MM/DD"
                  className="w-full bg-transparent text-[16px] font-medium text-black outline-none placeholder:text-[#b0b0b0]"
                  inputMode="numeric"
                  value={birthday}
                  onChange={(event) => setBirthday(formatBirthday(event.target.value))}
                />
              </div>
            </FieldLabel>

            <FieldLabel>
              <span>キズナノートを書く</span>
              <textarea
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                placeholder="出会いの経緯や趣味、家族情報など特記事項を記載してください..."
                className="min-h-[156px] w-full resize-none rounded-lg bg-white px-5 py-5 text-[16px] font-medium text-black outline-none placeholder:text-[#b0b0b0]"
              />
            </FieldLabel>

            {errorMessage ? (
              <p className="text-[13px] font-medium text-[#d64253]">{errorMessage}</p>
            ) : null}

            <PrimaryCta
              type="submit"
              disabled={isSubmitting}
              className={`relative z-40 mt-10 ${isSubmitting ? "opacity-70" : ""}`}
            >
              {isSubmitting ? "保存中..." : "登録する"}
            </PrimaryCta>
          </form>
        </div>

        {isSavedModalOpen ? <SuccessModal onConfirm={() => router.push("/home")} /> : null}
      </main>
    </MobileShell>
  );
}
