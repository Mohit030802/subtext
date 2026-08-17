"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ArrowLeftRight, MessageSquare, ChevronLeft, FileText } from "lucide-react";
import RisksTab from "./RisksTab";
import ObligationsTab from "./ObligationsTab";
import RedlinesTab from "./RedlinesTab";
import VaultChat from "./VaultChat";

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

export default function DocumentWorkspace({ document: doc, clauseRisks, obligations, chatMessages, clientId, projectId }) {
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
    const el = window.document.getElementById(`clause-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.outline = "2px solid #7c3aed";
    el.style.outlineOffset = "4px";
    setTimeout(() => { el.style.outline = ""; el.style.outlineOffset = ""; }, 2000);
  };

  const riskCfg = doc.risk_score ? RISK_COLORS[doc.risk_score] : null;
  const highCount = clauseRisks.filter(r => r.risk_level === "HIGH").length;

  return (
    /* Full-viewport layout: fixed overlay over main content */
    <div style={{
      position: "fixed", inset: 0, left: "240px", top: "48px",
      display: "flex", flexDirection: "column",
      background: "var(--bg)",
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
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#e4e4e7"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-fg)"; }}
        >
          <ChevronLeft size={14} />
        </Link>

        <div style={{ width: "1px", height: "18px", background: "var(--border)" }} />

        <FileText size={14} color="var(--muted-fg)" style={{ flexShrink: 0 }} />
        <span style={{
          fontSize: "13px", fontWeight: 600, color: "#e4e4e7",
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{doc.title}</span>

        <span style={{
          fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px",
          fontFamily: "var(--font-mono)", background: "rgba(255,255,255,0.05)", color: "#71717a",
        }}>{doc.doc_type}</span>

        {riskCfg && (
          <span className="risk-pill" style={{
            background: riskCfg.bg, color: riskCfg.color,
            border: `1px solid ${riskCfg.border}`, flexShrink: 0,
          }}>
            <span className="risk-pill-dot" style={{ background: riskCfg.color }} />
            {doc.risk_score} RISK
          </span>
        )}
      </div>

      {/* ── Split View ── */}
      <div ref={containerRef} style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Document Viewer */}
        <div style={{
          width: `${splitPct}%`, display: "flex", flexDirection: "column",
          borderRight: "1px solid var(--border)", overflow: "hidden",
        }}>
          <div style={{
            flex: 1, overflowY: "auto",
            background: "#f5f5f4", /* warm paper */
          }}>
            <div style={{
              maxWidth: "640px", margin: "32px auto 64px",
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)",
              borderRadius: "4px",
              padding: "48px 52px",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}>
              <h1 style={{
                fontSize: "18px", fontWeight: 700, color: "#1a1a1a",
                textAlign: "center", marginBottom: "6px", letterSpacing: "-0.01em", lineHeight: 1.3,
              }}>{doc.title}</h1>
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <span style={{
                  fontSize: "11px", color: "#9ca3af",
                  fontFamily: "system-ui, sans-serif", fontWeight: 500,
                }}>
                  {doc.doc_type} · {doc.page_count} pages
                  {doc.summary?.effective_date && ` · Effective ${doc.summary.effective_date}`}
                </span>
              </div>

              {/* Summary box */}
              {doc.summary?.key_takeaways && (
                <div style={{
                  background: "#f8f7ff", border: "1px solid #e5e1ff",
                  borderRadius: "6px", padding: "16px 18px", marginBottom: "28px",
                  fontFamily: "system-ui, sans-serif",
                }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#7c3aed", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
                    Key Takeaways
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {doc.summary.key_takeaways.map((t, i) => (
                      <li key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#374151", lineHeight: 1.5 }}>
                        <span style={{ color: "#7c3aed", fontWeight: 700, flexShrink: 0 }}>·</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Highlighted clauses */}
              {clauseRisks.map((risk, idx) => {
                const colors = { HIGH: "#dc2626", MEDIUM: "#d97706", LOW: "#059669" };
                const bgs    = { HIGH: "#fef2f2", MEDIUM: "#fffbeb", LOW: "#f0fdf4" };
                const color = colors[risk.risk_level] || "#6b7280";
                const bg    = bgs[risk.risk_level]   || "#f9fafb";
                return (
                  <div key={risk.id} id={`clause-${risk.id}`} style={{
                    marginBottom: "20px", borderRadius: "4px",
                    borderLeft: `3px solid ${color}`,
                    background: bg, padding: "14px 16px",
                    transition: "outline 0.3s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontFamily: "system-ui, sans-serif" }}>
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Page {risk.page_number} · Clause {idx + 1}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color, background: `${color}15`, padding: "1px 6px", borderRadius: "3px" }}>
                        {risk.risk_level}
                      </span>
                    </div>
                    <p style={{ fontSize: "14px", color: "#1f2937", lineHeight: 1.7, margin: 0 }}>
                      {risk.clause_text}
                    </p>
                  </div>
                );
              })}

              {/* Filler text */}
              {[...Array(5)].map((_, i) => (
                <p key={i} style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.8, marginBottom: "16px" }}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit.
                </p>
              ))}
            </div>
          </div>
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
                    color: active ? "#e4e4e7" : "var(--muted-fg)",
                    background: "transparent", border: "none",
                    borderBottom: active ? "2px solid #7c3aed" : "2px solid transparent",
                    cursor: "pointer", whiteSpace: "nowrap",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#d4d4d8"; }}
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
            {activeTab === "obligations" && <ObligationsTab obligations={obligations}  />}
            {activeTab === "redlines"    && <RedlinesTab    clauseRisks={clauseRisks}  />}
            {activeTab === "chat"        && <VaultChat      messages={chatMessages}     documentTitle={doc.title} />}
          </div>
        </div>
      </div>
    </div>
  );
}
