import StatsCards from "@/components/dashboard/StatsCards";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import RiskDistribution from "@/components/dashboard/RiskDistribution";
import UpcomingObligations from "@/components/dashboard/UpcomingObligations";

export default function DashboardPage() {
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
      <StatsCards />

      {/* Middle row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "12px", marginTop: "12px" }}>
        <RecentDocuments />
        <RiskDistribution />
      </div>

      {/* Obligations */}
      <div style={{ marginTop: "12px" }}>
        <UpcomingObligations />
      </div>
    </div>
  );
}
