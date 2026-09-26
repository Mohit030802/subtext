"use client";

import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";
import { AlertTriangle, ArrowUpRight } from "lucide-react";

export default function RiskDistribution({ stats }) {
  if (!stats) {
    return (
      <div
        className="fade-up delay-4"
        style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "10px", padding: "20px", height: "100%",
          display: "flex", flexDirection: "column"
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-1)" }}>Risk Breakdown</div>
        <div style={{ fontSize: "12px", color: "var(--subtle-fg)", marginTop: "2px", marginBottom: "24px" }}>
          Loading...
        </div>
        <Skeleton height="150px" />
      </div>
    );
  }

  const highRiskCount = stats.high_risk_count || 0;
  const isRisky = highRiskCount > 0;

  return (
    <Link
      href="/clients"
      className="fade-up delay-4"
      style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div
        style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "10px", padding: "20px", height: "100%",
          display: "flex", flexDirection: "column",
          cursor: "pointer", transition: "border-color 0.15s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = isRisky ? "rgba(248,113,113,0.35)" : "rgba(52,211,153,0.35)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-1)" }}>Risk Snapshot</div>
            <div style={{ fontSize: "12px", color: "var(--subtle-fg)", marginTop: "2px", marginBottom: "24px" }}>
              Overall portfolio risk
            </div>
          </div>
          <ArrowUpRight size={14} color="var(--muted-fg)" style={{ flexShrink: 0, marginTop: "2px" }} />
        </div>

        {/* Circle indicator */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: isRisky ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px"
          }}>
            <AlertTriangle size={36} color={isRisky ? "#f87171" : "#34d399"} />
          </div>

          <div style={{ fontSize: "32px", fontWeight: 700, color: isRisky ? "#f87171" : "#34d399" }}>
            {highRiskCount}
          </div>
          <div style={{ fontSize: "13px", color: "var(--subtle-fg)", textAlign: "center" }}>
            high-risk clauses identified
          </div>
        </div>

        {/* Action banner */}
        {isRisky ? (
          <div style={{
            marginTop: "24px", padding: "12px 14px", borderRadius: "7px",
            background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)",
          }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#f87171", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
              Action Required
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-3)", lineHeight: 1.5 }}>
              {highRiskCount} high-risk clause{highRiskCount > 1 ? "s" : ""} require immediate review.
            </div>
          </div>
        ) : (
          <div style={{
            marginTop: "24px", padding: "12px 14px", borderRadius: "7px",
            background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)",
          }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#34d399", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
              All Clear
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-3)", lineHeight: 1.5 }}>
              No high-risk clauses found across your documents.
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}