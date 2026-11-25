import Link from "next/link";
import { api } from "@/lib/api";
import StatsCards from "@/components/dashboard/StatsCards";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import RiskDistribution from "@/components/dashboard/RiskDistribution";
import UpcomingObligations from "@/components/dashboard/UpcomingObligations";
import EmptyState from "@/components/ui/EmptyState";
import { AlertCircle, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let stats, recentDocs, obligations;
  let hasError = false;

  try {
    const [statsRes, recentRes, obligationsRes] = await Promise.all([
      api.get("/dashboard/stats"),
      api.get("/dashboard/recent"),
      api.get("/dashboard/obligations"),
    ]);
    stats = statsRes;
    recentDocs = recentRes;
    obligations = obligationsRes;
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    hasError = true;
  }

  if (hasError) {
    return (
      <div style={{ maxWidth: "1240px", margin: "0 auto", paddingTop: "2rem" }}>
        <EmptyState
          icon={AlertCircle}
          title="Could not load dashboard"
          description="We had trouble connecting to the server. Please try again later."
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
      {/* Editorial Legal Header */}
      <div
        className="fade-up"
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <div>
          <h1
            className="font-serif-editorial"
            style={{
              fontSize: "28px",
              fontWeight: 400,
              color: "var(--fg)",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Portfolio Overview
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted-fg)", marginTop: "6px" }}>
            Real-time risk intelligence across your active client agreements.
          </p>
        </div>

        <Link href="/clients" className="btn btn-primary" style={{ textDecoration: "none" }}>
          <Plus size={14} />
          <span>Manage Clients</span>
        </Link>
      </div>

      {/* Hairline-Divided Editorial KPI Strip */}
      <StatsCards stats={stats} />

      {/* 2-Column Editorial Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.75fr) minmax(300px, 1fr)",
          gap: "20px",
          marginTop: "24px",
          alignItems: "start",
        }}
      >
        <RecentDocuments documents={recentDocs} />
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <RiskDistribution stats={stats} documents={recentDocs} />
          <UpcomingObligations obligations={obligations} />
        </div>
      </div>
    </div>
  );
}
