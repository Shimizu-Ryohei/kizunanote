export type ProfileDoc = {
  ownerUid: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  fullName: string;
  fullNameKana: string;
  birthday: string | null;
  photoUrl: string | null;
  photoStoragePath: string | null;
  noteCount: number;
  latestNoteAt: unknown | null;
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
  bullets: string[];
  sourceNoteIds: string[];
  generatedAt: unknown | null;
  updatedAt: unknown;
};

export type KizunaNoteDoc = {
  body: string;
  happenedAt: unknown;
  createdByUid: string;
  createdAt: unknown;
  updatedAt: unknown;
};
