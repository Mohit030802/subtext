"use client";

import { mockDashboardStats } from "@/lib/mock-data";

const BARS = [
  { key: "high",   label: "High Risk",   color: "#f87171", bg: "rgba(248,113,113,0.08)" },
  { key: "medium", label: "Medium Risk", color: "#fbbf24", bg: "rgba(251,191,36,0.08)"  },
  { key: "low",    label: "Low Risk",    color: "#34d399", bg: "rgba(52,211,153,0.08)"  },
];

export default function RiskDistribution() {
  const { riskDistribution } = mockDashboardStats;
  const total = riskDistribution.high + riskDistribution.medium + riskDistribution.low;

  return (
    <div
      className="fade-up delay-4"
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "10px", padding: "20px", height: "100%",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#e4e4e7" }}>Risk Breakdown</div>
      <div style={{ fontSize: "12px", color: "var(--subtle-fg)", marginTop: "2px", marginBottom: "24px" }}>
        {total} clauses analyzed
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {BARS.map(({ key, label, color, bg }) => {
          const count = riskDistribution[key];
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#a1a1aa" }}>{label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{count}</span>
                  <span style={{ fontSize: "11px", color: "var(--subtle-fg)", width: "30px", textAlign: "right" }}>{pct}%</span>
                </div>
              </div>
              {/* Track */}
              <div style={{ height: "4px", borderRadius: "99px", background: bg, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "99px", background: color,
                  width: `${pct}%`,
                  transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert box */}
      <div style={{
        marginTop: "24px", padding: "12px 14px", borderRadius: "7px",
        background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)",
      }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "#f87171", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
          Action Required
        </div>
        <div style={{ fontSize: "12px", color: "#a1a1aa", lineHeight: 1.5 }}>
          {riskDistribution.high} high-risk clauses require negotiation.
        </div>
      </div>
    </div>
  );
}