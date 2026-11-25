"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowUpRight, FileText } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

const RISK = {
  HIGH:   { label: "High Risk",   color: "var(--red)",   bg: "var(--red-dim)",   border: "var(--red-border)"   },
  MEDIUM: { label: "Medium",      color: "var(--amber)", bg: "var(--amber-dim)", border: "var(--amber-border)" },
  LOW:    { label: "Low Risk",    color: "var(--green)", bg: "var(--green-dim)", border: "var(--green-border)" },
};

export default function RecentDocuments({ documents }) {
  const hasDocuments = documents && documents.length > 0;

  return (
    <div
      className="fade-up delay-2"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-1)" }}>
            Recent Contracts
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted-fg)", marginTop: "2px" }}>
            Latest analyzed documents across your portfolio
          </div>
        </div>
        <Link
          href="/clients"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--primary)",
            textDecoration: "none",
          }}
        >
          View all <ArrowUpRight size={13} />
        </Link>
      </div>

      {!hasDocuments ? (
        <div style={{ padding: "24px" }}>
          <EmptyState
            icon={FileText}
            title="No contracts analyzed yet"
            description="Import contracts into a client project from Google Drive to see them here."
          />
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Client</th>
                <th>Type</th>
                <th>Risk</th>
                <th style={{ textAlign: "right" }}>Added</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const riskCfg = RISK[doc.risk_score] || RISK.LOW;
                const href =
                  doc.client_id && doc.project_id
                    ? `/clients/${doc.client_id}/projects/${doc.project_id}/documents/${doc.id}`
                    : "#";

                return (
                  <tr key={doc.id}>
                    <td>
                      <Link
                        href={href}
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--fg)",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "color 0.12s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg)"; }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "240px",
                          }}
                        >
                          {doc.title}
                        </span>
                        {href !== "#" && <ArrowUpRight size={12} style={{ opacity: 0.4, flexShrink: 0 }} />}
                      </Link>
                    </td>
                    <td style={{ fontSize: "12.5px", color: "var(--muted-fg)", whiteSpace: "nowrap" }}>
                      {doc.client_name || "Unknown"}
                    </td>
                    <td>
                      <span
                        className="tag"
                        style={{
                          background: "var(--surface-xs)",
                          border: "1px solid var(--border)",
                          color: "var(--text-2)",
                        }}
                      >
                        {doc.doc_type || "OTHER"}
                      </span>
                    </td>
                    <td>
                      <span
                        className="risk-pill"
                        style={{
                          background: riskCfg.bg,
                          color: riskCfg.color,
                          border: `1px solid ${riskCfg.border}`,
                        }}
                      >
                        <span className="risk-pill-dot" style={{ background: riskCfg.color }} />
                        {riskCfg.label}
                      </span>
                    </td>
                    <td
                      className="font-mono"
                      style={{
                        fontSize: "12px",
                        color: "var(--muted-fg)",
                        whiteSpace: "nowrap",
                        textAlign: "right",
                      }}
                    >
                      {formatDate(doc.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
