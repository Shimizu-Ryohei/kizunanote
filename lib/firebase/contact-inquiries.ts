import { httpsCallable } from "firebase/functions";
import { firebaseFunctions, getFirebaseConfigError } from "./client";

export type ContactInquiryInput = {
  email: string;
  subject: string;
  message: string;
};

export async function submitContactInquiry(input: ContactInquiryInput) {
  if (!firebaseFunctions) {
    throw new Error(getFirebaseConfigError());
  }

  const callable = httpsCallable<ContactInquiryInput, { ok: true }>(
    firebaseFunctions,
    "submitContactInquiry",
  );
  const result = await callable(input);
  return result.data;
}
