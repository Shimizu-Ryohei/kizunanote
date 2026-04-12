import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore, getFirebaseConfigError } from "./client";

function ensureFirebaseAuth() {
  if (!firebaseAuth || !firestore) {
    throw new Error(getFirebaseConfigError());
  }

  return { firebaseAuth, firestore };
}

export async function signUpWithEmail(email: string, password: string) {
  const { firebaseAuth, firestore } = ensureFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  const user = credential.user;

  await setDoc(
    doc(firestore, "users", user.uid),
    {
      email: user.email,
      displayName: "",
      notificationEnabled: true,
      subscriptionStatus: "free",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return credential;
}

export async function signInWithEmail(email: string, password: string) {
  const { firebaseAuth } = ensureFirebaseAuth();
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signOut() {
  const { firebaseAuth } = ensureFirebaseAuth();
  return firebaseSignOut(firebaseAuth);
}
