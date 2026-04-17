"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type DeleteProfileConfirmModalProps = {
  isDeleting?: boolean;
  onCancel: () => void;
  onDelete: () => void;
};

export default function DeleteProfileConfirmModal({
  isDeleting = false,
  onCancel,
  onDelete,
}: DeleteProfileConfirmModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/12">
      <div className="mx-auto flex min-h-screen max-w-[430px] items-center justify-center px-6">
        <div className="w-full rounded-[24px] bg-white px-6 pb-6 pt-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <p className="text-[19px] font-black text-black">本当に削除しますか？</p>
          <p className="mt-3 text-[13px] font-medium leading-6 text-[#6f6f6f]">
            このプロフィールと関連するキズナノート、連絡先情報は削除されます。
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex h-[46px] items-center justify-center rounded-full border border-[#e3e3e3] bg-white text-[14px] font-bold text-[#6f6f6f] disabled:opacity-60"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex h-[46px] items-center justify-center rounded-full bg-[#d64253] text-[14px] font-black text-white disabled:opacity-70"
            >
              {isDeleting ? "削除中..." : "削除する"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
