"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import SuccessModal from "./success-modal";
import { compressImage } from "@/lib/image/compress-image";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-[14px] font-bold text-[#4b4b4b]">
      {children}
    </label>
  );
}

function TextInput({
  defaultValue,
}: {
  defaultValue: string;
}) {
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      className="h-[44px] w-full rounded-lg bg-white px-5 text-[16px] font-medium text-black outline-none"
    />
  );
}

export default function BasicProfileEditScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [birthday, setBirthday] = useState("1992/11/20");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
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
      setPhotoPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error(error);
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

  return (
    <MobileShell>
      <main className="relative px-5 pb-[168px]">
        <div className={isSavedModalOpen ? "pointer-events-none blur-md" : ""}>
          <form
            className="mt-1 space-y-8"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              setIsSavedModalOpen(true);
            }}
          >
            <section className="flex items-start gap-4">
              <button
                type="button"
                aria-label="プロフィール画像を変更"
                onClick={() => fileInputRef.current?.click()}
                className="self-center flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e2e2e2] bg-[#f4f4f4]"
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
                  <Image
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&h=160&q=80"
                    alt="佐藤健太郎"
                    width={72}
                    height={72}
                    className="h-full w-full object-cover grayscale"
                  />
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
                  <span>姓</span>
                  <TextInput defaultValue="佐藤" />
                </FieldLabel>
                <FieldLabel>
                  <span>名</span>
                  <TextInput defaultValue="健太郎" />
                </FieldLabel>
                <FieldLabel>
                  <span>せい</span>
                  <TextInput defaultValue="さとう" />
                </FieldLabel>
                <FieldLabel>
                  <span>めい</span>
                  <TextInput defaultValue="けんたろう" />
                </FieldLabel>
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

            <PrimaryCta type="submit" className="relative z-40 mt-10">
              保存する
            </PrimaryCta>
          </form>
        </div>

        {isSavedModalOpen ? (
          <SuccessModal onConfirm={() => router.replace("/profiles/kentaro-sato")} />
        ) : null}
      </main>
    </MobileShell>
  );
}
