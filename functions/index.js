import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";

initializeApp();

const db = getFirestore();
const OPENAI_SUMMARY_MODEL = process.env.OPENAI_SUMMARY_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const MAX_UPDATED_NOTES = 50;
const MAX_NOTE_BODY_LENGTH = 1200;

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
