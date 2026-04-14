"use client";

import { useState } from "react";
import MobileShell from "./mobile-shell";

function NotificationToggle({
  label,
  defaultEnabled,
  note,
}: {
  label: string;
  defaultEnabled: boolean;
  note?: string;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <button
      type="button"
      onClick={() => setEnabled((current) => !current)}
      className="flex min-h-[52px] w-full items-center rounded-[14px] bg-white px-5 py-3 text-left text-[14px] font-medium text-[#2f2f2f] shadow-[0_1px_0_rgba(0,0,0,0.01)]"
    >
      <span className="flex-1">
        <span className="block text-[14px] font-medium leading-none">{label}</span>
        {note ? (
          <span className="mt-2 block pr-4 text-[11px] leading-4 font-medium text-[#b0b0b0]">
            {note}
          </span>
        ) : null}
      </span>
      <span
        className={`flex h-5 w-9 items-center rounded-full p-[2px] transition-colors ${
          enabled ? "bg-[#59c183]" : "bg-[#dedede]"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

export default function NotificationSettingsScreen() {
  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2">
          <div className="space-y-3">
            <NotificationToggle
              label="プッシュ通知"
              defaultEnabled
              note="ホーム画面にWEBアプリとして追加するとプッシュ通知を受け取ることができます"
            />
            <NotificationToggle label="メール通知" defaultEnabled={false} />
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
