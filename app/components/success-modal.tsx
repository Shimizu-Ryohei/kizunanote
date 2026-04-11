type SuccessModalProps = {
  buttonLabel?: string;
  message?: string;
  onConfirm: () => void;
};

export default function SuccessModal({
  buttonLabel = "OK",
  message = "保存しました",
  onConfirm,
}: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-40 bg-white/18">
      <div className="mx-auto flex min-h-screen max-w-[430px] items-center justify-center px-7">
        <div className="w-full rounded-[24px] bg-white px-8 pb-7 pt-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
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
          <p className="mt-6 text-[18px] font-bold text-black">{message}</p>
          <button
            type="button"
            onClick={onConfirm}
            className="mx-auto mt-8 flex h-[44px] w-[170px] items-center justify-center rounded-full bg-black text-[15px] font-medium tracking-[0.35em] text-white"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
