import Link from "next/link";
import Image from "next/image";
import type { ProfileHeaderData } from "./profile-content";

type ProfileHeaderProps = {
  profile: ProfileHeaderData;
  avatarSize?: number;
  className?: string;
  editHref?: string;
  editLabel?: string;
  href?: string;
  linkLabel?: string;
};

export default function ProfileHeader({
  profile,
  avatarSize = 58,
  className = "",
  editHref,
  editLabel = "プロフィール基本情報を編集",
  href,
  linkLabel = `${profile.name}のプロフィールへ移動`,
}: ProfileHeaderProps) {
  const profileContent = (
    <div className="flex min-w-0 items-center gap-4">
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ededed] text-[#bdbdbd]"
        style={{ height: avatarSize, width: avatarSize }}
      >
        {profile.avatarSrc ? (
          <Image
            alt={profile.avatarAlt}
            src={profile.avatarSrc}
            width={avatarSize}
            height={avatarSize}
            className="h-full w-full object-cover"
          />
        ) : (
          profile.avatarFallback
        )}
      </div>
      <div className="min-w-0">
        <h1 className="text-[24px] font-black text-[#222]">{profile.name}</h1>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3">
          {profile.tags.map((tag) => (
            <span
              key={tag.id}
              className="max-w-[112px] truncate rounded-full bg-[var(--color-sub)] px-3 py-1 text-[9px] font-black tracking-[0] text-[var(--color-main)]"
            >
              {tag.label}
            </span>
          ))}
        </div>
        <p className="mt-1 text-[14px] font-medium text-[#aeaeae]">
          Birthday: {profile.birthday}
        </p>
      </div>
    </div>
  );

  return (
    <section className={`flex items-start justify-between gap-4 ${className}`.trim()}>
      {href ? (
        <Link href={href} aria-label={linkLabel} className="min-w-0 flex-1">
          {profileContent}
        </Link>
      ) : (
        profileContent
      )}
      {editHref ? (
        <Link
          href={editHref}
          aria-label={editLabel}
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#9a9a9a] shadow-[0_1px_0_rgba(0,0,0,0.01)]"
        >
          <EditIcon />
        </Link>
      ) : null}
    </section>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 16.75V20h3.25L17.1 10.15l-3.25-3.25L4 16.75Zm11.9-10.6 1.2-1.2a1.53 1.53 0 0 1 2.15 0l.8.8a1.53 1.53 0 0 1 0 2.15l-1.2 1.2-2.95-2.95Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
