"use client";

import Link from "next/link";
import { mockClients } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Plus, Building2, ChevronRight, FileText, AlertTriangle } from "lucide-react";

const INDUSTRY_COLORS = {
  Healthcare:   { color: "#60a5fa", bg: "rgba(96,165,250,0.1)"   },
  Finance:      { color: "#34d399", bg: "rgba(52,211,153,0.1)"   },
  Technology:   { color: "#a78bfa", bg: "rgba(167,139,250,0.1)"  },
  "Real Estate":{ color: "#fbbf24", bg: "rgba(251,191,36,0.1)"   },
  Other:        { color: "#71717a", bg: "rgba(113,113,122,0.1)"  },
};

export default function ClientsPage() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div className="fade-up" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fafafa", letterSpacing: "-0.03em" }}>
            Clients
          </h1>
          <p style={{ fontSize: "13px", color: "var(--subtle-fg)", marginTop: "6px" }}>
            {mockClients.length} active clients in your portfolio
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={14} /> New Client
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
        {mockClients.map((client, i) => {
          const ind = INDUSTRY_COLORS[client.industry] || INDUSTRY_COLORS.Other;
          return (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className={`fade-up delay-${Math.min(i+1,6)}`}
              style={{
                display: "block", textDecoration: "none",
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "10px", padding: "20px",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.background = "var(--card-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)";       e.currentTarget.style.background = "var(--card)";       }}
            >
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "8px",
                    background: ind.bg, border: `1px solid ${ind.color}25`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Building2 size={16} color={ind.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#e4e4e7", lineHeight: 1.3 }}>{client.name}</div>
                    <span style={{
                      display: "inline-block", marginTop: "4px",
                      fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "4px",
                      background: ind.bg, color: ind.color,
                    }}>{client.industry}</span>
                  </div>
                </div>
                <ChevronRight size={15} color="var(--subtle-fg)" />
              </div>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                {[
                  { value: client.project_count, label: "Projects", color: null },
                  { value: client.document_count, label: "Docs",     color: null },
                  { value: client.high_risk_count, label: "High Risk", color: "#f87171" },
                ].map(({ value, label, color }) => (
                  <div key={label} style={{
                    padding: "10px 8px", borderRadius: "6px", textAlign: "center",
                    background: color ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${color ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.04)"}`,
                  }}>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: color || "#fafafa", fontVariantNumeric: "tabular-nums" }}>{value}</div>
                    <div style={{ fontSize: "10px", color: color ? "#f87171" + "80" : "var(--subtle-fg)", marginTop: "2px" }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: "11px", color: "var(--subtle-fg)", marginTop: "12px" }}>
                Since {formatDate(client.created_at)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
