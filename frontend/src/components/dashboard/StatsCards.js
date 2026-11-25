"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";

function useCounter(target, duration = 700) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!target) return;
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
  return target ? v : 0;
}

const METRICS = [
  {
    key: "total_documents",
    label: "Documents Analyzed",
    sublabel: "Total in portfolio",
    color: "var(--fg)",
    href: "/clients",
  },
  {
    key: "high_risk_count",
    label: "High-Risk Clauses",
    sublabel: "Requires counsel review",
    color: "var(--red)",
    href: "/clients",
  },
  {
    key: "upcoming_obligations_count",
    label: "Upcoming Deadlines",
    sublabel: "Next 90 days",
    color: "var(--amber)",
    href: "/clients",
  },
  {
    key: "total_clients",
    label: "Active Clients",
    sublabel: "Under management",
    color: "var(--fg)",
    href: "/clients",
  },
];

function MetricColumn({ metric, stats, isLast }) {
  const val = useCounter(stats ? stats[metric.key] || 0 : 0);

  return (
    <Link
      href={metric.href}
      style={{
        textDecoration: "none",
        display: "block",
        padding: "4px 20px",
        paddingLeft: metric.key === "total_documents" ? "0px" : "22px",
        borderRight: isLast ? "none" : "1px solid var(--border)",
        transition: "opacity 0.12s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.78"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
    >
      <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--muted-fg)", marginBottom: "8px" }}>
        {metric.label}
      </div>
      {stats ? (
        <div
          className="font-serif-editorial"
          style={{
            fontSize: "34px",
            fontWeight: 400,
            color: metric.color,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {val}
        </div>
      ) : (
        <Skeleton width="52px" height="34px" />
      )}
      <div style={{ fontSize: "11.5px", color: "var(--subtle-fg)", marginTop: "8px" }}>
        {metric.sublabel}
      </div>
    </Link>
  );
}

export default function StatsCards({ stats }) {
  return (
    <div
      className="fade-up delay-1"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "18px 0",
      }}
    >
      {METRICS.map((m, i) => (
        <MetricColumn
          key={m.key}
          metric={m}
          stats={stats}
          isLast={i === METRICS.length - 1}
        />
      ))}
    </div>
  );
}
