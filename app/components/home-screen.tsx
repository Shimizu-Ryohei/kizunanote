"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MobileShell from "./mobile-shell";
import { FilterIcon } from "./icons";
import { useAuth } from "./auth-provider";
import { listProfilesByOwner, type ProfileListItem } from "@/lib/firebase/profiles";

function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-2 flex h-[62px] items-center gap-5 rounded-lg bg-white px-7 text-[#a6a6a6] shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <FilterIcon className="h-5 w-5 shrink-0" />
      <span className="sr-only">キズナノートを検索</span>
      <input
        className="w-full bg-transparent text-[14px] text-black outline-none placeholder:text-[#8f8f8f]"
        placeholder="氏名で検索する"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-7 mt-8 rounded-full bg-[#e4e4e4] px-4 py-1 text-[11px] font-bold tracking-[0] text-[#5b5b5b]">
      {children}
    </div>
  );
}

function getGroupLabel(profile: ProfileListItem) {
  const kana = profile.fullNameKana.replace(/\s/g, "");
  return kana.charAt(0) || "#";
}

function LogCard({ profile }: { profile: ProfileListItem }) {
  const tags = [profile.workplace, profile.birthday].filter((tag): tag is string => Boolean(tag));

  return (
    <Link href={`/profiles/${profile.id}`} className="block">
      <article className="flex min-h-[112px] items-center gap-7 rounded-lg bg-white px-7 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
        <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0f0f0] text-[20px] font-bold text-[#c8c8c8]">
          {profile.photoUrl ? (
            <Image
              alt=""
              className="h-full w-full object-cover"
              height={58}
              src={profile.photoUrl}
              width={58}
            />
          ) : (
            `${profile.lastName.charAt(0)}${profile.firstName.charAt(0)}`.trim() || "?"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[20px] font-black tracking-[0] text-[#252525]">
            {profile.fullName}
          </h2>
          {tags.length ? (
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="max-w-[148px] truncate rounded-full bg-[var(--color-sub)] px-3 py-1 text-[9px] font-black tracking-[0] text-[var(--color-main)]"
                  title={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

function EmptyState({ hasSearchQuery }: { hasSearchQuery: boolean }) {
  return (
    <div className="mt-10 rounded-[24px] bg-white px-7 py-10 text-center shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <p className="text-[16px] font-bold text-[#3a3a3a]">
        {hasSearchQuery ? "該当するプロフィールがありません" : "まだプロフィールがありません"}
      </p>
      <p className="mt-3 text-[13px] font-medium leading-6 text-[#8b8b8b]">
        {hasSearchQuery
          ? "検索条件を変えてお試しください。"
          : "中央の + ボタンから最初のプロフィールを登録してください。"}
      </p>
    </div>
  );
}

function FirstProfilePrompt() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-20 mx-auto flex max-w-[430px] justify-center px-6"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6.5rem)" }}
    >
      <div className="animate-[prompt-bob_1.1s_ease-out] relative max-w-[272px] rounded-[18px] bg-[var(--color-main)] px-4 py-3 text-center text-[13px] font-black leading-5 text-white shadow-[0_10px_24px_rgba(48,124,255,0.22)]">
        <span className="block">まずはここから</span>
        <span className="block">知り合いを登録してみよう</span>
        <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent border-t-[var(--color-main)]" />
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    listProfilesByOwner(user.uid)
      .then((items) => {
        if (!isMounted) {
          return;
        }

        setProfiles(items);
        setErrorMessage("");
      })
      .catch((error) => {
        console.error(error);

        if (!isMounted) {
          return;
        }

        setErrorMessage("プロフィール一覧の取得に失敗しました。時間を置いて再度お試しください。");
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

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return profiles;
    }

    return profiles.filter((profile) =>
      `${profile.fullName} ${profile.fullNameKana}`.toLowerCase().includes(normalizedQuery),
    );
  }, [profiles, searchQuery]);

  const groups = useMemo(
    () =>
      filteredProfiles.reduce<Record<string, ProfileListItem[]>>((acc, profile) => {
        const group = getGroupLabel(profile);
        acc[group] = [...(acc[group] ?? []), profile];
        return acc;
      }, {}),
    [filteredProfiles],
  );

  const shouldShowFirstProfilePrompt =
    !isLoading && !errorMessage && profiles.length === 0 && !searchQuery.trim();

  return (
    <MobileShell>
      <main className="px-7 pb-28">
        <SearchBox value={searchQuery} onChange={setSearchQuery} />

        {errorMessage ? (
          <p className="mt-8 text-[13px] font-medium text-[#d64253]">{errorMessage}</p>
        ) : null}

        {isLoading ? (
          <p className="mt-10 text-[14px] font-medium text-[#8b8b8b]">プロフィールを読み込み中...</p>
        ) : null}

        {!isLoading && filteredProfiles.length === 0 ? (
          <EmptyState hasSearchQuery={Boolean(searchQuery.trim())} />
        ) : null}

        {!isLoading
          ? Object.entries(groups).map(([group, items]) => (
              <section key={group} aria-labelledby={`group-${group}`}>
                <SectionLabel>{group}</SectionLabel>
                <h2 id={`group-${group}`} className="sr-only">
                  {group} のプロフィール
                </h2>
                <div className="space-y-5">
                  {items.map((profile) => (
                    <LogCard key={profile.id} profile={profile} />
                  ))}
                </div>
              </section>
            ))
          : null}
      </main>
      {shouldShowFirstProfilePrompt ? <FirstProfilePrompt /> : null}
    </MobileShell>
  );
}
