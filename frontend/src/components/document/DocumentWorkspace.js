"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  ArrowLeftRight,
  MessageSquare,
  ChevronLeft,
  FileText,
  ExternalLink,
  Copy,
  Check,
  X,
  BookOpen,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import ObligationsTab from "./ObligationsTab";
import RedlinesTab from "./RedlinesTab";
import VaultChat from "./VaultChat";
import ProcessDocumentPanel from "./ProcessDocumentPanel";
import DriveImportButton from "./DriveImportButton";
import SyncObligationsModal from "./SyncObligationsModal";
import PdfCanvasViewer from "./PdfCanvasViewer";

const TABS = [
  { id: "brief",       label: "Executive Brief", icon: BookOpen       },
  { id: "obligations", label: "Obligations",     icon: Clock          },
  { id: "redlines",    label: "Redlines",        icon: ArrowLeftRight },
  { id: "chat",        label: "Ask Vault",       icon: MessageSquare  },
];

const RISK_COLORS = {
  HIGH:   { label: "High Risk",   verdict: "Negotiation Required", color: "var(--red)",   bg: "var(--red-dim)",   border: "var(--red-border)"   },
  MEDIUM: { label: "Medium Risk", verdict: "Review Recommended",   color: "var(--amber)", bg: "var(--amber-dim)", border: "var(--amber-border)" },
  LOW:    { label: "Low Risk",    verdict: "Standard Terms",       color: "var(--green)", bg: "var(--green-dim)", border: "var(--green-border)" },
};

export default function DocumentWorkspace({ document: doc, versions = [], clientId, projectId }) {
  const [activeTab, setActiveTab] = useState("brief");
  const [pdfOpen, setPdfOpen] = useState(false);
  const [hasOpenedPdf, setHasOpenedPdf] = useState(false);
  const [activeRisk, setActiveRisk] = useState(null);
  const [targetPage, setTargetPage] = useState(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [viewerMode, setViewerMode] = useState("native");
  const [copiedId, setCopiedId] = useState(null);

  const [syncedObligationIds, setSyncedObligationIds] = useState([]);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);

  const clauseRisks = doc.clause_risks || [];
  const sortedRisks = [...clauseRisks].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (order[a.risk_level] ?? 3) - (order[b.risk_level] ?? 3);
  });

  const currentObligations = (doc.obligations || []).map((o) =>
    syncedObligationIds.includes(o.id) ? { ...o, is_synced_calendar: true } : o
  );

  const highCount = clauseRisks.filter((r) => r.risk_level === "HIGH").length;
  const medCount = clauseRisks.filter((r) => r.risk_level === "MEDIUM").length;
  const lowCount = clauseRisks.filter((r) => r.risk_level === "LOW").length;

  const riskCfg = doc.risk_score ? RISK_COLORS[doc.risk_score] : RISK_COLORS.LOW;
  const chatMessages = doc.chat_messages || [];

  const inspectInPdf = (risk = null) => {
    setActiveRisk(risk ? { ...risk } : null);
    setViewerMode("native");
    if (risk?.page_number) {
      setTargetPage(risk.page_number);
      setIframeKey((k) => k + 1);
    }
    setHasOpenedPdf(true);
    setPdfOpen(true);
  };

  const handleCopyRewrite = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && pdfOpen) setPdfOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pdfOpen]);

  useEffect(() => {
    if (doc.status === "ANALYZED" && (doc.obligations || []).some((o) => o.due_date && !o.is_synced_calendar)) {
      const prompted = typeof window !== "undefined" ? sessionStorage.getItem(`subtext_sync_prompted_${doc.id}`) : "true";
      if (!prompted) {
        Promise.resolve().then(() => setShowSyncPrompt(true));
      }
    }
  }, [doc.status, doc.id, doc.obligations]);

  const handleDismissPrompt = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`subtext_sync_prompted_${doc.id}`, "true");
    }
    setShowSyncPrompt(false);
  };

  const handleSyncComplete = (syncedIds) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`subtext_sync_prompted_${doc.id}`, "true");
    }
    setSyncedObligationIds((prev) => [...new Set([...prev, ...syncedIds])]);
  };

  const summaryObj =
    doc.summary && typeof doc.summary === "object" && !Array.isArray(doc.summary)
      ? doc.summary
      : null;

  const summaryOverview =
    typeof doc.summary === "string" && doc.summary.trim()
      ? doc.summary
      : typeof summaryObj?.overview === "string" && summaryObj.overview.trim()
      ? summaryObj.overview
      : clauseRisks.length > 0
      ? `Subtext analyzed this ${doc.doc_type || "contract"} and identified ${clauseRisks.length} notable clause${clauseRisks.length > 1 ? "s" : ""}: ${highCount} high-risk, ${medCount} medium-risk, and ${lowCount} low-risk. Review the flagged items on the right and inspect any clause directly in the source PDF.`
      : "No material risks were flagged in this agreement. You can still inspect the source document or ask Vault Chat any specific questions.";

  const summaryParties = Array.isArray(summaryObj?.parties)
    ? summaryObj.parties.filter(Boolean)
    : typeof summaryObj?.parties === "string" && summaryObj.parties.trim()
    ? [summaryObj.parties]
    : [];

  const summaryKeyPoints = Array.isArray(summaryObj?.key_points)
    ? summaryObj.key_points.filter(Boolean)
    : [];

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "48px" }}>
      {/* ── Top Utility Strip ── */}
      <div
        className="fade-up"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href={`/clients/${clientId}/projects/${projectId}`}
            className="btn btn-secondary"
            style={{ textDecoration: "none", padding: "5px 10px", fontSize: "12px" }}
          >
            <ChevronLeft size={13} />
            <span>Back to Project</span>
          </Link>

          {versions.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {versions.map((version) => {
                const active = version.version_number === doc.version_number;
                const href = version.is_latest
                  ? `/clients/${clientId}/projects/${projectId}/documents/${doc.document_family_id}`
                  : `/clients/${clientId}/projects/${projectId}/documents/${doc.document_family_id}?version=${version.version_number}`;
                return (
                  <Link
                    key={version.id}
                    href={href}
                    className="font-mono"
                    style={{
                      padding: "4px 9px",
                      borderRadius: "5px",
                      textDecoration: "none",
                      fontSize: "11px",
                      fontWeight: active ? 600 : 500,
                      color: active ? "var(--primary)" : "var(--muted-fg)",
                      background: active ? "var(--primary-dim)" : "var(--card)",
                      border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                    }}
                  >
                    v{version.version_number}
                    {version.is_latest ? " · Latest" : ""}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <DriveImportButton projectId={projectId} clientId={clientId} documentId={doc.id} />
          <button
            type="button"
            onClick={() => inspectInPdf(activeRisk)}
            className="btn btn-primary"
          >
            <FileText size={13} />
            <span>Open PDF Viewer</span>
          </button>
        </div>
      </div>

      {/* ── Not Yet Analyzed State ── */}
      {doc.status !== "ANALYZED" ? (
        <div
          className="fade-up"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            minHeight: "460px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ProcessDocumentPanel documentId={doc.id} initialStatus={doc.status || "PENDING"} />
        </div>
      ) : (
        <>
          {/* ── Dossier Hero ── */}
          <div
            className="fade-up delay-1"
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "20px",
              paddingBottom: "22px",
              borderBottom: "1px solid var(--border)",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--primary)",
                  marginBottom: "6px",
                }}
              >
                Contract Intelligence Dossier
              </div>
              <h1
                className="font-serif-editorial"
                style={{
                  fontSize: "28px",
                  fontWeight: 400,
                  color: "var(--fg)",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {doc.title}
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12.5px",
                  color: "var(--muted-fg)",
                  marginTop: "8px",
                  flexWrap: "wrap",
                }}
              >
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
                <span>·</span>
                <span className="font-mono">Version {doc.version_number || 1}</span>
                <span>·</span>
                <span>Added {formatDate(doc.created_at)}</span>
              </div>
            </div>

            {/* Overall Risk Verdict */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "11px", color: "var(--muted-fg)", marginBottom: "2px" }}>
                Overall Risk Assessment
              </div>
              <div
                className="font-serif-editorial"
                style={{ fontSize: "22px", color: riskCfg.color, lineHeight: 1.15 }}
              >
                {riskCfg.verdict}
              </div>
            </div>
          </div>

          {/* ── Clean Hairline Sub-Tabs ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              borderBottom: "1px solid var(--border)",
              marginBottom: "24px",
              overflowX: "auto",
            }}
            className="no-scrollbar"
          >
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "10px 0",
                    fontSize: "13px",
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--primary)" : "var(--muted-fg)",
                    background: "transparent",
                    border: "none",
                    borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "color 0.12s ease",
                    fontFamily: "inherit",
                  }}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                  {id === "brief" && highCount > 0 && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "99px",
                        background: "var(--red-dim)",
                        color: "var(--red)",
                        border: "1px solid var(--red-border)",
                      }}
                    >
                      {highCount} High
                    </span>
                  )}
                  {id === "obligations" && currentObligations.length > 0 && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "10.5px",
                        padding: "1px 6px",
                        borderRadius: "99px",
                        background: "var(--surface-sm)",
                        color: "var(--text-2)",
                      }}
                    >
                      {currentObligations.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── TAB 1: EXECUTIVE BRIEF (2-Column Editorial Dossier) ── */}
          {activeTab === "brief" && (
            <div
              className="fade-up"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(280px, 1fr) minmax(0, 1.55fr)",
                gap: "28px",
                alignItems: "start",
              }}
            >
              {/* Left Column: Summary + Extracted Facts */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--muted-fg)",
                      marginBottom: "8px",
                    }}
                  >
                    Plain-English Summary
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13.5px",
                      color: "var(--text-2)",
                      lineHeight: 1.7,
                    }}
                  >
                    {summaryOverview}
                  </p>

                  {summaryKeyPoints.length > 0 && (
                    <div style={{ marginTop: "16px" }}>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--muted-fg)",
                          marginBottom: "8px",
                        }}
                      >
                        Key Takeaways
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          fontSize: "12.5px",
                          color: "var(--text-2)",
                          lineHeight: 1.55,
                        }}
                      >
                        {summaryKeyPoints.map((pt, idx) => (
                          <li key={idx}>
                            {typeof pt === "string" ? pt : JSON.stringify(pt)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Extracted Contract Facts Ledger */}
                <div
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "16px 18px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--muted-fg)",
                      marginBottom: "10px",
                    }}
                  >
                    Document Snapshot
                  </div>
                  {[
                    ...(summaryParties.length > 0
                      ? [{ k: "Parties", v: summaryParties.map((p) => (typeof p === "string" ? p : p?.name || JSON.stringify(p))).join(" · ") }]
                      : []),
                    { k: "Contract Type", v: doc.doc_type || "OTHER" },
                    { k: "High-Risk Flags", v: String(highCount), danger: highCount > 0 },
                    { k: "Medium-Risk Flags", v: String(medCount) },
                    { k: "Low-Risk Notes", v: String(lowCount) },
                    { k: "Tracked Obligations", v: String(currentObligations.length) },
                  ].map((row, idx, arr) => (
                    <div
                      key={row.k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 0",
                        borderBottom: idx < arr.length - 1 ? "1px solid var(--border)" : "none",
                        fontSize: "12.5px",
                      }}
                    >
                      <span style={{ color: "var(--muted-fg)" }}>{row.k}</span>
                      <span
                        className="font-mono"
                        style={{
                          fontWeight: 600,
                          color: row.danger ? "var(--red)" : "var(--fg)",
                        }}
                      >
                        {row.v}
                      </span>
                    </div>
                  ))}

                  {doc.google_drive_file_id && (
                    <a
                      href={
                        doc.google_drive_view_url ||
                        `https://drive.google.com/file/d/${doc.google_drive_file_id}/view`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "12px",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--primary)",
                        textDecoration: "none",
                      }}
                    >
                      Open original in Google Drive <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              {/* Right Column: Flagged Clauses & Inline Redlines */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--muted-fg)",
                    }}
                  >
                    Flagged Clauses &amp; Recommended Redlines ({sortedRisks.length})
                  </span>
                </div>

                {sortedRisks.length === 0 ? (
                  <div
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "32px 24px",
                      textAlign: "center",
                      color: "var(--muted-fg)",
                      fontSize: "13px",
                    }}
                  >
                    No risky clauses identified in this document.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {sortedRisks.map((risk) => {
                      const cfg = RISK_COLORS[risk.risk_level] || RISK_COLORS.LOW;
                      const isCopied = copiedId === risk.id;

                      return (
                        <div
                          key={risk.id}
                          style={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderLeft: `3px solid ${cfg.color}`,
                            borderRadius: "8px",
                            padding: "16px 18px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "12px",
                              marginBottom: "10px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                className="risk-pill"
                                style={{
                                  background: cfg.bg,
                                  color: cfg.color,
                                  border: `1px solid ${cfg.border}`,
                                }}
                              >
                                <span className="risk-pill-dot" style={{ background: cfg.color }} />
                                {cfg.label}
                              </span>
                              <span className="font-mono" style={{ fontSize: "11.5px", color: "var(--muted-fg)" }}>
                                Page {risk.page_number || 1}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => inspectInPdf(risk)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "4px 10px",
                                borderRadius: "5px",
                                background: "var(--primary-dim)",
                                border: "1px solid var(--green-border)",
                                color: "var(--primary)",
                                fontSize: "11.5px",
                                fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              <FileText size={12} />
                              <span>Inspect in PDF &rarr;</span>
                            </button>
                          </div>

                          {risk.clause_text && (
                            <blockquote
                              style={{
                                margin: "0 0 10px",
                                padding: "9px 12px",
                                borderRadius: "6px",
                                background: "var(--surface-xs)",
                                border: "1px solid var(--border)",
                                fontSize: "12px",
                                fontStyle: "italic",
                                color: "var(--text-2)",
                                lineHeight: 1.6,
                              }}
                            >
                              &ldquo;{risk.clause_text}&rdquo;
                            </blockquote>
                          )}

                          <p
                            style={{
                              margin: "0 0 10px",
                              fontSize: "13px",
                              color: "var(--fg)",
                              lineHeight: 1.55,
                            }}
                          >
                            {risk.explanation}
                          </p>

                          {risk.redline_suggestion && (
                            <div
                              style={{
                                padding: "10px 12px",
                                borderRadius: "6px",
                                background: "var(--green-dim)",
                                border: "1px solid var(--green-border)",
                                marginTop: "8px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: "4px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    color: "var(--green)",
                                  }}
                                >
                                  Suggested Rewrite
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyRewrite(risk.id, risk.redline_suggestion)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--green)",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                  }}
                                >
                                  {isCopied ? <Check size={11} /> : <Copy size={11} />}
                                  <span>{isCopied ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                              <div style={{ fontSize: "12px", color: "var(--fg)", lineHeight: 1.55 }}>
                                {risk.redline_suggestion}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: OBLIGATIONS ── */}
          {activeTab === "obligations" && (
            <div className="card" style={{ overflow: "hidden" }}>
              <ObligationsTab
                obligations={currentObligations}
                onObligationsUpdated={(updated) => {
                  const synced = updated.filter((u) => u.is_synced_calendar).map((u) => u.id);
                  setSyncedObligationIds(synced);
                }}
              />
            </div>
          )}

          {/* ── TAB 3: REDLINES ── */}
          {activeTab === "redlines" && (
            <div className="card" style={{ overflow: "hidden" }}>
              <RedlinesTab clauseRisks={clauseRisks} />
            </div>
          )}

          {/* ── TAB 4: ASK VAULT ── */}
          {activeTab === "chat" && (
            <div className="card" style={{ height: "580px", overflow: "hidden" }}>
              <VaultChat messages={chatMessages} documentTitle={doc.title} />
            </div>
          )}
        </>
      )}

      {/* ── ON-DEMAND SLIDE-OVER PDF SHEET ── */}
      {hasOpenedPdf && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPdfOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(24, 24, 27, 0.38)",
            backdropFilter: "blur(2px)",
            zIndex: 80,
            display: pdfOpen ? "flex" : "none",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "56%",
              minWidth: "520px",
              maxWidth: "860px",
              height: "100%",
              background: "var(--desk)",
              borderLeft: "1px solid var(--border-hover)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.18)",
            }}
          >
            {/* Sheet Header */}
            <div
              style={{
                padding: "12px 18px",
                background: "var(--card)",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div
                  style={{
                    display: "inline-flex",
                    padding: "2px",
                    borderRadius: "6px",
                    background: "var(--surface-sm)",
                    border: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setViewerMode("native")}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "11.5px",
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      background: viewerMode === "native" ? "var(--primary)" : "transparent",
                      color: viewerMode === "native" ? "#fff" : "var(--muted-fg)",
                    }}
                  >
                    PDF (Highlights)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewerMode("preview")}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "11.5px",
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      background: viewerMode === "preview" ? "var(--primary)" : "transparent",
                      color: viewerMode === "preview" ? "#fff" : "var(--muted-fg)",
                    }}
                  >
                    Google Preview
                  </button>
                </div>

                {activeRisk && (
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "11.5px",
                      color: "var(--muted-fg)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Inspecting Page {activeRisk.page_number || 1}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPdfOpen(false)}
                className="btn btn-secondary"
                style={{ padding: "5px 10px", fontSize: "12px" }}
              >
                <X size={13} />
                <span>Close</span>
              </button>
            </div>

            {/* Sheet Body */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {viewerMode === "native" ? (
                <PdfCanvasViewer
                  document={doc}
                  clauseRisks={clauseRisks}
                  activeRisk={activeRisk}
                  onSelectRisk={(risk) => setActiveRisk(risk)}
                  onSwitchToIframe={() => setViewerMode("preview")}
                />
              ) : doc.google_drive_file_id ? (
                <iframe
                  key={iframeKey}
                  src={`https://drive.google.com/file/d/${doc.google_drive_file_id}/preview${targetPage ? `#page=${targetPage}` : ""}`}
                  style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
                  title={doc.title}
                />
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--muted-fg)",
                    fontSize: "13px",
                  }}
                >
                  Google Drive preview unavailable for this file.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSyncPrompt && (
        <SyncObligationsModal
          documentId={doc.id}
          documentTitle={doc.title}
          obligations={currentObligations}
          onSyncComplete={handleSyncComplete}
          onClose={handleDismissPrompt}
        />
      )}
    </div>
  );
}
