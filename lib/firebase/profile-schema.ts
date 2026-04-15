export type ProfileDoc = {
  ownerUid: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  fullName: string;
  fullNameKana: string;
  birthday: string | null;
  workplaceTag: string | null;
  photoUrl: string | null;
  photoStoragePath: string | null;
  noteCount: number;
  latestNoteAt: unknown | null;
  lastNoteUpdatedAt: unknown | null;
  lastSummarizedAt: unknown | null;
  summarySeenAt: unknown | null;
  summaryStatus: "idle" | "pending" | "processing" | "ready" | "error";
  createdAt: unknown;
  updatedAt: unknown;
};

export type ProfileContactDoc = {
  phoneCountryCode: string;
  phone: string;
  email: string;
  x: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  updatedAt: unknown;
};

export type ProfileSummaryDoc = {
  ownerUid: string;
  bullets: string[];
  sourceNoteCount: number;
  lastNoteUpdatedAt: unknown | null;
  lastSummarizedAt: unknown | null;
  model: string | null;
  version: number;
  updatedAt: unknown;
};

export type KizunaNoteDoc = {
  body: string;
  happenedAt: unknown;
  createdByUid: string;
  createdAt: unknown;
  updatedAt: unknown;
};
