import { createHash } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
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
const COMPANY_CRAWL_MAX_PAGES = 8;
const COMPANY_CRAWL_PAGE_TIMEOUT_MS = 15000;
const COMPANY_CRAWL_SCHEDULE = "0 0,16 * * *";
const BIRTHDAY_PUSH_SCHEDULE = "0 8 * * *";

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

function getJstNowParts() {
  return getJstDateParts(new Date());
}

function getJstDateParts(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value || "",
    month: parts.find((part) => part.type === "month")?.value || "",
    day: parts.find((part) => part.type === "day")?.value || ""
  };
}

function getMonthDayKeyFromBirthday(value) {
  if (typeof value !== "string") {
    return "";
  }

  const [, month, day] = value.split("-");

  if (!month || !day) {
    return "";
  }

  return `${month}-${day}`;
}

function getJstMonthDayKey(date) {
  const { month, day } = getJstDateParts(date);
  return `${month}-${day}`;
}

function getNotificationTokenDocId(token) {
  return encodeURIComponent(token);
}

async function sendBirthdayPushNotificationsForUser(ownerUid, notifications) {
  const userSnapshot = await db.doc(`users/${ownerUid}`).get();
  const userData = userSnapshot.exists ? userSnapshot.data() : null;

  if (userData?.planId !== "plus" && userData?.planId !== "pro") {
    logger.info("Skipping birthday push notifications because plan is not eligible.", {
      ownerUid,
      planId: userData?.planId ?? null,
    });
    return;
  }

  if (!userData?.notificationPreferences?.pushEnabled) {
    logger.info("Skipping birthday push notifications because push is disabled.", {
      ownerUid,
      pushEnabled: userData?.notificationPreferences?.pushEnabled ?? null,
    });
    return;
  }

  const tokensSnapshot = await db.collection(`users/${ownerUid}/notificationTokens`).get();

  if (tokensSnapshot.empty) {
    logger.info("Skipping birthday push notifications because no tokens were found.", {
      ownerUid,
    });
    return;
  }

  const tokens = tokensSnapshot.docs
    .map((docSnapshot) => {
      const data = docSnapshot.data();
      return typeof data.token === "string" ? data.token : "";
    })
    .filter(Boolean);

  if (!tokens.length) {
    logger.info("Skipping birthday push notifications because token payloads were empty.", {
      ownerUid,
      tokenDocCount: tokensSnapshot.size,
    });
    return;
  }

  logger.info("Sending birthday push notifications.", {
    ownerUid,
    notificationCount: notifications.length,
    tokenCount: tokens.length,
    planId: userData?.planId ?? null,
  });

  for (const notification of notifications) {
    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "キズナノート",
        body: notification.body,
      },
      data: {
        title: "キズナノート",
        body: notification.body,
        path: `/profiles/${notification.profileId}`,
        profileId: notification.profileId,
      },
      webpush: {
        fcmOptions: {
          link: `/profiles/${notification.profileId}`,
        },
      },
    });

    const invalidTokens = [];

    response.responses.forEach((sendResponse, index) => {
      if (sendResponse.success) {
        return;
      }

      const code = sendResponse.error?.code || "";

      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        invalidTokens.push(tokens[index]);
      }

      logger.error("Birthday push notification failed.", {
        ownerUid,
        profileId: notification.profileId,
        token: tokens[index],
        code,
        message: sendResponse.error?.message || "",
      });
    });

    logger.info("Birthday push notification send result.", {
      ownerUid,
      profileId: notification.profileId,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    await Promise.all(
      invalidTokens.map((token) =>
        db.doc(`users/${ownerUid}/notificationTokens/${getNotificationTokenDocId(token)}`).delete(),
      ),
    );
  }
}

function buildTodayDatePatterns() {
  const { year, month, day } = getJstNowParts();
  const monthNumber = String(Number(month));
  const dayNumber = String(Number(day));

  return [
    `${year}/${month}/${day}`,
    `${year}-${month}-${day}`,
    `${year}.${month}.${day}`,
    `${year}年${monthNumber}月${dayNumber}日`,
    `${year}年${month}月${day}日`
  ].filter(Boolean);
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeReleaseBody(text) {
  return text
    .replace(/^プロフィール本人は/u, "")
    .replace(/^この人は/u, "")
    .trim();
}

function normalizeSummaryFirstPerson(text) {
  return text
    .replace(/記録者の/g, "私の")
    .replace(/記録者は/g, "私は")
    .replace(/記録者が/g, "私が")
    .replace(/記録者を/g, "私を")
    .replace(/記録者に/g, "私に")
    .replace(/記録者へ/g, "私へ")
    .replace(/記録者と/g, "私と")
    .replace(/記録者も/g, "私も")
    .replace(/記録者本人/g, "私")
    .replace(/記録者/g, "私");
}

function normalizeProfilePersonLabel(text) {
  return text
    .replace(/プロフィール本人には/g, "本人には")
    .replace(/プロフィール本人は/g, "本人は")
    .replace(/プロフィール本人の/g, "本人の")
    .replace(/プロフィール本人に/g, "本人に")
    .replace(/プロフィール本人を/g, "本人を")
    .replace(/プロフィール本人が/g, "本人が")
    .replace(/プロフィール本人と/g, "本人と")
    .replace(/プロフィール本人も/g, "本人も")
    .replace(/プロフィール本人へ/g, "本人へ")
    .replace(/プロフィール本人で/g, "本人で")
    .replace(/プロフィール本人/u, "本人");
}

function normalizeProfileSubject(text) {
  return text
    .replace(/^本人は/u, "")
    .replace(/^本人が/u, "")
    .replace(/^本人に/u, "")
    .replace(/^本人を/u, "")
    .replace(/^本人へ/u, "")
    .replace(/^本人と/u, "")
    .replace(/^本人も/u, "")
    .replace(/^本人には/u, "")
    .replace(/^本人では/u, "")
    .trim();
}

function normalizeDanglingLeadingParticle(text) {
  return text
    .replace(/^[、,\s]+/u, "")
    .replace(/^(は|が|を|に|へ|と|も)(?=[一-龯々ァ-ヶ私僕俺])/u, "")
    .trim();
}

function extractTitleFromHtml(html, fallbackUrl) {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]) {
    return stripHtml(h1Match[1]).slice(0, 140);
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    return stripHtml(titleMatch[1]).slice(0, 140);
  }

  try {
    const url = new URL(fallbackUrl);
    return url.hostname;
  } catch {
    return fallbackUrl;
  }
}

function getLikelyContentHtml(html) {
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch?.[1]) {
    return articleMatch[1];
  }

  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch?.[1]) {
    return mainMatch[1];
  }

  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1] ?? html;
}

function splitMeaningfulLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 2);
}

function extractTodayReleaseSection(text) {
  const todayPatterns = buildTodayDatePatterns();
  const lines = splitMeaningfulLines(text);
  const releases = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const hasToday = todayPatterns.some((pattern) => line.includes(pattern));

    if (!hasToday) {
      continue;
    }

    const previousWindow = lines.slice(Math.max(0, index - 3), index + 1).join(" ");
    const nextWindow = lines.slice(index, index + 8).join(" ");
    const inReleaseSection =
      /(news|press release|topics|information)/i.test(previousWindow + " " + nextWindow) ||
      /(ニュース|お知らせ|プレスリリース|新着|トピックス|最新情報|ニュースリリース)/.test(
        previousWindow + nextWindow
      );

    if (!inReleaseSection) {
      continue;
    }

    const buffer = [line];

    for (let offset = 1; offset <= 5; offset += 1) {
      const nextLine = lines[index + offset];

      if (!nextLine) {
        break;
      }

      const isAnotherDate = todayPatterns.some((pattern) => nextLine.includes(pattern));
      const isSectionHeading =
        /^(news|topics|information|press release)$/i.test(nextLine) ||
        /^(ニュース|お知らせ|プレスリリース|新着|トピックス|最新情報|ニュースリリース)$/.test(nextLine);

      if (offset > 1 && (isAnotherDate || isSectionHeading)) {
        break;
      }

      buffer.push(nextLine);
    }

    const uniqueBuffer = Array.from(new Set(buffer));
    const candidate = uniqueBuffer.join("\n").trim();
    const titleLine =
      uniqueBuffer.find(
        (entry) =>
          !todayPatterns.some((pattern) => entry.includes(pattern)) &&
          !/^(news|topics|information|press release)$/i.test(entry) &&
          !/^(ニュース|お知らせ|プレスリリース|新着|トピックス|最新情報|ニュースリリース)$/.test(entry)
      ) || null;

    if (candidate.length >= 20) {
      releases.push({
        body: candidate,
        title: titleLine
      });
    }
  }

  return releases;
}

function extractSameOriginLinks(baseUrl, html) {
  let base;

  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }

  const links = [];
  const regex = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(html))) {
    try {
      const url = new URL(match[1], base);
      if (url.origin !== base.origin) {
        continue;
      }

      const text = stripHtml(match[2]).slice(0, 160);
      links.push({
        url: url.toString(),
        text
      });
    } catch {
      continue;
    }
  }

  return links;
}

function scoreCompanyReleaseLink(url, text) {
  const value = `${url} ${text}`.toLowerCase();
  let score = 0;

  if (/(news|press|release|releases|topics|information|info|newsroom|ir)/.test(value)) {
    score += 3;
  }

  if (/(ニュース|お知らせ|プレスリリース|新着|トピックス|最新情報|ニュースリリース)/.test(value)) {
    score += 3;
  }

  if (/\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/.test(value) || /\d{4}年\d{1,2}月\d{1,2}日/.test(value)) {
    score += 2;
  }

  if (text.length > 8) {
    score += 1;
  }

  return score;
}

function isLikelyReleasePage({ url, html, text }) {
  const anchorCount = (html.match(/<a\b/gi) || []).length;
  const title = extractTitleFromHtml(html, url).toLowerCase();
  const urlLower = url.toLowerCase();
  const releaseKeyword =
    /(news|press|release|releases|topics|information|info|newsroom|ir)/.test(urlLower) ||
    /(ニュース|お知らせ|プレスリリース|新着|トピックス|最新情報|ニュースリリース)/.test(title);
  const sectionKeyword =
    /(news|press release|topics|information)/i.test(text) ||
    /(ニュース|お知らせ|プレスリリース|新着|トピックス|最新情報|ニュースリリース)/.test(text);

  return (releaseKeyword || sectionKeyword) && anchorCount <= 80 && text.length >= 180;
}

async function fetchTextWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COMPANY_CRAWL_PAGE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "KizunaNoteBot/1.0 (+https://kizunanote.com)"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function crawlCompanyReleasePages(companyUrl) {
  const queue = [{ url: companyUrl, depth: 0 }];
  const visited = new Set();
  const releases = [];

  while (queue.length && visited.size < COMPANY_CRAWL_MAX_PAGES) {
    const current = queue.shift();
    if (!current || visited.has(current.url)) {
      continue;
    }

    visited.add(current.url);

    let html;
    try {
      html = await fetchTextWithTimeout(current.url);
    } catch (error) {
      logger.warn("Failed to fetch company release page.", {
        url: current.url,
        message: error instanceof Error ? error.message : String(error)
      });
      continue;
    }

    const contentHtml = getLikelyContentHtml(html);
    const text = stripHtml(contentHtml);
    const releaseSections = extractTodayReleaseSection(text);

    if (releaseSections.length && isLikelyReleasePage({ url: current.url, html, text })) {
      for (const section of releaseSections) {
        releases.push({
          url: current.url,
          title: section.title || extractTitleFromHtml(html, current.url),
          body: section.body
        });
      }
    }

    if (current.depth >= 1) {
      continue;
    }

    const candidateLinks = extractSameOriginLinks(current.url, html)
      .map((link) => ({ ...link, score: scoreCompanyReleaseLink(link.url, link.text) }))
      .filter((link) => link.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, COMPANY_CRAWL_MAX_PAGES - visited.size);

    for (const link of candidateLinks) {
      if (!visited.has(link.url)) {
        queue.push({ url: link.url, depth: current.depth + 1 });
      }
    }
  }

  return releases;
}

function buildCompanyReleaseNoteBody({ title, url, body }) {
  const trimmedBody = body.slice(0, 6000).trim();
  return [`【勤務先リリース】${title}`, url, "", trimmedBody].join("\n");
}

function buildCompanyReleaseImportKey(release) {
  return createStableDocId(
    [
      release.url.trim(),
      release.title.trim(),
      normalizeReleaseBody(release.body).trim()
    ].join("\n")
  );
}

function createStableDocId(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 40);
}

function normalizeCorporateTypeTypos(value) {
  return String(value || "")
    .replace(/株式会(?!社)/gu, "株式会社")
    .replace(/有限会(?!社)/gu, "有限会社")
    .replace(/合同会(?!社)/gu, "合同会社");
}

function cleanWorkplaceLabel(value) {
  const normalized = normalizeCorporateTypeTypos(value)
    .replace(/^.*(?:現在|現職|いま|今)/u, "")
    .replace(/^(?:現在|現職|いま|今)[、,\s]*/u, "")
    .replace(/^(現在の)?(?:勤務先|所属先|所属|会社|現職)[は:：\s]*/u, "")
    .replace(/^(?:勤務先|所属先|所属|会社)[は:：]\s*/u, "")
    .replace(/^.*[、,，]\s*/u, "")
    .replace(/(?:を経て|をへて).*/u, "")
    .replace(/^(?:で|に|の)\s*/u, "")
    .replace(/[。．、,，\s]+$/u, "")
    .trim();

  const trimTrailingContext = (label) =>
    label
      .replace(
        /の(?:代表取締役|社長|会長|CEO|COO|CFO|理事長|院長|学長|取締役|執行役員|役員|共同創業者|創業者|オーナー|代表|部長|課長|主任|マネージャー).*/u,
        ""
      )
      .replace(
        /(?:で|に)?(?:代表取締役|社長|会長|CEO|COO|CFO|理事長|院長|学長|取締役|執行役員|役員|共同創業者|創業者|オーナー|代表)(?:を)?(?:務め(?:ている|た|る)?|している|した|する)?.*/u,
        ""
      )
      .replace(
        /の(?:管理部|営業部|開発部|人事部|広報部|マーケティング部).*/u,
        ""
      )
      .replace(
        /(?:(?:で|に|の|を)\s*)?(?:勤務(?:している|した|し)?|働(?:いている|いた|く)?|勤め(?:ている|た|る)?|所属(?:している|した|し)?|経営(?:している|した|し)?|運営(?:している|した|し)?|主宰(?:している|した|し)?|出向(?:している|した|し)?).*/u,
        ""
      )
      .replace(
        /(?:(?:で|に|の|を)\s*)?(?:活動(?:している|した|し)?|務め(?:ている|た|る)?|担当(?:している|した|し)?).*/u,
        ""
      )
      .replace(/[。．、,，\s]+$/u, "")
      .trim();

  const corporateMatch = normalized.match(
    /((?:株式会社|有限会社|合同会社)\s*[^\s。．、,，]+(?:\s*[^\s。．、,，]+){0,3}?)(?=(?:(?:で|に|の|を)\s*)?(?:勤務|働|勤め|所属|経営|運営|主宰|活動|務め|担当|出向)|[はがをにで、,，。．\s]|$)|((?:[^\s。．、,，]+(?:\s*[^\s。．、,，]+){0,3}?)\s*(?:株式会社|有限会社|合同会社))(?=(?:(?:で|に|の|を)\s*)?(?:勤務|働|勤め|所属|経営|運営|主宰|活動|務め|担当|出向)|[はがをにで、,，。．\s]|$)|([A-Z][A-Za-z0-9&'.\-/ ]{1,}(?:Holdings|Group|Partners|Corporation|Company|Inc\.?|LLC|Ltd\.?|Studio|Works|Design|Creative|Lab))/u
  );

  if (corporateMatch) {
    return trimTrailingContext((corporateMatch[1] ?? corporateMatch[2] ?? corporateMatch[3] ?? "").trim());
  }

  const organizationMatch = normalized.match(
    /([^。．、,，\s]+(?:スタジオ|studio|Studio|STUDIO|工房|事務所|研究所|ラボ|病院|学校|センター|会|協会|法人|園|庁|館))/u
  );

  if (organizationMatch) {
    return trimTrailingContext(organizationMatch[1].trim());
  }

  return trimTrailingContext(
    normalized
    .replace(/[はがを].*$/u, "")
    .replace(/[。．、,，\s]+$/u, "")
    .trim()
  );
}

function isWeakWorkplaceLabel(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return true;
  }

  const weakExactLabels = new Set([
    "株式会社",
    "有限会社",
    "合同会社",
    "会社",
    "勤務先",
    "所属先",
    "所属",
    "現職",
    "職場",
    "開発部",
    "営業部",
    "管理部",
    "人事部",
    "広報部",
    "マーケティング部",
    "代表",
    "社長",
    "取締役",
    "部長",
    "課長",
    "主任",
    "マネージャー",
  ]);

  if (weakExactLabels.has(normalized)) {
    return true;
  }

  if (/^(?:株式会社|有限会社|合同会社)の/u.test(normalized)) {
    return true;
  }

  if (/^(?:勤務先|所属先|所属|会社|現職|職場)[は:：]*/u.test(normalized)) {
    return true;
  }

  if (/^(?:開発部|営業部|管理部|人事部|広報部|マーケティング部)(?:$|の)/u.test(normalized)) {
    return true;
  }

  if (/^[^\p{L}\p{N}]*$/u.test(normalized)) {
    return true;
  }

  return false;
}

function resolveWorkplaceTag(nextCandidate, existingTag) {
  const normalizedNext = cleanWorkplaceLabel(nextCandidate || "");

  if (!isWeakWorkplaceLabel(normalizedNext)) {
    return normalizedNext;
  }

  const normalizedExisting = cleanWorkplaceLabel(existingTag || "");

  if (!isWeakWorkplaceLabel(normalizedExisting)) {
    return normalizedExisting;
  }

  return null;
}

function scoreWorkplaceCandidate({ bullet, candidate, kind }) {
  const normalizedBullet = String(bullet || "");
  const normalizedCandidate = String(candidate || "");
  let score = kind === "contextual" ? 20 : 10;

  if (!normalizedCandidate) {
    return -100;
  }

  if (new RegExp(`${normalizedCandidate}(?:の)?(?:代表取締役|社長|会長|CEO|COO|CFO|理事長|院長|学長)`, "u").test(normalizedBullet)) {
    score += 120;
  }

  if (new RegExp(`${normalizedCandidate}(?:の)?(?:取締役|執行役員|役員|共同創業者|創業者|オーナー|代表)`, "u").test(normalizedBullet)) {
    score += 80;
  }

  if (new RegExp(`${normalizedCandidate}(?:を)?(?:経営|運営|主宰)`, "u").test(normalizedBullet)) {
    score += 60;
  }

  if (new RegExp(`${normalizedCandidate}(?:に|で)(?:勤務|勤め|所属|働)`, "u").test(normalizedBullet)) {
    score += 30;
  }

  if (new RegExp(`${normalizedCandidate}(?:に)?出向`, "u").test(normalizedBullet)) {
    score -= 40;
  }

  if (/出向/u.test(normalizedBullet) && !new RegExp(`${normalizedCandidate}(?:に)?出向`, "u").test(normalizedBullet)) {
    score -= 10;
  }

  if (/兼務|複数/u.test(normalizedBullet)) {
    score -= 5;
  }

  return score;
}

function extractCurrentWorkplaceCandidates(bullets) {
  const normalizedBullets = bullets.map(normalizeSummaryBullet).filter(Boolean);
  const contextualPatterns = [
    /(.+?)に勤務(?:している)?/u,
    /(.+?)で勤務(?:している)?/u,
    /(.+?)で(?:[^。．、,，]{0,24}?として)?働(?:いている|く)/u,
    /(.+?)の[^。．、,，]{0,24}?として働(?:いている|く)/u,
    /(.+?)に勤め(?:ている)?/u,
    /(.+?)に所属(?:している|し)?/u,
    /(.+?)に出向(?:している|し)?/u,
    /(.+?)の代表取締役/u,
    /(.+?)の(?:社長|会長|CEO|COO|CFO|理事長|院長|学長)/u,
    /(.+?)を経営(?:している)?/u,
    /(.+?)を運営(?:している)?/u,
    /(.+?)を主宰(?:している)?/u
  ];
  const directPatterns = [
    /((?:株式会社|有限会社|合同会社)[^。．、,，]*)/u,
    /([^。．、,，]*(?:株式会社|有限会社|合同会社)[^。．、,，]*)/u,
    /([^。．、,，]*(?:スタジオ|studio|Studio|STUDIO|工房|事務所|研究所|ラボ|会社|病院|学校|センター|協会|法人)[^。．、,，]*)/u,
    /([A-Z][A-Za-z0-9&'.\-/ ]{2,}(?:Holdings|Group|Partners|Corporation|Company|Inc\.?|LLC|Ltd\.?|Studio|Works|Design|Creative|Lab))/u
  ];
  const candidates = [];

  for (const bullet of normalizedBullets) {
    for (const pattern of contextualPatterns) {
      const match = bullet.match(pattern);
      const candidate = cleanWorkplaceLabel(match?.[1] ?? "");

      if (candidate) {
        candidates.push({
          bullet,
          candidate: normalizeCorporateTypeTypos(candidate),
          kind: "contextual",
          weak: isWeakWorkplaceLabel(normalizeCorporateTypeTypos(candidate)),
          score: scoreWorkplaceCandidate({
            bullet,
            candidate: normalizeCorporateTypeTypos(candidate),
            kind: "contextual",
          }),
        });
      }
    }
  }

  for (const bullet of normalizedBullets) {
    for (const pattern of directPatterns) {
      const match = bullet.match(pattern);
      const candidate = cleanWorkplaceLabel(match?.[1] ?? "");

      if (candidate) {
        candidates.push({
          bullet,
          candidate: normalizeCorporateTypeTypos(candidate),
          kind: "direct",
          weak: isWeakWorkplaceLabel(normalizeCorporateTypeTypos(candidate)),
          score: scoreWorkplaceCandidate({
            bullet,
            candidate: normalizeCorporateTypeTypos(candidate),
            kind: "direct",
          }),
        });
      }
    }
  }

  return candidates.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (left.weak !== right.weak) {
      return Number(left.weak) - Number(right.weak);
    }

    return Number(right.kind === "contextual") - Number(left.kind === "contextual");
  });
}

function extractCurrentWorkplace(bullets) {
  const candidates = extractCurrentWorkplaceCandidates(bullets);
  const strongCandidate = candidates.find((candidate) => !candidate.weak);

  if (strongCandidate) {
    return strongCandidate.candidate;
  }

  if (candidates.length) {
    return candidates[0].candidate;
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
              "You are summarizing facts about the profile person, not the note author. " +
              "Return up to 5 bullet points, each a single sentence, prioritizing stable useful facts, preferences, relationships, and recent important context. " +
              "Merge overlap, remove redundancy, and avoid speculation. " +
              "Important interpretation rules: first-person expressions such as 私, わたし, 僕, 俺, わたくし refer to the note author, not the profile person. " +
              "When a note says things like '私の弟', '私の妻', '私の上司', '私の部下', keep the first-person reference as the note author and rewrite them naturally as facts about the profile person, for example '私の弟', '私の妻'. " +
              "Never use the word '記録者' in the output. Use natural first-person Japanese such as '私の妻' instead. " +
              "Do not use the phrase 'プロフィール本人' in the output. Use '本人' instead when needed. " +
              "Do not start a sentence with '本人は' or similar subject phrases when the sentence is simply describing the profile person. Omit the subject in that case. " +
              "Use '本人の...' only when it is necessary to identify another person or relationship, such as '本人の息子'. " +
              "Do not incorrectly turn first-person statements into attributes of the profile person."
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
                summaryPerspective:
                  "対象は本人です。ノートの一人称は記録者本人を指しますが、出力では '記録者' や 'プロフィール本人' とは書かず、通常は '本人は' のような主語を省いてください。別人物との関係を示すために必要な場合だけ『本人の息子』『本人の母』のように表現してください。自然な一人称の '私' を使い、たとえば『私の妻』『私の上司』のように表現してください。",
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
    .map((bullet) => normalizeSummaryFirstPerson(bullet))
    .map((bullet) => normalizeProfilePersonLabel(bullet))
    .map((bullet) => normalizeProfileSubject(bullet))
    .map((bullet) => normalizeDanglingLeadingParticle(bullet))
    .map((bullet) => normalizeReleaseBody(bullet))
    .filter(Boolean)
    .slice(0, 5);
}

async function getUpdatedNotesForSummary(profileId, lastSummarizedAt) {
  let notesQuery = db.collection(`profiles/${profileId}/notes`).orderBy("updatedAt", "desc");

  if (lastSummarizedAt) {
    notesQuery = notesQuery.where("updatedAt", ">", lastSummarizedAt);
  }

  const updatedNotesSnapshot = await notesQuery.limit(MAX_UPDATED_NOTES).get();

  return updatedNotesSnapshot.docs
    .map((noteDoc) => {
      const noteData = noteDoc.data();

      return {
        id: noteDoc.id,
        body: truncateNoteBody(String(noteData.body || "")),
        updatedAt: noteData.updatedAt || noteData.createdAt || null
      };
    })
    .filter((note) => note.body);
}

async function runProfileSummary(profileDoc) {
  const profileId = profileDoc.id;
  const profileData = profileDoc.data();
  const summaryRef = db.doc(`profiles/${profileId}/private/summary`);

  await profileDoc.ref.update({
    summaryStatus: "processing",
    updatedAt: FieldValue.serverTimestamp()
  });

  const summarySnapshot = await summaryRef.get();
  const summaryData = summarySnapshot.exists ? summarySnapshot.data() : {};
  const lastSummarizedAt = summaryData?.lastSummarizedAt || null;
  const updatedNotes = await getUpdatedNotesForSummary(profileId, lastSummarizedAt);
  const hasExistingBullets = Array.isArray(summaryData?.bullets) && summaryData.bullets.length > 0;

  if (!updatedNotes.length) {
    await profileDoc.ref.update({
      summaryStatus: hasExistingBullets ? "ready" : "idle",
      updatedAt: FieldValue.serverTimestamp()
    });

    return {
      status: "already_latest"
    };
  }

  const bullets = await summarizeProfile({
    profileId,
    fullName: String(profileData.fullName || ""),
    existingBullets: Array.isArray(summaryData?.bullets) ? summaryData.bullets : [],
    updatedNotes
  });
  const workplaceCandidates = extractCurrentWorkplaceCandidates(bullets);
  const extractedWorkplaceTag = workplaceCandidates.find((candidate) => !candidate.weak)?.candidate
    ?? workplaceCandidates[0]?.candidate
    ?? null;
  const workplaceTag = resolveWorkplaceTag(
    extractedWorkplaceTag,
    profileData.workplaceTag,
  );
  const now = FieldValue.serverTimestamp();

  logger.info("Workplace tag extraction evaluated.", {
    profileId,
    bullets,
    workplaceCandidates,
    existingWorkplaceTag: profileData.workplaceTag ?? null,
    extractedWorkplaceTag,
    resolvedWorkplaceTag: workplaceTag,
  });

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

  return {
    status: "updated"
  };
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

      try {
        const result = await runProfileSummary(profileDoc);

        logger.info("Profile summary handled.", { profileId, status: result.status });
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

export const summarizeProfileNow = onCall(
  {
    region: "asia-northeast1",
    secrets: [OPENAI_API_KEY]
  },
  async (request) => {
    const uid = request.auth?.uid;
    const profileId =
      typeof request.data?.profileId === "string" ? request.data.profileId.trim() : "";

    if (!uid) {
      throw new HttpsError("unauthenticated", "ログインが必要です。");
    }

    if (!profileId) {
      throw new HttpsError("invalid-argument", "プロフィールIDが必要です。");
    }

    const profileRef = db.doc(`profiles/${profileId}`);
    const profileSnapshot = await profileRef.get();

    if (!profileSnapshot.exists) {
      throw new HttpsError("not-found", "プロフィールが見つかりません。");
    }

    const profileData = profileSnapshot.data();
    if (String(profileData?.ownerUid || "") !== uid) {
      throw new HttpsError("permission-denied", "このプロフィールを要約する権限がありません。");
    }

    const summaryStatus = String(profileData?.summaryStatus || "idle");
    if (summaryStatus === "processing") {
      return { status: "processing" };
    }

    const result = await runProfileSummary(profileSnapshot);
    return result;
  }
);

export const sendBirthdayPushNotifications = onSchedule(
  {
    schedule: BIRTHDAY_PUSH_SCHEDULE,
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
  },
  async () => {
    const profilesSnapshot = await db.collection("profiles").select("ownerUid", "birthday", "fullName").get();

    if (profilesSnapshot.empty) {
      logger.info("No profiles found for birthday push notifications.");
      return;
    }

    const todayKey = getJstMonthDayKey(new Date());
    const threeDaysLaterKey = getJstMonthDayKey(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
    const notificationsByOwner = new Map();

    logger.info("Evaluating birthday push notification candidates.", {
      profileCount: profilesSnapshot.size,
      todayKey,
      threeDaysLaterKey,
    });

    for (const profileDoc of profilesSnapshot.docs) {
      const profileData = profileDoc.data();
      const ownerUid = typeof profileData.ownerUid === "string" ? profileData.ownerUid : "";
      const birthdayKey = getMonthDayKeyFromBirthday(profileData.birthday);
      const fullName = typeof profileData.fullName === "string" ? profileData.fullName.trim() : "";

      if (!ownerUid || !birthdayKey || !fullName) {
        continue;
      }

      let body = "";

      if (birthdayKey === todayKey) {
        body = `今日は${fullName}さんの誕生日です！`;
      } else if (birthdayKey === threeDaysLaterKey) {
        body = `3日後に${fullName}さんの誕生日です！`;
      }

      if (!body) {
        continue;
      }

      const currentNotifications = notificationsByOwner.get(ownerUid) ?? [];
      currentNotifications.push({
        profileId: profileDoc.id,
        body,
      });
      notificationsByOwner.set(ownerUid, currentNotifications);
    }

    if (!notificationsByOwner.size) {
      logger.info("No birthday push notifications scheduled for today.");
      return;
    }

    logger.info("Birthday push notification targets prepared.", {
      ownerCount: notificationsByOwner.size,
      notificationsByOwner: Array.from(notificationsByOwner.entries()).map(([ownerUid, notifications]) => ({
        ownerUid,
        notificationCount: notifications.length,
        profileIds: notifications.map((notification) => notification.profileId),
      })),
    });

    for (const [ownerUid, notifications] of notificationsByOwner.entries()) {
      try {
        await sendBirthdayPushNotificationsForUser(ownerUid, notifications);
      } catch (error) {
        logger.error("Failed to send birthday push notifications.", {
          ownerUid,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : null,
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

export const importCompanyReleaseNotes = onSchedule(
  {
    schedule: COMPANY_CRAWL_SCHEDULE,
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    memory: "512MiB",
    timeoutSeconds: 540
  },
  async () => {
    const profilesSnapshot = await db.collection("profiles").get();

    if (profilesSnapshot.empty) {
      logger.info("No profiles found for company release crawl.");
      return;
    }

    const userPlanCache = new Map();

    for (const profileDoc of profilesSnapshot.docs) {
      const profileData = profileDoc.data();
      const ownerUid = String(profileData.ownerUid || "");

      if (!ownerUid) {
        continue;
      }

      let ownerPlan = userPlanCache.get(ownerUid);

      if (!ownerPlan) {
        const userSnapshot = await db.doc(`users/${ownerUid}`).get();
        const userData = userSnapshot.exists ? userSnapshot.data() : {};
        const rawPlanId = typeof userData?.planId === "string" ? userData.planId.trim().toLowerCase() : "";
        ownerPlan = rawPlanId === "pro" ? "pro" : "other";
        userPlanCache.set(ownerUid, ownerPlan);
      }

      if (ownerPlan !== "pro") {
        continue;
      }

      const contactSnapshot = await db.doc(`profiles/${profileDoc.id}/private/contact`).get();
      const contactData = contactSnapshot.exists ? contactSnapshot.data() : {};
      const companyUrl = typeof contactData?.companyUrl === "string" ? contactData.companyUrl.trim() : "";

      if (!companyUrl) {
        continue;
      }

      const normalizedCompanyUrl =
        companyUrl.startsWith("http://") || companyUrl.startsWith("https://")
          ? companyUrl
          : `https://${companyUrl}`;

      let releases;
      try {
        releases = await crawlCompanyReleasePages(normalizedCompanyUrl);
      } catch (error) {
        logger.error("Company release crawl failed.", {
          profileId: profileDoc.id,
          companyUrl: normalizedCompanyUrl,
          message: error instanceof Error ? error.message : String(error)
        });
        continue;
      }

      for (const release of releases) {
        const importId = buildCompanyReleaseImportKey(release);
        const importRef = db.doc(`profiles/${profileDoc.id}/releaseImports/${importId}`);
        const existingImport = await importRef.get();

        if (existingImport.exists) {
          continue;
        }

        const noteBody = buildCompanyReleaseNoteBody(release);

        await db.collection(`profiles/${profileDoc.id}/notes`).add({
          body: noteBody,
          sourceType: "company_release",
          sourceUrl: release.url,
          sourceTitle: release.title,
          happenedAt: FieldValue.serverTimestamp(),
          createdByUid: ownerUid,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });

        await importRef.set({
          sourceUrl: release.url,
          sourceTitle: release.title,
          sourceBodyPreview: normalizeReleaseBody(release.body).slice(0, 500),
          importedAt: FieldValue.serverTimestamp()
        });

        await profileDoc.ref.update({
          noteCount: FieldValue.increment(1),
          latestNoteAt: FieldValue.serverTimestamp(),
          lastNoteUpdatedAt: FieldValue.serverTimestamp(),
          summaryStatus: "pending",
          updatedAt: FieldValue.serverTimestamp()
        });

        logger.info("Imported company release note.", {
          profileId: profileDoc.id,
          sourceUrl: release.url
        });
      }
    }
  }
);
