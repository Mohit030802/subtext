"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPlus, CalendarCheck, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { markObligationCalendarSynced } from "@/lib/actions";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

const STATUS = {
  PENDING:   { label: "Pending",   color: "#60a5fa", bg: "rgba(96,165,250,0.1)"  },
  COMPLETED: { label: "Completed", color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
  OVERDUE:   { label: "Overdue",   color: "#f87171", bg: "rgba(248,113,113,0.1)" },
};
const OBL_TYPE = { RENEWAL_NOTICE:"Renewal", PAYMENT:"Payment", DELIVERABLE:"Deliverable", COMPLIANCE:"Compliance", EXPIRY:"Expiry", OTHER:"Other" };
const PARTY = {
  US:          { label: "Us",           color: "#60a5fa", bg: "rgba(96,165,250,0.1)"  },
  CLIENT:      { label: "Client",       color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  THIRD_PARTY: { label: "Third Party",  color: "#71717a", bg: "rgba(113,113,122,0.1)" },
};

export default function ObligationsTab({ obligations }) {
  const [syncedIds, setSyncedIds] = useState(() => new Set(
    obligations.filter((obligation) => obligation.is_synced_calendar).map((obligation) => obligation.id)
  ));
  const [syncingId, setSyncingId] = useState(null);
  const tokenClientRef = useRef(null);

  useEffect(() => {
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const getCalendarToken = () => new Promise((resolve, reject) => {
    const requestToken = () => {
      if (!window.google?.accounts?.oauth2) {
        setTimeout(requestToken, 200);
        return;
      }
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: CALENDAR_SCOPE,
        callback: (response) => response.error
          ? reject(new Error(response.error))
          : resolve(response.access_token),
      });
      tokenClientRef.current.requestAccessToken({ prompt: "consent" });
    };
    requestToken();
  });

  const addToCalendar = async (obligation) => {
    if (!obligation.due_date || syncedIds.has(obligation.id) || syncingId) return;
    setSyncingId(obligation.id);
    try {
      const accessToken = await getCalendarToken();
      const startDate = obligation.due_date;
      const endDate = new Date(`${startDate}T00:00:00Z`);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
      const calendarResponse = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: obligation.title,
          description: obligation.description || "Obligation extracted by Subtext.",
          start: { date: startDate },
          end: { date: endDate.toISOString().slice(0, 10) },
        }),
      });
      if (!calendarResponse.ok) {
        const error = await calendarResponse.json().catch(() => ({}));
        throw new Error(error.error?.message || "Google Calendar could not create the event");
      }
      const event = await calendarResponse.json();
      await markObligationCalendarSynced(obligation.document_id, obligation.id, event.id);
      setSyncedIds((current) => new Set([...current, obligation.id]));
    } catch (error) {
      console.error("Calendar sync failed:", error);
      alert(`Could not add this obligation to Google Calendar: ${error.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  const sorted = [...obligations].sort((a,b) => new Date(a.due_date||0)-new Date(b.due_date||0));

  if (!sorted.length)
    return <div style={{ padding: "32px", textAlign: "center", color: "var(--subtle-fg)", fontSize: "13px" }}>No obligations found</div>;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {sorted.map((obl, i) => {
        const st = STATUS[obl.status]||STATUS.PENDING;
        const party = PARTY[obl.party_responsible]||PARTY.THIRD_PARTY;
        const isSynced = syncedIds.has(obl.id);
        const isSyncing = syncingId === obl.id;
        return (
          <div
            key={obl.id}
            className="fade-up"
            style={{
              animationDelay: `${i * 0.04}s`,
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "3px" }}>{obl.title}</div>
                {obl.description && (
                  <div style={{ fontSize: "11px", color: "var(--subtle-fg)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {obl.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => addToCalendar(obl)}
                disabled={!obl.due_date || isSynced || isSyncing}
                title={!obl.due_date ? "This obligation has no due date" : isSynced ? "Added to Google Calendar" : "Add to Google Calendar"}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3px", background: "transparent", border: "none", cursor: !obl.due_date || isSynced || isSyncing ? "default" : "pointer", opacity: !obl.due_date ? 0.4 : 1 }}
              >
                {isSyncing
                  ? <Loader2 size={15} color="var(--muted-fg)" style={{ animation: "spin 1s linear infinite" }} />
                  : isSynced
                  ? <CalendarCheck size={15} color="#34d399" />
                  : <CalendarPlus size={15} color="var(--subtle-fg)" style={{ transition: "color 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.color="var(--text-3)"}
                      onMouseLeave={e => e.currentTarget.style.color="var(--subtle-fg)"}
                    />
                }
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: obl.status==="OVERDUE"?600:400, color: obl.status==="OVERDUE"?"#f87171":"var(--muted-fg)" }}>
                📅 {formatDate(obl.due_date)}
              </span>
              <span style={{ color: "var(--subtle-fg)" }}>·</span>
              <span style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "4px", background: "var(--surface-sm)", color: "var(--muted-fg)" }}>
                {OBL_TYPE[obl.obligation_type]||"Other"}
              </span>
              <span className="risk-pill" style={{ background: st.bg, color: st.color }}>
                <span className="risk-pill-dot" style={{ background: st.color }} />
                {st.label}
              </span>
              <span style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "4px", background: party.bg, color: party.color }}>
                {party.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
