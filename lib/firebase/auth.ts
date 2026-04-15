import {
  applyActionCode,
  checkActionCode,
  deleteUser,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  type User,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { deleteObject, listAll, ref } from "firebase/storage";
import { firebaseAuth, firestore, getFirebaseConfigError, storage } from "./client";

function ensureFirebaseAuth() {
  if (!firebaseAuth || !firestore) {
    throw new Error(getFirebaseConfigError());
  }

  return { firebaseAuth, firestore };
}

export const PENDING_SIGN_UP_EMAIL_KEY = "kizunanote_pending_sign_up_email";

export async function syncUserDocument(user: User) {
  const { firestore } = ensureFirebaseAuth();

  await setDoc(
    doc(firestore, "users", user.uid),
    {
      email: user.email ?? "",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
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
      notificationPreferences: {
        pushEnabled: true,
        emailEnabled: false,
        updatedAt: serverTimestamp(),
      },
      subscriptionStatus: "free",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return credential;
}

export async function sendSignUpLink(email: string, redirectOrigin: string) {
  const { firebaseAuth } = ensureFirebaseAuth();

  await sendSignInLinkToEmail(firebaseAuth, email, {
    url: `${redirectOrigin}/sign-up/complete`,
    handleCodeInApp: true,
  });
}

export function isEmailLinkSignIn(link: string) {
  if (!firebaseAuth) {
    return false;
  }

  return isSignInWithEmailLink(firebaseAuth, link);
}

export async function completeSignUpWithEmailLink(
  email: string,
  password: string,
  emailLink: string,
) {
  const { firebaseAuth, firestore } = ensureFirebaseAuth();
  const credential = await signInWithEmailLink(firebaseAuth, email, emailLink);
  const user = credential.user;

  await updatePassword(user, password);

  await setDoc(
    doc(firestore, "users", user.uid),
    {
      email: user.email,
      displayName: "",
      notificationEnabled: true,
      notificationPreferences: {
        pushEnabled: true,
        emailEnabled: false,
        updatedAt: serverTimestamp(),
      },
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

export async function reauthenticateCurrentUser(password: string) {
  const { firebaseAuth } = ensureFirebaseAuth();
  const user = firebaseAuth.currentUser;

  if (!user || !user.email) {
    throw new Error("現在のユーザー情報を取得できませんでした。");
  }

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

export async function sendLoginIdChangeLink(nextEmail: string, redirectOrigin: string) {
  const { firebaseAuth } = ensureFirebaseAuth();
  const user = firebaseAuth.currentUser;

  if (!user) {
    throw new Error("ログイン中のユーザーが見つかりません。");
  }

  await verifyBeforeUpdateEmail(user, nextEmail, {
    url: `${redirectOrigin}/settings/change-login-id/complete`,
    handleCodeInApp: true,
  });
}

export async function completeLoginIdChange(actionCode: string) {
  const { firebaseAuth } = ensureFirebaseAuth();
  const actionInfo = await checkActionCode(firebaseAuth, actionCode);
  await applyActionCode(firebaseAuth, actionCode);

  if (firebaseAuth.currentUser) {
    await firebaseAuth.currentUser.reload();
    await syncUserDocument(firebaseAuth.currentUser);
  }

  return actionInfo.data.email ?? "";
}

export async function changeCurrentUserPassword(currentPassword: string, nextPassword: string) {
  const { firebaseAuth } = ensureFirebaseAuth();
  const user = firebaseAuth.currentUser;

  if (!user) {
    throw new Error("ログイン中のユーザーが見つかりません。");
  }

  await reauthenticateCurrentUser(currentPassword);
  await updatePassword(user, nextPassword);
}

export async function sendPasswordResetLinkToCurrentUser(redirectOrigin: string) {
  const { firebaseAuth } = ensureFirebaseAuth();
  const user = firebaseAuth.currentUser;

  if (!user || !user.email) {
    throw new Error("現在のユーザー情報を取得できませんでした。");
  }

  await sendPasswordResetEmail(firebaseAuth, user.email, {
    url: `${redirectOrigin}/settings/change-password/reset/complete`,
  });

  return user.email;
}

export async function signOut() {
  const { firebaseAuth } = ensureFirebaseAuth();
  return firebaseSignOut(firebaseAuth);
}

async function deleteStorageFolder(path: string) {
  if (!storage) {
    return;
  }

  const folderRef = ref(storage, path);
  const listed = await listAll(folderRef);

  await Promise.all(listed.items.map((item) => deleteObject(item)));
  await Promise.all(listed.prefixes.map((prefix) => deleteStorageFolder(prefix.fullPath)));
}

export async function deleteCurrentUserAccount(password: string) {
  const { firebaseAuth, firestore } = ensureFirebaseAuth();
  const user = firebaseAuth.currentUser;

  if (!user || !user.email) {
    throw new Error("現在のユーザー情報を取得できませんでした。");
  }

  await reauthenticateCurrentUser(password);

  const profilesSnapshot = await getDocs(
    query(collection(firestore, "profiles"), where("ownerUid", "==", user.uid)),
  );

  for (const profileDoc of profilesSnapshot.docs) {
    const notesSnapshot = await getDocs(
      collection(firestore, "profiles", profileDoc.id, "notes"),
    );

    await Promise.all(notesSnapshot.docs.map((noteDoc) => deleteDoc(noteDoc.ref)));
    await deleteDoc(doc(firestore, "profiles", profileDoc.id, "private", "contact"));
    await deleteDoc(doc(firestore, "profiles", profileDoc.id, "private", "summary"));
    await deleteDoc(profileDoc.ref);
  }

  const billingSnapshot = await getDocs(
    collection(firestore, "users", user.uid, "billingEvents"),
  );
  await Promise.all(billingSnapshot.docs.map((billingDoc) => deleteDoc(billingDoc.ref)));

  await deleteDoc(doc(firestore, "users", user.uid));

  if (storage) {
    try {
      await deleteStorageFolder(`users/${user.uid}`);
    } catch (error) {
      console.error("Failed to delete user storage files", error);
    }
  }

  await deleteUser(user);
}
