import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseAuth, firestore, getFirebaseConfigError, storage } from "./client";

type CreateProfileInput = {
  birthday: string;
  firstName: string;
  firstNameKana: string;
  lastName: string;
  lastNameKana: string;
  noteBody: string;
  photoFile: File | null;
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

  const profileRef = await addDoc(collection(firestore, "profiles"), {
    ownerUid: user.uid,
    lastName,
    firstName,
    lastNameKana,
    firstNameKana,
    birthday: formatBirthdayForFirestore(birthday) || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (noteBody.trim()) {
    await addDoc(collection(firestore, "profiles", profileRef.id, "notes"), {
      body: noteBody.trim(),
      happenedAt: serverTimestamp(),
      createdByUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  if (photoFile && storage) {
    try {
      const storageRef = ref(storage, `users/${user.uid}/profiles/${profileRef.id}/avatar`);
      await uploadBytes(storageRef, photoFile);
      const photoUrl = await getDownloadURL(storageRef);

      await updateDoc(profileRef, {
        photoUrl,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to upload profile photo", error);
    }
  }

  return profileRef.id;
}
