"use client";

import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";
import { ArrowUpRight } from "lucide-react";

export default function RiskDistribution({ stats, documents = [] }) {
  if (!stats) {
    return (
      <div
        className="fade-up delay-3"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "18px 20px",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-1)", marginBottom: "14px" }}>
          Risk Exposure
        </div>
        <Skeleton height="90px" />
      </div>
    );
  }

  const highCount = stats.high_risk_count || 0;
  const recentHigh = documents.filter((d) => d.risk_score === "HIGH").length;
  const recentMed = documents.filter((d) => d.risk_score === "MEDIUM").length;
  const recentLow = documents.filter((d) => d.risk_score === "LOW" || !d.risk_score).length;
  const totalBar = recentHigh + recentMed + recentLow || 1;

  const highPct = Math.round((recentHigh / totalBar) * 100);
  const medPct = Math.round((recentMed / totalBar) * 100);
  const lowPct = Math.max(0, 100 - highPct - medPct);

  const isRisky = highCount > 0;

  return (
    <Link href="/clients" className="fade-up delay-3" style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "18px 20px",
          transition: "border-color 0.15s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-1)" }}>Risk Exposure</div>
          <ArrowUpRight size={14} color="var(--muted-fg)" />
        </div>

        {/* Segmented horizontal bar */}
        <div
          style={{
            height: "8px",
            borderRadius: "99px",
            overflow: "hidden",
            display: "flex",
            gap: "2px",
            background: "var(--surface-sm)",
            marginBottom: "14px",
          }}
        >
          {highPct > 0 && <div style={{ width: `${highPct}%`, background: "var(--red)" }} />}
          {medPct > 0 && <div style={{ width: `${medPct}%`, background: "var(--amber)" }} />}
          {lowPct > 0 && <div style={{ width: `${lowPct}%`, background: "var(--green)" }} />}
        </div>

        {/* Tabular legend */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "var(--text-2)",
            marginBottom: "16px",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--red)" }} />
            <strong className="font-mono">{recentHigh}</strong> High
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--amber)" }} />
            <strong className="font-mono">{recentMed}</strong> Medium
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)" }} />
            <strong className="font-mono">{recentLow}</strong> Low
          </span>
        </div>

        {/* Concise Editorial Verdict Box */}
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "6px",
            background: isRisky ? "var(--red-dim)" : "var(--green-dim)",
            border: `1px solid ${isRisky ? "var(--red-border)" : "var(--green-border)"}`,
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isRisky ? "var(--red)" : "var(--green)",
              marginBottom: "3px",
            }}
          >
            {isRisky ? "Counsel Review Needed" : "Portfolio Clear"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.45 }}>
            {isRisky
              ? `${highCount} high-risk clause${highCount > 1 ? "s" : ""} flagged across your agreements.`
              : "No high-risk clauses currently flagged across your portfolio."}
          </div>
        </div>
      </div>
    </Link>
  );
}
