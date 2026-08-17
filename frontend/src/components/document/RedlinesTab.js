"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const RISK = {
  HIGH:   { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.18)" },
  MEDIUM: { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.18)"  },
  LOW:    { color: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.18)"  },
};

function Card({ risk, index }) {
  const [copied, setCopied] = useState(false);
  const cfg = RISK[risk.risk_level]||RISK.LOW;

  if (!risk.suggested_redline) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(risk.suggested_redline);
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  return (
    <div
      className="fade-up"
      style={{
        animationDelay: `${index * 0.06}s`,
        background: "var(--card)", border: `1px solid var(--border)`,
        borderRadius: "8px", overflow: "hidden",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="risk-pill" style={{ background: cfg.bg, color: cfg.color }}><span className="risk-pill-dot" style={{ background: cfg.color }}/>{risk.risk_level}</span>
          <span style={{ fontSize: "11px", color: "var(--subtle-fg)" }}>p.{risk.page_number}</span>
        </div>
        <button
          onClick={copy}
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            fontSize: "11px", fontWeight: 500, padding: "4px 9px", borderRadius: "5px",
            background: copied ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${copied ? "rgba(52,211,153,0.25)" : "var(--border)"}`,
            color: copied ? "#34d399" : "var(--muted-fg)", cursor: "pointer", transition: "all 0.15s",
          }}
        >
          {copied ? <Check size={12}/> : <Copy size={12}/>}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div style={{ padding: "14px" }}>
        {/* Original */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#f87171", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Original</div>
          <div style={{
            fontSize: "12px", lineHeight: 1.7, padding: "10px 12px", borderRadius: "6px",
            background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.12)",
            color: "#a1a1aa", textDecoration: "line-through", fontStyle: "italic",
          }}>
            {risk.clause_text}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "18px", color: "var(--subtle-fg)" }}>↓</span>
        </div>

        {/* Redline */}
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#34d399", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Suggested Redline</div>
          <div style={{
            fontSize: "12px", lineHeight: 1.7, padding: "10px 12px", borderRadius: "6px",
            background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)",
            color: "#d4d4d8",
          }}>
            {risk.suggested_redline}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RedlinesTab({ clauseRisks }) {
  const redlines = clauseRisks.filter(r => r.suggested_redline);
  if (!redlines.length)
    return <div style={{ padding:"32px", textAlign:"center", color:"var(--subtle-fg)", fontSize:"13px" }}>No redlines suggested</div>;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {redlines.map((r, i) => <Card key={r.id} risk={r} index={i} />)}
    </div>
  );
}
