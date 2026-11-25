"use client";

import Link from "next/link";
import { Calendar, CalendarCheck, ArrowUpRight } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

function parseDateParts(dateStr) {
  if (!dateStr) return { month: "TBD", day: "—" };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { month: "TBD", day: "—" };
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate()).padStart(2, "0");
  return { month, day };
}

export default function UpcomingObligations({ obligations }) {
  const hasObligations = obligations && obligations.length > 0;
  const sorted = hasObligations
    ? [...obligations].sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0)).slice(0, 6)
    : [];

  return (
    <div
      className="fade-up delay-4"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-1)" }}>
            Upcoming Obligations
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted-fg)", marginTop: "2px" }}>
            Renewals, notices &amp; deliverables
          </div>
        </div>
      </div>

      {!hasObligations ? (
        <div style={{ padding: "20px" }}>
          <EmptyState
            icon={Calendar}
            title="No upcoming obligations"
            description="You are all caught up on your contract deadlines."
          />
        </div>
      ) : (
        <div style={{ padding: "8px 0" }}>
          {sorted.map((obl, idx) => {
            const { month, day } = parseDateParts(obl.due_date);
            const isOverdue = obl.status === "OVERDUE";
            const docHref =
              obl.client_id && obl.project_id && obl.document_id
                ? `/clients/${obl.client_id}/projects/${obl.project_id}/documents/${obl.document_id}`
                : null;

            const inner = (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 20px",
                  borderBottom: idx < sorted.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-xs)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {/* Calendar Block Badge */}
                <div
                  style={{
                    width: "40px",
                    padding: "5px 0",
                    borderRadius: "6px",
                    textAlign: "center",
                    background: isOverdue ? "var(--red-dim)" : "var(--surface-xs)",
                    border: `1px solid ${isOverdue ? "var(--red-border)" : "var(--border)"}`,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      color: isOverdue ? "var(--red)" : "var(--muted-fg)",
                      lineHeight: 1,
                    }}
                  >
                    {month}
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: isOverdue ? "var(--red)" : "var(--fg)",
                      lineHeight: 1.25,
                    }}
                  >
                    {day}
                  </div>
                </div>

                {/* Details */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--fg)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{obl.title}</span>
                    {docHref && <ArrowUpRight size={11} style={{ opacity: 0.4, flexShrink: 0 }} />}
                  </div>
                  <div
                    style={{
                      fontSize: "11.5px",
                      color: "var(--muted-fg)",
                      marginTop: "2px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {obl.document_title || obl.client_name || "Contract Obligation"}
                  </div>
                </div>

                {obl.is_synced_calendar && (
                  <CalendarCheck size={14} color="var(--green)" style={{ flexShrink: 0 }} />
                )}
              </div>
            );

            return docHref ? (
              <Link key={obl.id} href={docHref} style={{ textDecoration: "none", display: "block" }}>
                {inner}
              </Link>
            ) : (
              <div key={obl.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
