import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseAuth, firestore, getFirebaseConfigError, storage } from "./client";
import type {
  KizunaNoteDoc,
  ProfileContactDoc,
  ProfileDoc,
  ProfileSummaryDoc,
} from "./profile-schema";

type CreateProfileInput = {
  birthday: string;
  firstName: string;
  firstNameKana: string;
  lastName: string;
  lastNameKana: string;
  noteBody: string;
  photoFile: File | null;
};

export type ProfileListItem = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  fullNameKana: string;
  birthday: string | null;
  photoUrl: string | null;
  noteCount: number;
};

export type ProfileContact = {
  phoneCountryCode: string;
  phone: string;
  email: string;
  x: string;
  facebook: string;
  instagram: string;
  linkedin: string;
};

export type ProfileNoteItem = {
  id: string;
  body: string;
  happenedAtLabel: string;
  createdAtMillis: number;
};

type UpdateProfileBasicsInput = {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  birthday: string;
  photoFile: File | null;
};

type UpdateProfileContactInput = {
  phoneCountryCode: string;
  phone: string;
  email: string;
  x: string;
  facebook: string;
  instagram: string;
  linkedin: string;
};

export type ProfileDetail = {
  id: string;
  fullName: string;
  fullNameKana: string;
  birthday: string;
  birthdayLabel: string;
  photoUrl: string | null;
  noteCount: number;
  latestNoteLabel: string;
  contacts: ProfileContact;
  notes: ProfileNoteItem[];
};

function ensureFirebaseProfileAccess() {
  const user = firebaseAuth?.currentUser;

  if (!firebaseAuth || !firestore || !user) {
    throw new Error(getFirebaseConfigError());
  }

  return { firestore, user };
}

function formatBirthdayForFirestore(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length !== 8) {
    return "";
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

export async function createProfile({
  birthday,
  firstName,
  firstNameKana,
  lastName,
  lastNameKana,
  noteBody,
  photoFile,
}: CreateProfileInput) {
  const { firestore, user } = ensureFirebaseProfileAccess();
  const normalizedBirthday = formatBirthdayForFirestore(birthday) || null;
  const trimmedLastName = lastName.trim();
  const trimmedFirstName = firstName.trim();
  const trimmedLastNameKana = lastNameKana.trim();
  const trimmedFirstNameKana = firstNameKana.trim();
  const trimmedNoteBody = noteBody.trim();

  const profilePayload: ProfileDoc = {
    ownerUid: user.uid,
    lastName: trimmedLastName,
    firstName: trimmedFirstName,
    lastNameKana: trimmedLastNameKana,
    firstNameKana: trimmedFirstNameKana,
    fullName: `${trimmedLastName} ${trimmedFirstName}`.trim(),
    fullNameKana: `${trimmedLastNameKana} ${trimmedFirstNameKana}`.trim(),
    birthday: normalizedBirthday,
    photoUrl: null,
    photoStoragePath: null,
    noteCount: trimmedNoteBody ? 1 : 0,
    latestNoteAt: trimmedNoteBody ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const profileRef = await addDoc(collection(firestore, "profiles"), profilePayload);

  const contactPayload: ProfileContactDoc = {
    phoneCountryCode: "+81",
    phone: "",
    email: "",
    x: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    updatedAt: serverTimestamp(),
  };

  const summaryPayload: ProfileSummaryDoc = {
    bullets: [],
    sourceNoteIds: [],
    generatedAt: null,
    updatedAt: serverTimestamp(),
  };

  await Promise.all([
    setDoc(doc(firestore, "profiles", profileRef.id, "private", "contact"), contactPayload),
    setDoc(doc(firestore, "profiles", profileRef.id, "private", "summary"), summaryPayload),
  ]);

  if (trimmedNoteBody) {
    const notePayload: KizunaNoteDoc = {
      body: trimmedNoteBody,
      happenedAt: serverTimestamp(),
      createdByUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(firestore, "profiles", profileRef.id, "notes"), notePayload);
  }

  if (photoFile && storage) {
    try {
      const photoStoragePath = `users/${user.uid}/profiles/${profileRef.id}/avatar`;
      const storageRef = ref(storage, photoStoragePath);
      await uploadBytes(storageRef, photoFile);
      const photoUrl = await getDownloadURL(storageRef);

      await updateDoc(profileRef, {
        photoUrl,
        photoStoragePath,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to upload profile photo", error);
    }
  }

  return profileRef.id;
}

function formatBirthdayForDisplay(value: string | null) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatDateLabel(value: Date) {
  return `${value.getFullYear()}年${value.getMonth() + 1}月${value.getDate()}日`;
}

function toDate(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("toDate" in value && typeof value.toDate === "function") {
    return value.toDate() as Date;
  }

  return null;
}

async function getOwnedProfileSnapshot(profileId: string, ownerUid: string) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }

  const db = firestore;
  const profileRef = doc(db, "profiles", profileId);
  const profileSnapshot = await getDoc(profileRef);

  if (!profileSnapshot.exists()) {
    throw new Error("プロフィールが見つかりませんでした。");
  }

  const profileData = profileSnapshot.data() as { ownerUid?: string };

  if (profileData.ownerUid !== ownerUid) {
    throw new Error("このプロフィールを操作する権限がありません。");
  }

  return profileSnapshot;
}

export async function listProfilesByOwner(ownerUid: string) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }

  const db = firestore;
  const snapshot = await getDocs(query(collection(db, "profiles"), where("ownerUid", "==", ownerUid)));

  return snapshot.docs
    .map((profileDoc) => {
    const data = profileDoc.data() as {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      fullNameKana?: string;
      birthday?: string | null;
      photoUrl?: string | null;
      noteCount?: number;
    };

    return {
      id: profileDoc.id,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      fullName: data.fullName ?? `${data.lastName ?? ""} ${data.firstName ?? ""}`.trim(),
      fullNameKana: data.fullNameKana ?? "",
      birthday: formatBirthdayForDisplay(data.birthday ?? null),
      photoUrl: data.photoUrl ?? null,
      noteCount: data.noteCount ?? 0,
    } satisfies ProfileListItem;
    })
    .sort((left, right) => {
      const kanaCompare = left.fullNameKana.localeCompare(right.fullNameKana, "ja");

      if (kanaCompare !== 0) {
        return kanaCompare;
      }

      return left.fullName.localeCompare(right.fullName, "ja");
    });
}

export async function getProfileDetailById(profileId: string, ownerUid: string) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }

  const db = firestore;
  const profileSnapshot = await getOwnedProfileSnapshot(profileId, ownerUid);
  const profileData = profileSnapshot.data() as {
    fullName?: string;
    fullNameKana?: string;
    birthday?: string | null;
    photoUrl?: string | null;
    noteCount?: number;
    latestNoteAt?: unknown;
  };

  const [contactSnapshot, noteSnapshot] = await Promise.all([
    getDoc(doc(db, "profiles", profileId, "private", "contact")),
    getDocs(collection(db, "profiles", profileId, "notes")),
  ]);

  const contactData = (contactSnapshot.data() as Partial<ProfileContact> | undefined) ?? {};
  const notes = noteSnapshot.docs
    .map((noteDoc) => {
      const noteData = noteDoc.data() as { body?: string; happenedAt?: unknown; createdAt?: unknown };
      const happenedAtDate = toDate(noteData.happenedAt) ?? toDate(noteData.createdAt) ?? new Date(0);

      return {
        id: noteDoc.id,
        body: noteData.body ?? "",
        happenedAtLabel: formatDateLabel(happenedAtDate),
        createdAtMillis: happenedAtDate.getTime(),
      } satisfies ProfileNoteItem;
    })
    .sort((left, right) => right.createdAtMillis - left.createdAtMillis);

  const latestNoteDate = toDate(profileData.latestNoteAt) ?? (notes[0] ? new Date(notes[0].createdAtMillis) : null);

  return {
    id: profileSnapshot.id,
    fullName: profileData.fullName ?? "",
    fullNameKana: profileData.fullNameKana ?? "",
    birthday: profileData.birthday ?? "",
    birthdayLabel: formatBirthdayForDisplay(profileData.birthday ?? null),
    photoUrl: profileData.photoUrl ?? null,
    noteCount: profileData.noteCount ?? notes.length,
    latestNoteLabel: latestNoteDate ? formatDateLabel(latestNoteDate) : "",
    contacts: {
      phoneCountryCode: contactData.phoneCountryCode ?? "+81",
      phone: contactData.phone ?? "",
      email: contactData.email ?? "",
      x: contactData.x ?? "",
      facebook: contactData.facebook ?? "",
      instagram: contactData.instagram ?? "",
      linkedin: contactData.linkedin ?? "",
    },
    notes,
    } satisfies ProfileDetail;
}

export async function addProfileNote(profileId: string, body: string, userUid: string) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }
  const db = firestore;

  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new Error("キズナノートを入力してください。");
  }

  await addDoc(collection(db, "profiles", profileId, "notes"), {
    body: trimmedBody,
    happenedAt: serverTimestamp(),
    createdByUid: userUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "profiles", profileId), {
    noteCount: increment(1),
    latestNoteAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listProfileNotes(profileId: string, ownerUid: string) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }
  const db = firestore;

  await getOwnedProfileSnapshot(profileId, ownerUid);
  const snapshot = await getDocs(collection(db, "profiles", profileId, "notes"));

  return snapshot.docs
    .map((noteDoc) => {
      const noteData = noteDoc.data() as { body?: string; happenedAt?: unknown; createdAt?: unknown };
      const noteDate = toDate(noteData.happenedAt) ?? toDate(noteData.createdAt) ?? new Date(0);

      return {
        id: noteDoc.id,
        body: noteData.body ?? "",
        happenedAtLabel: formatDateLabel(noteDate),
        createdAtMillis: noteDate.getTime(),
      } satisfies ProfileNoteItem;
    })
    .sort((left, right) => right.createdAtMillis - left.createdAtMillis);
}

export async function getProfileNoteById(profileId: string, noteId: string, ownerUid: string) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }
  const db = firestore;

  await getOwnedProfileSnapshot(profileId, ownerUid);
  const noteSnapshot = await getDoc(doc(db, "profiles", profileId, "notes", noteId));

  if (!noteSnapshot.exists()) {
    throw new Error("キズナノートが見つかりませんでした。");
  }

  const noteData = noteSnapshot.data() as { body?: string; happenedAt?: unknown; createdAt?: unknown };
  const noteDate = toDate(noteData.happenedAt) ?? toDate(noteData.createdAt) ?? new Date(0);

  return {
    id: noteSnapshot.id,
    body: noteData.body ?? "",
    happenedAtLabel: formatDateLabel(noteDate),
    createdAtMillis: noteDate.getTime(),
  } satisfies ProfileNoteItem;
}

export async function updateProfileNote(profileId: string, noteId: string, body: string, ownerUid: string) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }
  const db = firestore;

  await getOwnedProfileSnapshot(profileId, ownerUid);
  await updateDoc(doc(db, "profiles", profileId, "notes", noteId), {
    body: body.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function getProfileContact(profileId: string, ownerUid: string) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }
  const db = firestore;

  await getOwnedProfileSnapshot(profileId, ownerUid);
  const snapshot = await getDoc(doc(db, "profiles", profileId, "private", "contact"));
  const contactData = (snapshot.data() as Partial<ProfileContact> | undefined) ?? {};

  return {
    phone: contactData.phone ?? "",
    phoneCountryCode: contactData.phoneCountryCode ?? "+81",
    email: contactData.email ?? "",
    x: contactData.x ?? "",
    facebook: contactData.facebook ?? "",
    instagram: contactData.instagram ?? "",
    linkedin: contactData.linkedin ?? "",
  } satisfies ProfileContact;
}

export async function updateProfileContact(profileId: string, ownerUid: string, input: UpdateProfileContactInput) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }
  const db = firestore;

  await getOwnedProfileSnapshot(profileId, ownerUid);
  await setDoc(
    doc(db, "profiles", profileId, "private", "contact"),
    {
      phone: input.phone.trim(),
      phoneCountryCode: input.phoneCountryCode.trim() || "+81",
      email: input.email.trim(),
      x: input.x.trim(),
      facebook: input.facebook.trim(),
      instagram: input.instagram.trim(),
      linkedin: input.linkedin.trim(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function updateProfileBasics(profileId: string, ownerUid: string, input: UpdateProfileBasicsInput) {
  if (!firestore) {
    throw new Error(getFirebaseConfigError());
  }
  const db = firestore;

  await getOwnedProfileSnapshot(profileId, ownerUid);
  const normalizedBirthday = formatBirthdayForFirestore(input.birthday) || null;
  const trimmedLastName = input.lastName.trim();
  const trimmedFirstName = input.firstName.trim();
  const trimmedLastNameKana = input.lastNameKana.trim();
  const trimmedFirstNameKana = input.firstNameKana.trim();

  const payload: Record<string, unknown> = {
    lastName: trimmedLastName,
    firstName: trimmedFirstName,
    lastNameKana: trimmedLastNameKana,
    firstNameKana: trimmedFirstNameKana,
    fullName: `${trimmedLastName} ${trimmedFirstName}`.trim(),
    fullNameKana: `${trimmedLastNameKana} ${trimmedFirstNameKana}`.trim(),
    birthday: normalizedBirthday,
    updatedAt: serverTimestamp(),
  };

  if (input.photoFile && storage) {
    const photoStoragePath = `users/${ownerUid}/profiles/${profileId}/avatar`;
    const storageRef = ref(storage, photoStoragePath);
    await uploadBytes(storageRef, input.photoFile);
    payload.photoUrl = await getDownloadURL(storageRef);
    payload.photoStoragePath = photoStoragePath;
  }

  await updateDoc(doc(db, "profiles", profileId), payload);
}
