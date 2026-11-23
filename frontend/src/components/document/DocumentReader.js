"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";

const RISK_THEME = {
  HIGH: {
    badgeBg: "rgba(248, 113, 113, 0.18)",
    badgeColor: "#f87171",
    border: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    activeBg: "rgba(239, 68, 68, 0.22)",
    glow: "rgba(239, 68, 68, 0.35)",
  },
  MEDIUM: {
    badgeBg: "rgba(251, 191, 36, 0.18)",
    badgeColor: "#fbbf24",
    border: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    activeBg: "rgba(245, 158, 11, 0.22)",
    glow: "rgba(245, 158, 11, 0.35)",
  },
  LOW: {
    badgeBg: "rgba(52, 211, 153, 0.18)",
    badgeColor: "#34d399",
    border: "#10b981",
    bg: "rgba(16, 185, 129, 0.10)",
    activeBg: "rgba(16, 185, 129, 0.20)",
    glow: "rgba(16, 185, 129, 0.35)",
  },
};

/**
 * Finds occurrences of clauseRisks in rawText and partitions text into segments.
 */
function buildAnnotatedSegments(rawText, clauseRisks) {
  if (!rawText) return [{ text: "", risk: null }];
  if (!clauseRisks || !clauseRisks.length) return [{ text: rawText, risk: null }];

  const matches = [];

  for (const risk of clauseRisks) {
    if (!risk.clause_text || risk.clause_text.length < 5) continue;

    const query = risk.clause_text.trim();
    let idx = rawText.indexOf(query);

    // If exact match fails, try relaxed matching (first 35 characters)
    if (idx === -1 && query.length > 25) {
      const sub = query.slice(0, 35);
      idx = rawText.indexOf(sub);
      if (idx !== -1) {
        matches.push({
          start: idx,
          end: Math.min(rawText.length, idx + query.length),
          risk,
        });
        continue;
      }
    }

    if (idx !== -1) {
      matches.push({
        start: idx,
        end: idx + query.length,
        risk,
      });
    }
  }

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Merge non-overlapping segments
  const segments = [];
  let cursor = 0;

  for (const m of matches) {
    if (m.start < cursor) continue; // Skip overlaps
    if (m.start > cursor) {
      segments.push({ text: rawText.slice(cursor, m.start), risk: null });
    }
    segments.push({ text: rawText.slice(m.start, m.end), risk: m.risk });
    cursor = m.end;
  }

  if (cursor < rawText.length) {
    segments.push({ text: rawText.slice(cursor), risk: null });
  }

  return segments;
}

export default function DocumentReader({
  rawText = "",
  clauseRisks = [],
  activeRiskId = null,
  onSelectRisk,
}) {
  const containerRef = useRef(null);
  const activeMarkerRef = useRef(null);
  const [fontSize, setFontSize] = useState(13); // px
  const [copiedId, setCopiedId] = useState(null);

  const segments = useMemo(
    () => buildAnnotatedSegments(rawText, clauseRisks),
    [rawText, clauseRisks]
  );

  // Auto-scroll to active clause when selected
  useEffect(() => {
    if (!activeRiskId) return;

    // Small delay to allow tab/DOM transition
    const timer = setTimeout(() => {
      const el = document.getElementById(`clause-marker-${activeRiskId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [activeRiskId]);

  const handleCopyClause = (risk, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(risk.clause_text);
    setCopiedId(risk.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!rawText || !rawText.trim()) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "40px",
          color: "var(--muted-fg)",
          textAlign: "center",
        }}
      >
        <AlertTriangle size={32} style={{ marginBottom: "12px", opacity: 0.6 }} />
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-1)", marginBottom: "4px" }}>
          Extracted Text Not Ready
        </p>
        <p style={{ fontSize: "12px", maxWidth: "340px", lineHeight: 1.5 }}>
          The document is currently viewable via the Drive PDF Preview. Re-analyzing or re-importing will generate the full interactive text stream.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)" }}>
      {/* Reader Sub-Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 16px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          fontSize: "11px",
          color: "var(--muted-fg)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>
            {clauseRisks.length} risk clause{clauseRisks.length !== 1 ? "s" : ""} marked in document
          </span>
        </div>

        {/* Font Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "10px", color: "var(--subtle-fg)" }}>Text size:</span>
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.max(11, s - 1))}
            style={{
              padding: "2px 7px",
              borderRadius: "4px",
              background: "var(--surface-sm)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
              cursor: "pointer",
              fontSize: "10px",
            }}
          >
            A-
          </button>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", minWidth: "24px", textAlign: "center" }}>
            {fontSize}px
          </span>
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.min(18, s + 1))}
            style={{
              padding: "2px 7px",
              borderRadius: "4px",
              background: "var(--surface-sm)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
              cursor: "pointer",
              fontSize: "10px",
            }}
          >
            A+
          </button>
        </div>
      </div>

      {/* Text Container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 28px",
          lineHeight: 1.8,
          fontSize: `${fontSize}px`,
          color: "var(--text-1)",
          fontFamily: "var(--font-inter)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {segments.map((seg, idx) => {
          if (!seg.risk) {
            return <span key={idx}>{seg.text}</span>;
          }

          const r = seg.risk;
          const theme = RISK_THEME[r.risk_level] || RISK_THEME.LOW;
          const isActive = activeRiskId === r.id;

          return (
            <span
              id={`clause-marker-${r.id}`}
              key={idx}
              ref={isActive ? activeMarkerRef : null}
              onClick={() => onSelectRisk && onSelectRisk(r)}
              style={{
                position: "relative",
                display: "inline",
                borderRadius: "4px",
                padding: "2px 4px",
                margin: "0 1px",
                background: isActive ? theme.activeBg : theme.bg,
                border: isActive ? `2px solid ${theme.border}` : `1px dashed ${theme.border}`,
                boxShadow: isActive ? `0 0 14px ${theme.glow}` : "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title={`Click to view ${r.risk_level} risk details`}
            >
              {/* Highlight Tag Header (Floating above the highlighted clause) */}
              {isActive && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: theme.border,
                    color: "#fff",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    marginRight: "6px",
                    textTransform: "uppercase",
                    verticalAlign: "middle",
                    userSelect: "none",
                  }}
                >
                  <AlertTriangle size={10} />
                  <span>{r.risk_level} RISK · P.{r.page_number || 1}</span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyClause(r, e)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "rgba(0, 0, 0, 0.25)",
                      border: "none",
                      color: "#fff",
                      borderRadius: "3px",
                      padding: "1px 4px",
                      cursor: "pointer",
                      marginLeft: "3px",
                    }}
                    title="Copy highlighted clause"
                  >
                    {copiedId === r.id ? <Check size={9} /> : <Copy size={9} />}
                  </button>
                </span>
              )}

              {/* The clause text inside the marker */}
              <span style={{ fontWeight: isActive ? 600 : 500 }}>{seg.text}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
