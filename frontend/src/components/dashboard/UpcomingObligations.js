"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CalendarPlus, CalendarCheck, Calendar, ArrowUpRight } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

const STATUS = {
  PENDING:   { label: "Pending",   color: "#60a5fa", bg: "rgba(96,165,250,0.1)"  },
  COMPLETED: { label: "Completed", color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
  OVERDUE:   { label: "Overdue",   color: "#f87171", bg: "rgba(248,113,113,0.1)" },
};

const OBL_TYPE = {
  RENEWAL_NOTICE: "Renewal",
  PAYMENT:        "Payment",
  DELIVERABLE:    "Deliverable",
  COMPLIANCE:     "Compliance",
  EXPIRY:         "Expiry",
  OTHER:          "Other",
};

export default function UpcomingObligations({ obligations }) {
  const hasObligations = obligations && obligations.length > 0;
  
  const sorted = hasObligations ? [...obligations]
    .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0)) : [];

  return (
    <div
      className="fade-up delay-5"
      style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid var(--border)",
      }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-1)" }}>Upcoming Obligations</div>
          <div style={{ fontSize: "12px", color: "var(--subtle-fg)", marginTop: "2px" }}>Deadlines & deliverables</div>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "5px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500,
          color: "var(--muted-fg)", background: "var(--surface-xs)",
          border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.12s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-1)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted-fg)"; }}
        >
          <CalendarPlus size={13} />
          Sync All
        </button>
      </div>

      {!hasObligations ? (
        <div style={{ padding: "20px" }}>
          <EmptyState
            icon={Calendar}
            title="No upcoming obligations"
            description="You are all caught up on your deadlines."
          />
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Obligation</th>
                <th>Client</th>
                <th>Due</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Cal</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((obl) => {
                const st = STATUS[obl.status] || STATUS.PENDING;
                const typeLabel = OBL_TYPE[obl.obligation_type] || "Other";
                const isOverdue = obl.status === "OVERDUE";
                const docHref = obl.client_id && obl.project_id && obl.document_id
                  ? `/clients/${obl.client_id}/projects/${obl.project_id}/documents/${obl.document_id}`
                  : null;
                return (
                  <tr key={obl.id}>
                    <td>
                      {docHref ? (
                        <Link href={docHref} style={{ textDecoration: "none" }}>
                          <div style={{
                            fontSize: "13px", fontWeight: 500, color: "var(--text-2)",
                            display: "flex", alignItems: "center", gap: "4px",
                            transition: "color 0.12s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.color = "#c4b5fd"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--text-2)"}
                          >
                            {obl.title}
                            <ArrowUpRight size={11} style={{ opacity: 0.4, flexShrink: 0 }} />
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--subtle-fg)", marginTop: "2px" }}>
                            {obl.document_title || "Unknown Document"}
                          </div>
                        </Link>
                      ) : (
                        <>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-2)" }}>{obl.title}</div>
                          <div style={{ fontSize: "11px", color: "var(--subtle-fg)", marginTop: "2px" }}>{obl.document_title || "Unknown Document"}</div>
                        </>
                      )}
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--muted-fg)", whiteSpace: "nowrap" }}>{obl.client_name || "Unknown"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", fontWeight: isOverdue ? 600 : 400, color: isOverdue ? "#f87171" : "var(--text-3)" }}>
                        {formatDate(obl.due_date)}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: "inline-block", padding: "2px 7px", borderRadius: "4px",
                        fontSize: "11px", fontWeight: 500,
                        background: "var(--surface-sm)", color: "var(--muted-fg)",
                      }}>{typeLabel}</span>
                    </td>
                    <td>
                      <span className="risk-pill" style={{ background: st.bg, color: st.color }}>
                        <span className="risk-pill-dot" style={{ background: st.color }} />
                        {st.label}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {obl.is_synced_calendar
                        ? <CalendarCheck size={14} color="#34d399" />
                        : <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0, opacity: 0.25, transition: "opacity 0.12s" }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "0.25"}
                          >
                            <CalendarPlus size={14} color="var(--text-3)" />
                          </button>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}