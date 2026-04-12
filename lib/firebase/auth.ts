import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "./client";

export async function signUpWithEmail(email: string, password: string) {
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
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signOut() {
  return firebaseSignOut(firebaseAuth);
}
