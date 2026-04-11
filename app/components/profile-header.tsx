import Image from "next/image";
import type { ProfileHeaderData } from "./profile-content";

type ProfileHeaderProps = {
  profile: ProfileHeaderData;
  avatarSize?: number;
  className?: string;
};

export default function ProfileHeader({
  profile,
  avatarSize = 58,
  className = "",
}: ProfileHeaderProps) {
  return (
    <section className={`flex items-center gap-4 ${className}`.trim()}>
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
            className="h-full w-full object-cover grayscale"
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
              className="max-w-[112px] truncate rounded-full bg-[#d8d8d8] px-3 py-1 text-[9px] font-black tracking-[0] text-[#777]"
            >
              {tag.label}
            </span>
          ))}
        </div>
        <p className="mt-1 text-[14px] font-medium text-[#aeaeae]">
          Birthday: {profile.birthday}
        </p>
      </div>
    </section>
  );
}
