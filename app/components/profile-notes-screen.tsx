"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MobileShell from "./mobile-shell";
import ProfileHeader from "./profile-header";
import { useAuth } from "./auth-provider";
import { getProfileDetailById, listProfileNotes, type ProfileDetail, type ProfileNoteItem } from "@/lib/firebase/profiles";
import type { ProfileHeaderData } from "./profile-content";

function TimelineCard({
  profileId,
  id,
  body,
  sourceType,
}: {
  profileId: string;
  id: string;
  body: string;
  sourceType: ProfileNoteItem["sourceType"];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldClamp =
    sourceType === "company_release" && (body.split("\n").length > 5 || body.length > 220);

  return (
    <article className="relative rounded-[18px] bg-[#f3f3f3] px-6 py-7">
      <p
        className="pr-8 text-[16px] leading-[1.75] font-medium whitespace-pre-wrap text-[#4b4b4b]"
        style={
          shouldClamp && !isExpanded
            ? {
                display: "-webkit-box",
                WebkitLineClamp: 5,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : undefined
        }
      >
        {body}
      </p>
      {shouldClamp ? (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="mt-3 text-[12px] font-bold text-[var(--color-main)] underline"
        >
          {isExpanded ? "閉じる" : "全文を見る"}
        </button>
      ) : null}
      <Link
        href={`/profiles/${profileId}/notes/${id}`}
        aria-label="キズナノートを編集"
        className="absolute bottom-4 right-4 text-[#bcbcbc]"
      >
        <EditIcon />
      </Link>
    </article>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M4 16.75V20h3.25L17.1 10.15l-3.25-3.25L4 16.75Zm11.9-10.6 1.2-1.2a1.53 1.53 0 0 1 2.15 0l.8.8a1.53 1.53 0 0 1 0 2.15l-1.2 1.2-2.95-2.95Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProfileNotesScreen({ profileId }: { profileId: string }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [notes, setNotes] = useState<ProfileNoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;
    Promise.all([getProfileDetailById(profileId, user.uid), listProfileNotes(profileId, user.uid)])
      .then(([detail, noteItems]) => {
        if (!isMounted) {
          return;
        }

        setProfile(detail);
        setNotes(noteItems);
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setErrorMessage("キズナノート一覧の取得に失敗しました。");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [profileId, user]);

  const headerProfile = useMemo<ProfileHeaderData | null>(() => {
    if (!profile) {
      return null;
    }

    return {
      name: profile.fullName,
      birthday: profile.birthdayLabel || "未登録",
      avatarAlt: profile.fullName,
      avatarSrc: profile.photoUrl ?? undefined,
      avatarFallback: profile.fullName.slice(0, 1),
      tags: [],
    };
  }, [profile]);

  const groupedNotes = useMemo(() => {
    return notes.reduce<Array<{ date: string; entries: ProfileNoteItem[] }>>((acc, note) => {
      const lastGroup = acc.at(-1);

      if (lastGroup && lastGroup.date === note.happenedAtLabel) {
        lastGroup.entries.push(note);
        return acc;
      }

      acc.push({
        date: note.happenedAtLabel,
        entries: [note],
      });

      return acc;
    }, []);
  }, [notes]);

  return (
    <MobileShell>
      <main className="px-6 pb-28">
        {isLoading ? <p className="mt-6 text-[14px] font-medium text-[#8b8b8b]">キズナノートを読み込み中...</p> : null}
        {!isLoading && errorMessage && !profile ? <p className="mt-6 text-[13px] font-medium text-[#d64253]">{errorMessage}</p> : null}
        {profile && headerProfile ? (
          <>
            <ProfileHeader profile={headerProfile} href={`/profiles/${profileId}`} />
            <section className="mt-8">
              <div className="relative pl-10">
                <div className="absolute bottom-4 left-[11px] top-5 w-px bg-[#d9d9d9]" />
                <div className="space-y-9">
                  {groupedNotes.map((group) => (
                    <div key={group.date} className="relative">
                      <span className="absolute -left-10 top-[2px] flex h-6 w-6 items-center justify-center rounded-full border border-[#bfbfbf] bg-white">
                        <span className="h-[6px] w-[6px] rounded-full bg-black" />
                      </span>
                      <p className="text-[12px] font-bold tracking-[0.01em] text-[#727272]">{group.date}</p>
                      <div className="mt-3 space-y-4">
                        {group.entries.map((entry) => (
                          <TimelineCard
                            key={entry.id}
                            profileId={profileId}
                            id={entry.id}
                            body={entry.body}
                            sourceType={entry.sourceType}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </MobileShell>
  );
}
