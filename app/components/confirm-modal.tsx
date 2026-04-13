"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type ConfirmModalProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  cancelLabel = "キャンセル",
  confirmLabel = "OK",
  message,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
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
    <div className="fixed inset-0 z-50 bg-white/18">
      <div className="mx-auto flex min-h-screen max-w-[430px] items-center justify-center px-7">
        <div className="w-full rounded-[24px] bg-white px-8 pb-7 pt-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <p className="text-[18px] font-bold text-black">{message}</p>
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-[44px] flex-1 items-center justify-center rounded-full border border-[#e7e7e7] bg-white text-[14px] font-medium text-[#666]"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex h-[44px] flex-1 items-center justify-center rounded-full bg-black text-[14px] font-medium text-white"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
