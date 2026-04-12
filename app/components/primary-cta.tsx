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
      className={`flex h-[58px] w-full items-center justify-center rounded-full bg-[var(--color-main)] text-[15px] font-bold text-white ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
