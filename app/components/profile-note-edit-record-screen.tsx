"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import SuccessModal from "./success-modal";
import { useAuth } from "./auth-provider";
import { getProfileNoteById, updateProfileNote } from "@/lib/firebase/profiles";

export default function ProfileNoteEditRecordScreen({
  profileId,
  noteId,
}: {
  profileId: string;
  noteId: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;
    getProfileNoteById(profileId, noteId, user.uid)
      .then((note) => {
        if (!isMounted) {
          return;
        }

        setDate(note.happenedAtLabel);
        setNoteBody(note.body);
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setErrorMessage("キズナノートの取得に失敗しました。");
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
  }, [noteId, profileId, user]);

  const handleSave = async () => {
    if (!user) {
      setErrorMessage("ログイン状態を確認できませんでした。");
      return;
    }

    try {
      setIsSaving(true);
      await updateProfileNote(profileId, noteId, noteBody, user.uid);
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
      <main className="px-6 pb-28">
        {isLoading ? <p className="mt-6 text-[14px] font-medium text-[#8b8b8b]">キズナノートを読み込み中...</p> : null}
        {!isLoading ? (
          <div className={isSavedModalOpen ? "pointer-events-none blur-md" : ""}>
            <h1 className="mt-1 text-[18px] font-black text-[#1f1f1f]">{date}</h1>
            <textarea
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              className="mt-11 min-h-[376px] w-full resize-none rounded-[28px] bg-[#f3f3f3] px-7 py-8 text-[16px] leading-[1.75] font-medium text-[#2f2f2f] outline-none"
              aria-label={`${date} のキズナノート`}
            />
            {errorMessage ? <p className="mt-5 text-[13px] font-medium text-[#d64253]">{errorMessage}</p> : null}
            <PrimaryCta className={`mx-auto mt-10 w-[160px] ${isSaving ? "opacity-70" : ""}`} onClick={handleSave} disabled={isSaving}>
              {isSaving ? "保存中..." : "保存する"}
            </PrimaryCta>
          </div>
        ) : null}

        {isSavedModalOpen ? <SuccessModal onConfirm={() => router.replace(`/profiles/${profileId}/notes`)} /> : null}
      </main>
    </MobileShell>
  );
}
