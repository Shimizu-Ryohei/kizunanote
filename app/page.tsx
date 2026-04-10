import Image from "next/image";
import MobileShell from "./components/mobile-shell";
import { ChevronRightIcon, FilterIcon } from "./components/icons";

type CuratedLog = {
  id: number;
  name: string;
  company: string;
  role: string;
  group: string;
  avatar?: string;
  initials?: string;
  update?: boolean;
};

const curatedLogs: CuratedLog[] = [
  {
    id: 1,
    name: "佐藤 健太郎",
    company: "株式会社モノ",
    role: "デザイナー",
    group: "S ・ さ",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&h=160&q=80",
    update: true,
  },
  {
    id: 2,
    name: "鈴木 舞",
    company: "STUDIO ARTIC",
    role: "キュレーター",
    group: "S ・ さ",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&h=160&q=80",
  },
  {
    id: 3,
    name: "高橋 誠",
    company: "T-ARCH LAB",
    role: "建築家",
    group: "T ・ た",
    avatar:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=160&h=160&q=80",
  },
  {
    id: 4,
    name: "田中 美香",
    company: "日本通信",
    role: "営業部長",
    group: "T ・ た",
    initials: "TM",
  },
  {
    id: 5,
    name: "渡辺 玲奈",
    company: "CREATIVE CO.",
    role: "ライター",
    group: "W ・ わ",
    avatar:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=160&h=160&q=80",
  },
];

function SearchBox() {
  return (
    <label className="flex h-[62px] items-center gap-5 rounded-lg bg-white px-7 text-[#a6a6a6] shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <FilterIcon className="h-5 w-5 shrink-0" />
      <span className="sr-only">キュレーションログを検索</span>
      <input
        className="w-full bg-transparent text-[14px] text-black outline-none placeholder:text-[#8f8f8f]"
        placeholder="Search curated logs..."
        type="search"
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

function LogCard({ log }: { log: CuratedLog }) {
  return (
    <article className="flex min-h-[112px] items-center gap-7 rounded-lg bg-white px-7 shadow-[0_1px_0_rgba(0,0,0,0.01)]">
      <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0f0f0] text-[20px] font-bold text-[#c8c8c8]">
        {log.avatar ? (
          <Image
            alt=""
            className="h-full w-full object-cover grayscale"
            height={58}
            src={log.avatar}
            width={58}
          />
        ) : (
          log.initials
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h2 className="truncate text-[20px] font-black tracking-[0] text-[#252525]">
            {log.name}
          </h2>
          {log.update ? (
            <span className="rounded-full bg-[#df5660] px-3 py-1 text-[9px] font-black tracking-[0] text-white">
              UPDATE
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex min-w-0 items-center gap-3">
          <span className="max-w-[104px] truncate rounded-full bg-[#d8d8d8] px-3 py-1 text-[9px] font-black tracking-[0] text-[#777]">
            {log.company}
          </span>
          <span className="truncate text-[10px] font-bold tracking-[0] text-[#454545]">
            {log.role}
          </span>
        </div>
      </div>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#9d9d9d]" />
    </article>
  );
}

export default function Home() {
  const groups = curatedLogs.reduce<Record<string, CuratedLog[]>>((acc, log) => {
    acc[log.group] = [...(acc[log.group] ?? []), log];
    return acc;
  }, {});

  return (
    <MobileShell>
      <main className="px-7 pb-32">
        <SearchBox />
        {Object.entries(groups).map(([group, logs]) => (
          <section key={group} aria-labelledby={`group-${group}`}>
            <SectionLabel>
              {group}
            </SectionLabel>
            <h2 id={`group-${group}`} className="sr-only">
              {group} のログ
            </h2>
            <div className="space-y-5">
              {logs.map((log) => (
                <LogCard key={log.id} log={log} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </MobileShell>
  );
}
