import { api } from "@/lib/api";
import StatsCards from "@/components/dashboard/StatsCards";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import RiskDistribution from "@/components/dashboard/RiskDistribution";
import UpcomingObligations from "@/components/dashboard/UpcomingObligations";
import EmptyState from "@/components/ui/EmptyState";
import { AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  let stats, recentDocs, obligations;
  let hasError = false;

  try {
    const [statsRes, recentRes, obligationsRes] = await Promise.all([
      api.get("/dashboard/stats"),
      api.get("/dashboard/recent"),
      api.get("/dashboard/obligations")
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
      <div style={{ maxWidth: "1280px", margin: "0 auto", paddingTop: "2rem" }}>
        <EmptyState
          icon={AlertCircle}
          title="Could not load dashboard"
          description="We had trouble connecting to the server. Please try again later."
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Page header */}
      <div className="fade-up" style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fafafa", letterSpacing: "-0.03em", lineHeight: 1 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "var(--subtle-fg)", marginTop: "6px" }}>
          Overview of your contract portfolio
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Middle row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "12px", marginTop: "12px" }}>
        <RecentDocuments documents={recentDocs} />
        <RiskDistribution stats={stats} />
      </div>

      {/* Obligations */}
      <div style={{ marginTop: "12px" }}>
        <UpcomingObligations obligations={obligations} />
      </div>
    </div>
  );
}
