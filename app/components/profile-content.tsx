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
