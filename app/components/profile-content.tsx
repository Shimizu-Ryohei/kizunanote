import type { ReactNode } from "react";

export type ProfileTag = {
  id: string;
  label: string;
};

export type ProfileHeaderData = {
  name: string;
  birthday: string;
  avatarAlt: string;
  avatarSrc?: string;
  avatarFallback?: ReactNode;
  tags: ProfileTag[];
};

export type TimelineEntry = {
  id: string;
  date: string;
  body: string;
};

export const kentaroSatoProfile: ProfileHeaderData = {
  name: "佐藤 健太郎",
  birthday: "1992年11月20日",
  avatarAlt: "佐藤健太郎",
  avatarSrc:
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&h=160&q=80",
  tags: [
    { id: "company", label: "株式会社モノ" },
    { id: "role", label: "デザイナー" },
  ],
};

export const kentaroSatoTimeline: TimelineEntry[] = [
  {
    id: "2024-10-12",
    date: "2024年10月12日",
    body:
      "Tech Conf 2025で面会。AI駆動のジェネレーティブとミニマリズムの交点に強い関心。",
  },
  {
    id: "2024-09-20",
    date: "2024年9月20日",
    body:
      "コーヒー派（ブラック、砂糖なし）であることを記憶。",
  },
  {
    id: "2024-08-05",
    date: "2024年8月5日",
    body:
      "エディトリアル・デジタル製品に特化した小規模スタジオを経営。",
  },
  {
    id: "2024-07-15",
    date: "2024年7月15日",
    body:
      "初対面。ポートフォリオのミニマルな構成に感銘。",
  },
];

export function getKentaroSatoTimelineEntry(noteId: string) {
  return kentaroSatoTimeline.find((entry) => entry.id === noteId);
}
