"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MobileShell from "./mobile-shell";
import PrimaryCta from "./primary-cta";
import SuccessModal from "./success-modal";

type NoteEditScreenProps = {
  noteId: string;
  date: string;
  body: string;
};

export default function NoteEditScreen({
  noteId,
  date,
  body,
}: NoteEditScreenProps) {
  const router = useRouter();
  const [noteBody, setNoteBody] = useState(body);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  const handleSavedConfirm = () => {
    setIsSavedModalOpen(false);
    router.replace("/profiles/kentaro-sato/notes");
  };

  return (
    <MobileShell>
      <main className="px-6 pb-28">
        <div className={isSavedModalOpen ? "pointer-events-none blur-md" : ""}>
          <h1 className="mt-1 text-[18px] font-black text-[#1f1f1f]">{date}</h1>

          <textarea
            value={noteBody}
            onChange={(event) => setNoteBody(event.target.value)}
            className="mt-11 min-h-[376px] w-full resize-none rounded-[28px] bg-[#f3f3f3] px-7 py-8 text-[16px] leading-[1.75] font-medium text-[#2f2f2f] outline-none"
            aria-label={`${date} のキズナノート`}
            data-note-id={noteId}
          />

          <PrimaryCta className="mx-auto mt-10 w-[160px]" onClick={() => setIsSavedModalOpen(true)}>
            保存する
          </PrimaryCta>
        </div>

        {isSavedModalOpen ? <SuccessModal onConfirm={handleSavedConfirm} /> : null}
      </main>
    </MobileShell>
  );
}
