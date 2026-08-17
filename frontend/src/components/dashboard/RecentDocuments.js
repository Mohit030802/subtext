"use client";

import Link from "next/link";
import { mockRecentDocuments } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

const RISK = {
  HIGH:   { color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  MEDIUM: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  LOW:    { color: "#34d399", bg: "rgba(52,211,153,0.1)" },
};

const DOC_TYPE = {
  NDA:    { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  MSA:    { color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  SOW:    { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  SLA:    { color: "#f472b6", bg: "rgba(244,114,182,0.1)" },
  HIRING: { color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
  OTHER:  { color: "#71717a", bg: "rgba(113,113,122,0.1)" },
};

export default function RecentDocuments() {
  return (
    <div
      className="fade-up delay-3"
      style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid var(--border)",
      }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#e4e4e7" }}>Recent Documents</div>
          <div style={{ fontSize: "12px", color: "var(--subtle-fg)", marginTop: "2px" }}>Last analyzed contracts</div>
        </div>
        <Link href="/clients" style={{
          display: "flex", alignItems: "center", gap: "4px",
          fontSize: "12px", fontWeight: 500, color: "#a78bfa",
          textDecoration: "none", transition: "color 0.12s",
        }}>
          View all <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Client</th>
            <th>Type</th>
            <th>Risk</th>
            <th>Added</th>
          </tr>
        </thead>
        <tbody>
          {mockRecentDocuments.map((doc) => {
            const riskCfg = RISK[doc.risk_score];
            const typeCfg = DOC_TYPE[doc.doc_type] || DOC_TYPE.OTHER;
            const href = `/clients/${doc.client_id}/projects/${doc.project_id}/documents/${doc.id}`;
            return (
              <tr key={doc.id}>
                <td>
                  <Link href={href} style={{
                    fontSize: "13px", fontWeight: 500, color: "#d4d4d8",
                    textDecoration: "none", display: "flex", alignItems: "center", gap: "6px",
                    transition: "color 0.12s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = "#c4b5fd"}
                    onMouseLeave={e => e.currentTarget.style.color = "#d4d4d8"}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px" }}>
                      {doc.title}
                    </span>
                    <ArrowUpRight size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
                  </Link>
                </td>
                <td style={{ fontSize: "12px", color: "var(--muted-fg)" }}>{doc.client_name}</td>
                <td>
                  <span className="tag" style={{ background: typeCfg.bg, color: typeCfg.color }}>{doc.doc_type}</span>
                </td>
                <td>
                  {riskCfg && (
                    <span className="risk-pill" style={{ background: riskCfg.bg, color: riskCfg.color }}>
                      <span className="risk-pill-dot" style={{ background: riskCfg.color }} />
                      {doc.risk_score}
                    </span>
                  )}
                </td>
                <td style={{ fontSize: "12px", color: "var(--subtle-fg)", whiteSpace: "nowrap" }}>
                  {formatDate(doc.created_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}