"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Bell, CheckCircle2, Loader2, X, ArrowRight } from "lucide-react";
import { syncAllObligations } from "@/lib/google-calendar";
import { formatDate } from "@/lib/utils";

export default function SyncObligationsModal({
  documentId,
  documentTitle,
  obligations = [],
  onSyncComplete,
  onClose,
}) {
  const { data: session } = useSession();
  const [syncing, setSyncing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [done, setDone] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);

  const eligible = obligations.filter((o) => o.due_date && !o.is_synced_calendar);
  if (!eligible.length) return null;

  const handleSyncAll = async () => {
    setSyncing(true);
    setProgressText(`Preparing calendar sync…`);
    try {
      const result = await syncAllObligations(
        eligible,
        session?.user?.email,
        (current, total, title) => {
          setProgressText(`Syncing ${current}/${total}: ${title.slice(0, 30)}…`);
        }
      );

      setSyncedCount(result.syncedCount);
      setDone(true);
      if (onSyncComplete) {
        onSyncComplete(result.syncedIds);
      }
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      console.error("Batch sync failed:", err);
      alert(`Could not complete calendar sync: ${err.message}`);
      setSyncing(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={syncing ? undefined : onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
        }}
      />

      {/* Modal Card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(480px, calc(100vw - 32px))",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
          padding: "24px",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(124, 58, 237, 0.15)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#a78bfa",
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--fg)" }}>
                Analysis Complete
              </div>
              <div style={{ fontSize: "11px", color: "var(--subtle-fg)" }}>
                {documentTitle || "Contract"}
              </div>
            </div>
          </div>
          {!syncing && (
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--subtle-fg)",
                padding: "4px",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {done ? (
          /* Success state */
          <div
            style={{
              padding: "24px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              textAlign: "center",
            }}
          >
            <CheckCircle2 size={36} color="#34d399" />
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--fg)" }}>
              {syncedCount} Obligation{syncedCount !== 1 ? "s" : ""} Synced!
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted-fg)", lineHeight: 1.5 }}>
              Calendar events created and email notifications scheduled before each deadline.
            </div>
          </div>
        ) : (
          /* Prompt Content */
          <>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-1)", marginBottom: "4px" }}>
                Sync {eligible.length} Deadline{eligible.length !== 1 ? "s" : ""} to Calendar & Email?
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted-fg)", lineHeight: 1.6 }}>
                Subtext extracted obligations with target due dates. Add them directly to your Google Calendar
                so you never miss an auto-renewal or payment deadline.
              </div>
            </div>

            {/* Mini preview list */}
            <div
              style={{
                background: "var(--surface-xs)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "130px",
                overflowY: "auto",
              }}
            >
              {eligible.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    fontSize: "11px",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-2)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    • {item.title}
                  </span>
                  <span
                    style={{
                      color: "#60a5fa",
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      flexShrink: 0,
                    }}
                  >
                    {formatDate(item.due_date)}
                  </span>
                </div>
              ))}
              {eligible.length > 3 && (
                <div style={{ fontSize: "10px", color: "var(--subtle-fg)", marginTop: "2px" }}>
                  + {eligible.length - 3} more obligations
                </div>
              )}
            </div>

            {/* Email reminder badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "6px",
                background: "rgba(96, 165, 250, 0.08)",
                border: "1px solid rgba(96, 165, 250, 0.2)",
                fontSize: "11px",
                color: "#93c5fd",
              }}
            >
              <Bell size={13} style={{ flexShrink: 0 }} />
              <span>Email reminder will automatically dispatch 20 days prior to each due date.</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={syncing}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--muted-fg)",
                  cursor: syncing ? "default" : "pointer",
                }}
              >
                Later
              </button>
              <button
                type="button"
                onClick={handleSyncAll}
                disabled={syncing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  cursor: syncing ? "default" : "pointer",
                  transition: "background 0.12s",
                }}
              >
                {syncing ? (
                  <>
                    <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                    <span>{progressText || "Syncing…"}</span>
                  </>
                ) : (
                  <>
                    <span>Sync with Calendar & Email</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
