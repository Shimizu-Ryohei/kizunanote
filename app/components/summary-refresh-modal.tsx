"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type SummaryRefreshModalProps =
  | {
      mode: "confirm";
      onCancel: () => void;
      onConfirm: () => void;
    }
  | {
      mode: "loading";
    }
  | {
      mode: "success";
      onConfirm: () => void;
    };

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8 animate-spin text-[var(--color-main)]" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2.4" />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#dff2e9]">
      <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#59c183] text-white">
        <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <path
            d="m6.75 12.25 3.5 3.5 7-7.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export default function SummaryRefreshModal(props: SummaryRefreshModalProps) {
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
          {props.mode === "loading" ? (
            <>
              <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[var(--color-sub)]">
                <SpinnerIcon />
              </div>
              <p className="mt-6 text-[19px] font-black text-black">要約しています</p>
            </>
          ) : props.mode === "success" ? (
            <>
              <CheckIcon />
              <p className="mt-6 text-[19px] font-black text-black">要約が完了しました</p>
              <button
                type="button"
                onClick={props.onConfirm}
                className="mx-auto mt-8 flex h-[44px] w-[170px] items-center justify-center rounded-full bg-black text-[15px] font-medium tracking-[0.35em] text-white"
              >
                OK
              </button>
            </>
          ) : (
            <>
              <p className="text-[19px] font-black text-black">今すぐ要約しますか？</p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={props.onCancel}
                  className="flex h-[46px] items-center justify-center rounded-full border border-[#e3e3e3] bg-white text-[14px] font-bold text-[#6f6f6f]"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={props.onConfirm}
                  className="flex h-[46px] items-center justify-center rounded-full bg-[var(--color-main)] text-[14px] font-black text-white"
                >
                  今すぐ要約する
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
