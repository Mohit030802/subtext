"use client";

import { Eye } from "lucide-react";

const RISK = {
  HIGH:   { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.18)", left: "#f87171" },
  MEDIUM: { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.18)",  left: "#fbbf24" },
  LOW:    { color: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.18)",  left: "#34d399" },
};

export default function RisksTab({ clauseRisks, onScrollToClause }) {
  const sorted = [...clauseRisks].sort((a, b) => {
    const o = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (o[a.risk_level] ?? 9) - (o[b.risk_level] ?? 9);
  });

  if (!sorted.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
        <p style={{ fontSize: "13px", color: "var(--subtle-fg)" }}>No risk clauses detected</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {sorted.map((risk, i) => {
        const cfg = RISK[risk.risk_level] || RISK.LOW;
        return (
          <div
            key={risk.id}
            className="fade-up"
            style={{
              animationDelay: `${i * 0.05}s`,
              background: "var(--card)",
              border: `1px solid ${cfg.border}`,
              borderLeft: `3px solid ${cfg.left}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {/* Card Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderBottom: "1px solid var(--border)",
              background: cfg.bg,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="risk-pill" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                  <span className="risk-pill-dot" style={{ background: cfg.color }} />
                  {risk.risk_level}
                </span>
                <span style={{ fontSize: "11px", color: "var(--subtle-fg)" }}>Page {risk.page_number}</span>
              </div>
              <button
                onClick={() => onScrollToClause(risk.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  fontSize: "11px", fontWeight: 500, padding: "4px 9px", borderRadius: "5px",
                  background: "var(--surface-sm)", border: "1px solid var(--border)",
                  color: "var(--muted-fg)", cursor: "pointer", transition: "all 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--text-1)"; e.currentTarget.style.borderColor = "var(--border-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--muted-fg)"; e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                <Eye size={12} /> View in doc
              </button>
            </div>

            {/* Clause quote */}
            <div style={{ padding: "12px 14px 10px" }}>
              <blockquote style={{
                fontSize: "12px", lineHeight: 1.7, fontStyle: "italic",
                color: "var(--text-3)", borderLeft: `2px solid ${cfg.left}40`,
                paddingLeft: "12px", margin: 0,
              }}>
                "{risk.clause_text}"
              </blockquote>
            </div>

            {/* Explanation */}
            <div style={{ padding: "0 14px 12px" }}>
              <div style={{
                background: "var(--surface-xs)", borderRadius: "6px",
                padding: "10px 12px",
              }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--subtle-fg)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
                  Why this matters
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>
                  {risk.explanation}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}