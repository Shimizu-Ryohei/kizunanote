import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryCtaProps = {
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function PrimaryCta({
  children,
  className = "",
  type = "button",
  ...props
}: PrimaryCtaProps) {
  return (
    <button
      type={type}
      className={`flex h-[58px] w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,#111111_0%,#2a2a2a_100%)] text-[15px] font-bold text-white shadow-[0_18px_28px_rgba(0,0,0,0.12)] ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
