"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ArrowLeftRight, MessageSquare, ChevronLeft, FileText } from "lucide-react";
import RisksTab from "./RisksTab";
import ObligationsTab from "./ObligationsTab";
import RedlinesTab from "./RedlinesTab";
import VaultChat from "./VaultChat";
import ProcessDocumentPanel from "./ProcessDocumentPanel";
import DriveImportButton from "./DriveImportButton";
import SyncObligationsModal from "./SyncObligationsModal";

const TABS = [
  { id: "risks",       label: "Traps & Risks", icon: AlertTriangle },
  { id: "obligations", label: "Obligations",   icon: Clock         },
  { id: "redlines",    label: "Redlines",      icon: ArrowLeftRight},
  { id: "chat",        label: "Vault Chat",    icon: MessageSquare },
];

const RISK_COLORS = {
  HIGH:   { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)"  },
  MEDIUM: { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)"   },
  LOW:    { color: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)"   },
};

export default function DocumentWorkspace({ document: doc, versions = [], clientId, projectId }) {
  const [activeTab, setActiveTab] = useState("risks");
  const [splitPct, setSplitPct] = useState(52);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const onDragStart = useCallback(() => {
    dragging.current = true;
    const onMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - r.left) / r.width) * 100;
      if (pct > 30 && pct < 72) setSplitPct(pct);
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const scrollToClause = (id) => {
    // In iframe mode, we can't easily scroll inside Drive, but we keep the handler signature
  };

  const riskCfg = doc.risk_score ? RISK_COLORS[doc.risk_score] : null;
  const clauseRisks = doc.clause_risks || [];
  const [currentObligations, setCurrentObligations] = useState(doc.obligations || []);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);
  const chatMessages = doc.chat_messages || []; // assuming empty for now
  const highCount = clauseRisks.filter(r => r.risk_level === "HIGH").length;

  useEffect(() => {
    setCurrentObligations(doc.obligations || []);
  }, [doc.obligations]);

  useEffect(() => {
    if (doc.status === "ANALYZED" && currentObligations.some(o => o.due_date && !o.is_synced_calendar)) {
      const prompted = typeof window !== "undefined" ? sessionStorage.getItem(`subtext_sync_prompted_${doc.id}`) : "true";
      if (!prompted) {
        setShowSyncPrompt(true);
      }
    }
  }, [doc.status, doc.id, currentObligations]);

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
    setCurrentObligations(prev =>
      prev.map(o => (syncedIds.includes(o.id) ? { ...o, is_synced_calendar: true } : o))
    );
  };

  return (
    /* Full-viewport layout: fixed overlay over main content */
    <div style={{
      position: "fixed", inset: 0, left: "240px", top: "48px",
      display: "flex", flexDirection: "column",
      background: "var(--bg)", zIndex: 40
    }}>
      {/* ── Title Bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "0 16px", height: "44px", flexShrink: 0,
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
      }}>
        <Link
          href={`/clients/${clientId}/projects/${projectId}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "28px", height: "28px", borderRadius: "6px",
            border: "1px solid var(--border)", color: "var(--muted-fg)",
            textDecoration: "none", flexShrink: 0, transition: "all 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-sm)"; e.currentTarget.style.color = "var(--text-1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-fg)"; }}
        >
          <ChevronLeft size={14} />
        </Link>

        <div style={{ width: "1px", height: "18px", background: "var(--border)" }} />

        <FileText size={14} color="var(--muted-fg)" style={{ flexShrink: 0 }} />
        <span style={{
          fontSize: "13px", fontWeight: 600, color: "var(--text-1)",
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{doc.title}</span>

        <span style={{
          fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px",
          fontFamily: "var(--font-mono)", background: "var(--surface-sm)", color: "var(--muted-fg)",
        }}>{doc.doc_type || "OTHER"}</span>

        {riskCfg && (
          <span className="risk-pill" style={{
            background: riskCfg.bg, color: riskCfg.color,
            border: `1px solid ${riskCfg.border}`, flexShrink: 0,
          }}>
            <span className="risk-pill-dot" style={{ background: riskCfg.color }} />
            {doc.risk_score} RISK
          </span>
        )}

        <DriveImportButton
          projectId={projectId}
          clientId={clientId}
          documentId={doc.id}
        />
      </div>

      {versions.length > 1 && (
        <div style={{ display: "flex", gap: "4px", padding: "6px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
          {versions.map((version) => {
            const active = version.version_number === doc.version_number;
            const href = version.is_latest
              ? `/clients/${clientId}/projects/${projectId}/documents/${doc.document_family_id}`
              : `/clients/${clientId}/projects/${projectId}/documents/${doc.document_family_id}?version=${version.version_number}`;
            return (
              <Link key={version.id} href={href} style={{ padding: "5px 9px", borderRadius: "5px", textDecoration: "none", whiteSpace: "nowrap", fontSize: "11px", fontWeight: active ? 700 : 500, color: active ? "#c4b5fd" : "var(--muted-fg)", background: active ? "rgba(124,58,237,0.16)" : "transparent", border: active ? "1px solid rgba(124,58,237,0.3)" : "1px solid var(--border)" }}>
                Version {version.version_number}{version.is_latest ? " · Latest" : ""}
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Split View ── */}
      <div ref={containerRef} style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Document Viewer */}
        <div style={{
          width: `${splitPct}%`, display: "flex", flexDirection: "column",
          borderRight: "1px solid var(--border)", overflow: "hidden",
          background: "#fff"
        }}>
          {doc.google_drive_file_id ? (
            <iframe 
              src={`https://drive.google.com/file/d/${doc.google_drive_file_id}/preview`} 
              width="100%" 
              height="100%" 
              style={{ border: "none" }}
              title={doc.title}
            />
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
              Document viewer not available. No Google Drive file ID provided.
            </div>
          )}
        </div>

        {/* Drag Handle */}
        <div
          onMouseDown={onDragStart}
          style={{
            width: "4px", flexShrink: 0, cursor: "col-resize",
            background: "var(--border)", transition: "background 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#7c3aed"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--border)"}
        />

        {/* Right: Analysis Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {doc.status !== "ANALYZED" ? (
            /* ── Not yet processed: show CTA / spinner ── */
            <ProcessDocumentPanel
              documentId={doc.id}
              initialStatus={doc.status || "PENDING"}
            />
          ) : (
            /* ── Processed: show analysis tabs ── */
            <>
              {/* Tab Bar */}
              <div style={{
                display: "flex", alignItems: "stretch",
                background: "var(--surface)", borderBottom: "1px solid var(--border)",
                flexShrink: 0, overflowX: "auto",
              }} className="no-scrollbar">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "12px 16px", fontSize: "12px", fontWeight: 500,
                        color: active ? "var(--text-1)" : "var(--muted-fg)",
                        background: "transparent", border: "none",
                        borderBottom: active ? "2px solid #7c3aed" : "2px solid transparent",
                        cursor: "pointer", whiteSpace: "nowrap",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.color = "var(--text-2)"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.color = "var(--muted-fg)"; }}
                    >
                      <Icon size={13} />
                      {label}
                      {id === "risks" && highCount > 0 && (
                        <span style={{
                          marginLeft: "2px", padding: "1px 5px", borderRadius: "99px",
                          fontSize: "10px", fontWeight: 700,
                          background: "rgba(248,113,113,0.12)", color: "#f87171",
                        }}>{highCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {activeTab === "risks"       && <RisksTab       clauseRisks={clauseRisks}  onScrollToClause={scrollToClause} />}
                {activeTab === "obligations" && <ObligationsTab obligations={currentObligations} onObligationsUpdated={setCurrentObligations} />}
                {activeTab === "redlines"    && <RedlinesTab    clauseRisks={clauseRisks}  />}
                {activeTab === "chat"        && <VaultChat      messages={chatMessages}     documentTitle={doc.title} />}
              </div>
            </>
          )}
        </div>
      </div>

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
