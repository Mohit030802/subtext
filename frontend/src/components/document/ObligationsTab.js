"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarPlus, CalendarCheck, Loader2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { syncSingleObligation, syncAllObligations } from "@/lib/google-calendar";

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

export default function ObligationsTab({ obligations, onObligationsUpdated }) {
  const { data: session } = useSession();
  const [syncedIds, setSyncedIds] = useState(() => new Set(
    obligations.filter((obligation) => obligation.is_synced_calendar).map((obligation) => obligation.id)
  ));
  const [syncingId, setSyncingId] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    setSyncedIds(new Set(
      obligations.filter((obligation) => obligation.is_synced_calendar).map((obligation) => obligation.id)
    ));
  }, [obligations]);

  const addToCalendar = async (obligation) => {
    if (!obligation.due_date || syncedIds.has(obligation.id) || syncingId || syncingAll) return;
    setSyncingId(obligation.id);
    try {
      await syncSingleObligation(obligation, session?.user?.email);
      setSyncedIds((current) => new Set([...current, obligation.id]));
      if (onObligationsUpdated) {
        onObligationsUpdated((prev) =>
          prev.map((o) => (o.id === obligation.id ? { ...o, is_synced_calendar: true } : o))
        );
      }
    } catch (error) {
      console.error("Calendar sync failed:", error);
      alert(`Could not add this obligation to Google Calendar: ${error.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    const unsynced = obligations.filter((o) => o.due_date && !syncedIds.has(o.id));
    if (!unsynced.length || syncingAll) return;
    setSyncingAll(true);
    try {
      const result = await syncAllObligations(unsynced, session?.user?.email);
      setSyncedIds((current) => new Set([...current, ...result.syncedIds]));
      if (onObligationsUpdated) {
        onObligationsUpdated((prev) =>
          prev.map((o) => (result.syncedIds.includes(o.id) ? { ...o, is_synced_calendar: true } : o))
        );
      }
    } catch (error) {
      console.error("Batch sync failed:", error);
      alert(`Could not sync all obligations: ${error.message}`);
    } finally {
      setSyncingAll(false);
    }
  };

  const sorted = [...obligations].sort((a,b) => new Date(a.due_date||0)-new Date(b.due_date||0));
  const unsyncedCount = sorted.filter((o) => o.due_date && !syncedIds.has(o.id)).length;

  if (!sorted.length)
    return <div style={{ padding: "32px", textAlign: "center", color: "var(--subtle-fg)", fontSize: "13px" }}>No obligations found</div>;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Header bar with Sync All option */}
      {unsyncedCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface-xs)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-2)" }}>
            <Calendar size={14} color="#a78bfa" />
            <span>{unsyncedCount} obligation{unsyncedCount !== 1 ? "s" : ""} pending calendar sync</span>
          </div>
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncingAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              borderRadius: "6px",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              fontSize: "11px",
              fontWeight: 600,
              cursor: syncingAll ? "default" : "pointer",
            }}
          >
            {syncingAll ? (
              <>
                <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                <span>Syncing…</span>
              </>
            ) : (
              <span>Sync All to Calendar</span>
            )}
          </button>
        </div>
      )}

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
                disabled={!obl.due_date || isSynced || isSyncing || syncingAll}
                title={!obl.due_date ? "This obligation has no due date" : isSynced ? "Added to Google Calendar" : "Add to Google Calendar"}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", background: "transparent", border: "none", cursor: !obl.due_date || isSynced || isSyncing ? "default" : "pointer", opacity: !obl.due_date ? 0.4 : 1 }}
              >
                {isSyncing
                  ? <Loader2 size={16} color="var(--muted-fg)" style={{ animation: "spin 1s linear infinite" }} />
                  : isSynced
                  ? <CalendarCheck size={16} color="#34d399" />
                  : <CalendarPlus size={16} color="var(--subtle-fg)" style={{ transition: "color 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.color="var(--text-1)"}
                      onMouseLeave={e => e.currentTarget.style.color="var(--subtle-fg)"}
                    />
                }
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: obl.due_date ? "var(--text-2)" : "var(--subtle-fg)" }}>
                📅 {formatDate(obl.due_date)}
              </span>
              <span style={{ color: "var(--subtle-fg)" }}>·</span>
              <span style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "4px", background: "var(--surface-sm)", color: "var(--muted-fg)" }}>
                {OBL_TYPE[obl.obligation_type]||"Other"}
              </span>
              <span className="risk-pill" style={{ background: st.bg, color: st.color }}>
                {st.label}
              </span>
              <span className="risk-pill" style={{ background: party.bg, color: party.color }}>
                {party.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
