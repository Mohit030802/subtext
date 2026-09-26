"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, FileText, ChevronRight, AlertTriangle } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import DriveImportButton from "@/components/document/DriveImportButton";

const RISK_CONFIG = {
  HIGH:   { label: "High Risk",   color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  MEDIUM: { label: "Medium Risk", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  LOW:    { label: "Low Risk",    color: "#34d399", bg: "rgba(52,211,153,0.1)" },
};

const DOC_TYPE_COLORS = {
  NDA:    { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  MSA:    { color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  SOW:    { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  SLA:    { color: "#f472b6", bg: "rgba(244,114,182,0.1)" },
  HIRING: { color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
  OTHER:  { color: "#71717a", bg: "rgba(113,113,122,0.1)" },
};

function RiskPill({ level }) {
  const cfg = RISK_CONFIG[level];
  if (!cfg) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", borderRadius: "99px", fontSize: "10px", fontWeight: 600,
      background: cfg.bg, color: cfg.color
    }}>
      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export default function ProjectDetailsPageContent({ client, project, documents = [], hasError }) {
  if (hasError || !project || !client) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", paddingTop: "2rem" }}>
        <EmptyState
          icon={AlertTriangle}
          title="Project not found"
          description="Could not load project details."
        />
      </div>
    );
  }

  const docTypeCfg = (type) => DOC_TYPE_COLORS[type] || DOC_TYPE_COLORS.OTHER;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href={`/clients/${client.id}`} style={{
            width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "8px", border: "1px solid var(--border)",
            transition: "background 0.15s", color: "var(--subtle-fg)"
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--surface-sm)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--subtle-fg)", marginBottom: "4px" }}>
              <span>{client.name}</span>
              <ChevronRight size={12} />
              <span style={{ color: "var(--text-2)" }}>{project.name}</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--fg)" }}>{project.name}</h1>
            {project.description && (
              <p style={{ fontSize: "14px", color: "var(--subtle-fg)", marginTop: "4px" }}>{project.description}</p>
            )}
          </div>
        </div>
        <DriveImportButton projectId={project.id} />
      </div>

      {/* Documents */}
      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload your first contract to start AI analysis."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {documents.map((doc, i) => {
            const dtCfg = docTypeCfg(doc.doc_type);
            return (
              <Link
                key={doc.id}
                href={`/clients/${client.id}/projects/${project.id}/documents/${doc.id}`}
                className={`fade-up delay-${Math.min(i + 1, 6)}`}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "16px",
                  padding: "20px", borderRadius: "12px", border: "1px solid var(--border)",
                  background: "var(--card)", textDecoration: "none", position: "relative",
                  overflow: "hidden", transition: "border-color 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--border-hover)";
                  const chevron = e.currentTarget.querySelector(".chevron");
                  if (chevron) chevron.style.opacity = "0.4";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  const chevron = e.currentTarget.querySelector(".chevron");
                  if (chevron) chevron.style.opacity = "0";
                }}
              >
                {/* Left indicator by risk */}
                {doc.risk_score === "HIGH" && (
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "2px", background: "#f87171" }} />
                )}
                {doc.risk_score === "MEDIUM" && (
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "2px", background: "#fbbf24" }} />
                )}

                <div style={{
                  width: "40px", height: "40px", borderRadius: "8px",
                  background: dtCfg.bg, border: `1px solid ${dtCfg.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <FileText size={20} color={dtCfg.color} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div>
                      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--fg)", transition: "color 0.2s" }}>
                        {doc.title}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                        <span style={{
                          fontSize: "10px", fontFamily: "monospace", fontWeight: 600,
                          padding: "2px 6px", borderRadius: "4px",
                          background: dtCfg.bg, color: dtCfg.color
                        }}>{doc.doc_type || "OTHER"}</span>
                        {doc.page_count && (
                          <span style={{ fontSize: "10px", color: "var(--subtle-fg)" }}>{doc.page_count} pages</span>
                        )}
                        <span style={{ fontSize: "10px", color: "var(--subtle-fg)" }}>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                    {doc.risk_score && <RiskPill level={doc.risk_score} />}
                  </div>
                </div>

                <ChevronRight className="chevron" size={16} color="var(--subtle-fg)" style={{ opacity: 0, transition: "opacity 0.2s", marginTop: "12px", flexShrink: 0 }} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
