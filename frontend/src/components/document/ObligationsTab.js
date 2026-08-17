"use client";

import { CalendarPlus, CalendarCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  const sorted = [...obligations].sort((a,b) => new Date(a.due_date||0)-new Date(b.due_date||0));

  if (!sorted.length)
    return <div style={{ padding: "32px", textAlign: "center", color: "var(--subtle-fg)", fontSize: "13px" }}>No obligations found</div>;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {sorted.map((obl, i) => {
        const st = STATUS[obl.status]||STATUS.PENDING;
        const party = PARTY[obl.party_responsible]||PARTY.THIRD_PARTY;
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
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#d4d4d8", marginBottom: "3px" }}>{obl.title}</div>
                {obl.description && (
                  <div style={{ fontSize: "11px", color: "var(--subtle-fg)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {obl.description}
                  </div>
                )}
              </div>
              <button>
                {obl.is_synced_calendar
                  ? <CalendarCheck size={15} color="#34d399" />
                  : <CalendarPlus size={15} color="#52525b" style={{ transition: "color 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.color="#a1a1aa"}
                      onMouseLeave={e => e.currentTarget.style.color="#52525b"}
                    />
                }
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: obl.status==="OVERDUE"?600:400, color: obl.status==="OVERDUE"?"#f87171":"#71717a" }}>
                📅 {formatDate(obl.due_date)}
              </span>
              <span style={{ color: "var(--subtle-fg)" }}>·</span>
              <span style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "4px", background: "rgba(255,255,255,0.04)", color: "var(--muted-fg)" }}>
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
