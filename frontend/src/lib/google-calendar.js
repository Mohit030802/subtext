"use client";

import { getGoogleAccessToken, CALENDAR_SCOPE } from "./google-auth";
import { markObligationCalendarSynced } from "./actions";

/**
 * Creates an all-day or dated event in the user's primary Google Calendar.
 */
export async function createGoogleCalendarEvent(obligation, accessToken) {
  if (!obligation.due_date) {
    throw new Error("Obligation has no due date");
  }

  const startDate = obligation.due_date;
  const endDateObj = new Date(`${startDate}T00:00:00Z`);
  endDateObj.setUTCDate(endDateObj.getUTCDate() + 1);
  const endDate = endDateObj.toISOString().slice(0, 10);

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: `[Subtext] ${obligation.title}`,
      description: obligation.description
        ? `${obligation.description}\n\nManaged by Subtext AI Contract Intelligence.`
        : "Contract obligation tracked by Subtext.",
      start: { date: startDate },
      end: { date: endDate },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 * 7 }, // 7 days before
          { method: "popup", minutes: 24 * 60 },     // 1 day before
        ],
      },
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || "Google Calendar rejected the request");
  }

  return res.json();
}

/**
 * Sync a single obligation to Google Calendar and update database.
 */
export async function syncSingleObligation(obligation, userEmail, tokenOverride = null) {
  const token = tokenOverride || (await getGoogleAccessToken(CALENDAR_SCOPE, userEmail));
  const event = await createGoogleCalendarEvent(obligation, token);
  await markObligationCalendarSynced(obligation.document_id, obligation.id, event.id);
  return event.id;
}

/**
 * Sync all unsynced obligations for a document in one go.
 */
export async function syncAllObligations(obligations, userEmail, onProgress) {
  const eligible = obligations.filter(o => o.due_date && !o.is_synced_calendar);
  if (!eligible.length) {
    return { syncedIds: [], syncedCount: 0, failedCount: 0 };
  }

  // Request calendar token once for all items
  const token = await getGoogleAccessToken(CALENDAR_SCOPE, userEmail);

  const syncedIds = [];
  let failedCount = 0;

  for (let i = 0; i < eligible.length; i++) {
    const obl = eligible[i];
    if (onProgress) onProgress(i + 1, eligible.length, obl.title);
    try {
      await syncSingleObligation(obl, userEmail, token);
      syncedIds.push(obl.id);
    } catch (err) {
      console.error(`Failed to sync obligation ${obl.id}:`, err);
      failedCount++;
    }
  }

  return {
    syncedIds,
    syncedCount: syncedIds.length,
    failedCount,
  };
}
