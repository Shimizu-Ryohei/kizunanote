import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

initializeApp();

const db = getFirestore();
const OPENAI_SUMMARY_MODEL = process.env.OPENAI_SUMMARY_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const MAX_UPDATED_NOTES = 50;
const MAX_NOTE_BODY_LENGTH = 1200;
const ADMIN_EMAILS = new Set(["space.odyssey.g@gmail.com"]);

function truncateNoteBody(body) {
  return body.length > MAX_NOTE_BODY_LENGTH ? `${body.slice(0, MAX_NOTE_BODY_LENGTH)}...` : body;
}

function extractResponseText(responseBody) {
  if (typeof responseBody.output_text === "string" && responseBody.output_text) {
    return responseBody.output_text;
  }

  if (!Array.isArray(responseBody.output)) {
    throw new Error("OpenAI response did not include output.");
  }

  const texts = [];

  for (const item of responseBody.output) {
    if (!Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (typeof content.text === "string" && content.text) {
        texts.push(content.text);
      }
    }
  }

  if (!texts.length) {
    throw new Error("OpenAI response did not include text content.");
  }

  return texts.join("\n");
}

function normalizeSummaryBullet(value) {
  return value.replace(/\s+/g, " ").replace(/　/g, " ").trim();
}

function cleanWorkplaceLabel(value) {
  const normalized = value
    .replace(/^.*(?:現在|現職|いま|今)/u, "")
    .replace(/^(?:現在|現職|いま|今)[、,\s]*/u, "")
    .replace(/^(現在の)?(?:勤務先|所属先|所属|会社|現職)[は:：\s]*/u, "")
    .replace(/^(?:勤務先|所属先|所属|会社)[は:：]\s*/u, "")
    .replace(/^.*[、,，]\s*/u, "")
    .replace(/(?:を経て|をへて).*/u, "")
    .replace(/^(?:で|に|の)\s*/u, "")
    .replace(/[。．、,，\s]+$/u, "")
    .trim();

  const corporateMatch = normalized.match(
    /((?:株式会社|有限会社|合同会社)[^\s。．、,，]*)|([A-Z][A-Za-z0-9&'.\-/ ]{1,}(?:Holdings|Group|Partners|Corporation|Company|Inc\.?|LLC|Ltd\.?|Studio|Works|Design|Creative|Lab))/u
  );

  if (corporateMatch) {
    return (corporateMatch[1] ?? corporateMatch[2] ?? "").trim();
  }

  const organizationMatch = normalized.match(
    /([^。．、,，\s]+(?:スタジオ|studio|Studio|STUDIO|工房|事務所|研究所|ラボ|病院|学校))/u
  );

  if (organizationMatch) {
    return organizationMatch[1].trim();
  }

  return normalized
    .replace(/[はがを].*$/u, "")
    .replace(/の(?:管理部|営業部|開発部|人事部|広報部|マーケティング部|主任|部長|課長|マネージャー|代表|社長|取締役).*/u, "")
    .replace(/[。．、,，\s]+$/u, "")
    .trim();
}

function extractCurrentWorkplace(bullets) {
  const normalizedBullets = bullets.map(normalizeSummaryBullet).filter(Boolean);
  const contextualPatterns = [
    /(.+?)に勤務(?:している)?/u,
    /(.+?)で勤務(?:している)?/u,
    /(.+?)で(?:[^。．、,，]{0,24}?として)?働(?:いている|く)/u,
    /(.+?)の[^。．、,，]{0,24}?として働(?:いている|く)/u,
    /(.+?)に勤め(?:ている)?/u,
    /(.+?)に所属(?:している)?/u,
    /(.+?)を経営(?:している)?/u,
    /(.+?)を運営(?:している)?/u,
    /(.+?)を主宰(?:している)?/u
  ];
  const directPatterns = [
    /((?:株式会社|有限会社|合同会社)[^。．、,，]*)/u,
    /([^。．、,，]*(?:スタジオ|studio|Studio|STUDIO|工房|事務所|研究所|ラボ|会社)[^。．、,，]*)/u,
    /([A-Z][A-Za-z0-9&'.\-/ ]{2,}(?:Holdings|Group|Partners|Corporation|Company|Inc\.?|LLC|Ltd\.?|Studio|Works|Design|Creative|Lab))/u
  ];

  for (const bullet of normalizedBullets) {
    for (const pattern of contextualPatterns) {
      const match = bullet.match(pattern);
      const candidate = cleanWorkplaceLabel(match?.[1] ?? "");

      if (candidate) {
        return candidate;
      }
    }
  }

  for (const bullet of normalizedBullets) {
    for (const pattern of directPatterns) {
      const match = bullet.match(pattern);
      const candidate = cleanWorkplaceLabel(match?.[1] ?? "");

      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

async function summarizeProfile({ profileId, fullName, existingBullets, updatedNotes }) {
  const payload = {
    model: OPENAI_SUMMARY_MODEL,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You create concise Japanese relationship-memory summaries for a person profile. " +
              "Return up to 5 bullet points, each a single sentence, prioritizing stable useful facts, preferences, relationships, and recent important context. " +
              "Merge overlap, remove redundancy, and avoid speculation."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(
              {
                profileId,
                fullName,
                existingSummaryBullets: existingBullets,
                updatedNotes
              },
              null,
              2
            )
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "profile_summary",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            bullets: {
              type: "array",
              maxItems: 5,
              items: {
                type: "string"
              }
            }
          },
          required: ["bullets"]
        }
      }
    }
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const responseBody = await response.json();
  const parsed = JSON.parse(extractResponseText(responseBody));

  if (!Array.isArray(parsed.bullets)) {
    throw new Error("OpenAI summary payload is invalid.");
  }

  return parsed.bullets
    .filter((bullet) => typeof bullet === "string")
    .map((bullet) => bullet.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export const summarizeProfilesDaily = onSchedule(
  {
    schedule: "0 5 * * *",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    memory: "512MiB",
    timeoutSeconds: 540,
    secrets: [OPENAI_API_KEY]
  },
  async () => {
    const pendingProfilesSnapshot = await db
      .collection("profiles")
      .where("summaryStatus", "in", ["pending", "error"])
      .get();

    if (pendingProfilesSnapshot.empty) {
      logger.info("No profiles are pending summarization.");
      return;
    }

    for (const profileDoc of pendingProfilesSnapshot.docs) {
      const profileId = profileDoc.id;
      const profileData = profileDoc.data();
      const summaryRef = db.doc(`profiles/${profileId}/private/summary`);

      try {
        await profileDoc.ref.update({
          summaryStatus: "processing",
          updatedAt: FieldValue.serverTimestamp()
        });

        const summarySnapshot = await summaryRef.get();
        const summaryData = summarySnapshot.exists ? summarySnapshot.data() : {};
        const lastSummarizedAt = summaryData?.lastSummarizedAt || null;

        let notesQuery = db.collection(`profiles/${profileId}/notes`).orderBy("updatedAt", "desc");

        if (lastSummarizedAt) {
          notesQuery = notesQuery.where("updatedAt", ">", lastSummarizedAt);
        }

        const updatedNotesSnapshot = await notesQuery.limit(MAX_UPDATED_NOTES).get();
        const updatedNotes = updatedNotesSnapshot.docs
          .map((noteDoc) => {
            const noteData = noteDoc.data();

            return {
              id: noteDoc.id,
              body: truncateNoteBody(String(noteData.body || "")),
              updatedAt: noteData.updatedAt || noteData.createdAt || null
            };
          })
          .filter((note) => note.body);

        if (!updatedNotes.length && Array.isArray(summaryData?.bullets)) {
          await profileDoc.ref.update({
            summaryStatus: "ready",
            lastSummarizedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          });
          continue;
        }

        const bullets = await summarizeProfile({
          profileId,
          fullName: String(profileData.fullName || ""),
          existingBullets: Array.isArray(summaryData?.bullets) ? summaryData.bullets : [],
          updatedNotes
        });
        const workplaceTag = extractCurrentWorkplace(bullets);

        const now = FieldValue.serverTimestamp();

        await summaryRef.set(
          {
            ownerUid: String(profileData.ownerUid || ""),
            bullets,
            sourceNoteCount: Number(profileData.noteCount || 0),
            lastNoteUpdatedAt: profileData.lastNoteUpdatedAt || null,
            lastSummarizedAt: now,
            model: OPENAI_SUMMARY_MODEL,
            version: 1,
            updatedAt: now
          },
          { merge: true }
        );

        await profileDoc.ref.update({
          summaryStatus: "ready",
          workplaceTag: workplaceTag || null,
          lastSummarizedAt: now,
          updatedAt: now
        });

        logger.info("Profile summary updated.", { profileId });
      } catch (error) {
        logger.error("Profile summary update failed.", {
          profileId,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : null
        });

        await profileDoc.ref.update({
          summaryStatus: "error",
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }
  }
);

function getTokyoMonthRange() {
  const now = new Date();
  const tokyoNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const start = new Date(tokyoNow.getFullYear(), tokyoNow.getMonth(), 1);
  const end = new Date(tokyoNow.getFullYear(), tokyoNow.getMonth() + 1, 1);
  return { start, end };
}

export const getAdminDashboardStats = onCall(
  {
    region: "asia-northeast1"
  },
  async (request) => {
    const uid = request.auth?.uid;
    const email = request.auth?.token?.email;

    if (!uid) {
      throw new HttpsError("unauthenticated", "ログインが必要です。");
    }

    const userSnapshot = await db.doc(`users/${uid}`).get();
    const userData = userSnapshot.exists ? userSnapshot.data() : {};
    const isAdmin = userData?.role === "admin" || (email && ADMIN_EMAILS.has(email.toLowerCase()));

    if (!isAdmin) {
      throw new HttpsError("permission-denied", "管理者のみアクセスできます。");
    }

    const { start, end } = getTokyoMonthRange();
    const usersSnapshot = await db.collection("users").get();

    let totalUsers = 0;
    let currentMonthNewUsers = 0;
    const planCounts = {
      standard: 0,
      plus: 0,
      pro: 0
    };

    for (const userDoc of usersSnapshot.docs) {
      totalUsers += 1;
      const data = userDoc.data();
      const rawPlanId =
        typeof data.planId === "string" ? data.planId.trim().toLowerCase() : "standard";
      const normalizedPlanId =
        rawPlanId === "standard" || rawPlanId === "plus" || rawPlanId === "pro"
          ? rawPlanId
          : "standard";
      planCounts[normalizedPlanId] += 1;

      const createdAt = data.createdAt?.toDate?.();
      if (createdAt && createdAt >= start && createdAt < end) {
        currentMonthNewUsers += 1;
      }
    }

    const cancellationEventsSnapshot = await db.collectionGroup("billingEvents").get();
    let currentMonthCanceledUsers = 0;

    for (const eventDoc of cancellationEventsSnapshot.docs) {
      const data = eventDoc.data();

      if (data.type !== "account_deleted") {
        continue;
      }

      const createdAt = data.createdAt?.toDate?.();
      if (createdAt && createdAt >= start && createdAt < end) {
        currentMonthCanceledUsers += 1;
      }
    }

    return {
      totalUsers,
      planCounts,
      currentMonthNewUsers,
      currentMonthCanceledUsers
    };
  }
);

export const submitContactInquiry = onCall(
  {
    region: "asia-northeast1"
  },
  async (request) => {
    const uid = request.auth?.uid || null;
    const authEmail = request.auth?.token?.email;
    const email =
      typeof request.data?.email === "string" && request.data.email.trim()
        ? request.data.email.trim()
        : authEmail || "";
    const subject =
      typeof request.data?.subject === "string" ? request.data.subject.trim() : "";
    const message =
      typeof request.data?.message === "string" ? request.data.message.trim() : "";

    if (!email || !subject || !message) {
      throw new HttpsError(
        "invalid-argument",
        "メールアドレス、件名、お問い合わせ内容を入力してください。"
      );
    }

    await db.collection("contactInquiries").add({
      userUid: uid,
      email,
      subject,
      message,
      createdAt: FieldValue.serverTimestamp()
    });

    return { ok: true };
  }
);

export const getAdminContactInquiries = onCall(
  {
    region: "asia-northeast1"
  },
  async (request) => {
    const uid = request.auth?.uid;
    const email = request.auth?.token?.email;

    if (!uid) {
      throw new HttpsError("unauthenticated", "ログインが必要です。");
    }

    const userSnapshot = await db.doc(`users/${uid}`).get();
    const userData = userSnapshot.exists ? userSnapshot.data() : {};
    const isAdmin = userData?.role === "admin" || (email && ADMIN_EMAILS.has(email.toLowerCase()));

    if (!isAdmin) {
      throw new HttpsError("permission-denied", "管理者のみアクセスできます。");
    }

    const inquiriesSnapshot = await db
      .collection("contactInquiries")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    return inquiriesSnapshot.docs.map((inquiryDoc) => {
      const data = inquiryDoc.data();
      const createdAt = data.createdAt?.toDate?.();

      return {
        id: inquiryDoc.id,
        userUid: String(data.userUid || ""),
        email: String(data.email || ""),
        subject: String(data.subject || ""),
        message: String(data.message || ""),
        createdAtLabel: createdAt
          ? createdAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
          : ""
      };
    });
  }
);
