"use client";

export default function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] bg-white px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <h2 className="text-[15px] font-bold text-[#1f1f1f]">{title}</h2>
      <div className="mt-4 space-y-4 text-[12px] font-medium leading-6 text-[#5d5d5d]">
        {children}
      </div>
    </section>
  );
}
