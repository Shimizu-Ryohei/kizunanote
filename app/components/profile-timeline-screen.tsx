import Link from "next/link";
import MobileShell from "./mobile-shell";
import { kentaroSatoProfile, kentaroSatoTimeline } from "./profile-content";
import ProfileHeader from "./profile-header";

function TimelineCard({
  id,
  date,
  body,
}: {
  id: string;
  date: string;
  body: string;
}) {
  return (
    <div className="relative">
      <p className="text-[12px] font-bold tracking-[0.01em] text-[#727272]">{date}</p>
      <article className="relative mt-3 rounded-[18px] bg-[#f3f3f3] px-6 py-7">
        <p className="pr-8 text-[16px] leading-[1.75] font-medium text-[#4b4b4b]">{body}</p>
        <Link
          href={`/profiles/kentaro-sato/notes/${id}`}
          aria-label={`${date} のキズナノートを編集`}
          className="absolute bottom-4 right-4 text-[#bcbcbc]"
        >
          <EditIcon />
        </Link>
      </article>
    </div>
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

export default function ProfileTimelineScreen() {
  return (
    <MobileShell>
      <main className="px-6 pb-28">
        <ProfileHeader profile={kentaroSatoProfile} />

        <section className="mt-8">
          <div className="relative pl-10">
            <div className="absolute bottom-4 left-[11px] top-5 w-px bg-[#d9d9d9]" />
            <div className="space-y-9">
              {kentaroSatoTimeline.map((entry) => (
                <div key={entry.id} className="relative">
                  <span className="absolute -left-10 top-[2px] flex h-6 w-6 items-center justify-center rounded-full border border-[#bfbfbf] bg-white">
                    <span className="h-[6px] w-[6px] rounded-full bg-black" />
                  </span>
                  <TimelineCard {...entry} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
