"use client";

import { useEffect, useState } from "react";
import MobileShell from "./mobile-shell";
import { useAuth } from "./auth-provider";
import {
  deletePushNotificationToken,
  getNotificationSettings,
  savePushNotificationToken,
  updateNotificationSettings,
  type NotificationSettings,
} from "@/lib/firebase/notification-settings";
import {
  isPushNotificationSupported,
  removeCurrentPushNotificationToken,
  requestPushNotificationToken,
} from "@/lib/firebase/push-notifications";

function NotificationToggle({
  label,
  enabled,
  note,
  onToggle,
  disabled,
}: {
  label: string;
  enabled: boolean;
  note?: string;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex min-h-[52px] w-full items-center rounded-[14px] bg-white px-5 py-3 text-left text-[14px] font-medium text-[#2f2f2f] shadow-[0_1px_0_rgba(0,0,0,0.01)] ${
        disabled ? "opacity-60" : ""
      }`}
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
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPushSupported, setIsPushSupported] = useState(false);

  useEffect(() => {
    isPushNotificationSupported()
      .then(setIsPushSupported)
      .catch((error) => {
        console.error(error);
        setIsPushSupported(false);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    getNotificationSettings(user.uid)
      .then((nextSettings) => {
        if (!isMounted) {
          return;
        }

        setSettings(nextSettings);
        setErrorMessage("");
      })
      .catch((error) => {
        console.error(error);

        if (!isMounted) {
          return;
        }

        setErrorMessage("通知設定の取得に失敗しました。");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleToggle = async (key: keyof NotificationSettings) => {
    if (!user || isSaving || !settings) {
      return;
    }

    const nextValue = !settings[key];
    const nextSettings = {
      ...settings,
      [key]: nextValue,
    };

    setSettings(nextSettings);
    setIsSaving(true);
    setErrorMessage("");

    try {
      if (key === "pushEnabled") {
        if (nextValue) {
          if (!isPushSupported) {
            throw new Error("このブラウザではプッシュ通知を利用できません。");
          }

          const token = await requestPushNotificationToken();
          await savePushNotificationToken(user.uid, token);
        } else {
          const token = await removeCurrentPushNotificationToken();

          if (token) {
            await deletePushNotificationToken(user.uid, token);
          }
        }
      }

      await updateNotificationSettings(user.uid, nextSettings);
    } catch (error) {
      console.error(error);
      setSettings(settings);
      setErrorMessage(
        error instanceof Error ? error.message : "通知設定の保存に失敗しました。",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MobileShell>
      <main className="px-4 pb-28">
        <section className="mt-2">
          {isLoading ? (
            <p className="mb-4 text-[13px] font-medium text-[#8b8b8b]">通知設定を読み込み中...</p>
          ) : null}
          {errorMessage ? (
            <p className="mb-4 text-[13px] font-medium text-[#d64253]">{errorMessage}</p>
          ) : null}
          {settings ? (
            <div className="space-y-3">
              <NotificationToggle
                label="プッシュ通知"
                enabled={settings.pushEnabled}
                onToggle={() => handleToggle("pushEnabled")}
                disabled={isSaving}
                note="ホーム画面にWEBアプリとして追加し、通知を許可すると誕生日通知を受け取れます"
              />
              <NotificationToggle
                label="メール通知"
                enabled={settings.emailEnabled}
                onToggle={() => handleToggle("emailEnabled")}
                disabled={isSaving}
              />
            </div>
          ) : null}
        </section>
      </main>
    </MobileShell>
  );
}
