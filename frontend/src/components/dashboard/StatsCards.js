"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, AlertTriangle, Calendar, Users } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";

function useCounter(target, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target === 0 || target === undefined || target === null) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setV(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return v;
}

const CARDS_CONFIG = [
  {
    key: "total_documents",
    label: "Documents",
    sublabel: "Total analyzed",
    icon: FileText,
    accent: "#7c3aed",
    accentBg: "rgba(124,58,237,0.1)",
    href: "/clients",
  },
  {
    key: "high_risk_count",
    label: "High-Risk Clauses",
    sublabel: "Need review",
    icon: AlertTriangle,
    accent: "#f87171",
    accentBg: "rgba(248,113,113,0.1)",
    href: "/clients",
  },
  {
    key: "upcoming_obligations_count",
    label: "Upcoming Deadlines",
    sublabel: "Next 90 days",
    icon: Calendar,
    accent: "#fbbf24",
    accentBg: "rgba(251,191,36,0.1)",
    href: "/clients",
  },
  {
    key: "total_clients",
    label: "Active Clients",
    sublabel: "Under management",
    icon: Users,
    accent: "#34d399",
    accentBg: "rgba(52,211,153,0.1)",
    href: "/clients",
  },
];

function StatCard({ card, stats, delay }) {
  const targetValue = stats ? stats[card.key] || 0 : 0;
  const val = useCounter(targetValue);
  const Icon = card.icon;

  return (
    <Link
      href={card.href}
      className={`fade-up delay-${delay}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "20px",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${card.accent}50`;
          e.currentTarget.style.background = `color-mix(in srgb, var(--card) 95%, ${card.accent})`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "var(--card)";
        }}
      >
        {/* Subtle top accent line */}
        <div style={{
          position: "absolute", top: 0, left: "20px", right: "20px", height: "1px",
          background: `linear-gradient(90deg, transparent, ${card.accent}40, transparent)`,
        }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            {stats ? (
              <div style={{
                fontSize: "36px", fontWeight: 800, color: "var(--fg)",
                letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums",
              }}>
                {val}
              </div>
            ) : (
              <Skeleton width="60px" height="36px" />
            )}
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-3)", marginTop: "6px" }}>
              {card.label}
            </div>
            <div style={{ fontSize: "11px", color: "var(--subtle-fg)", marginTop: "3px" }}>
              {card.sublabel}
            </div>
          </div>
          <div style={{
            width: "36px", height: "36px", borderRadius: "8px",
            background: card.accentBg, border: `1px solid ${card.accent}25`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={16} color={card.accent} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function StatsCards({ stats }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
      {CARDS_CONFIG.map((card, i) => (
        <StatCard key={card.key} card={card} stats={stats} delay={i + 1} />
      ))}
    </div>
  );
}