"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Building2, FolderOpen, X, ArrowRight, CornerDownLeft } from "lucide-react";

const RISK_COLOR = { HIGH: "#f87171", MEDIUM: "#fbbf24", LOW: "#34d399" };

async function fetchResults(query, signal) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

function ResultGroup({ label, icon: Icon, items, activeIndex, startIndex, onHover, onClick }) {
  if (!items.length) return null;
  return (
    <div>
      <div style={{
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
        color: "var(--subtle-fg)", padding: "8px 14px 4px",
      }}>
        {label}
      </div>
      {items.map((item, i) => {
        const idx = startIndex + i;
        const isActive = activeIndex === idx;
        return (
          <button
            key={item.id}
            onMouseEnter={() => onHover(idx)}
            onClick={() => onClick(item)}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              width: "100%", padding: "8px 14px", textAlign: "left",
              background: isActive ? "var(--surface-sm)" : "transparent",
              border: "none", cursor: "pointer", transition: "background 0.1s",
              borderLeft: isActive ? "2px solid var(--primary)" : "2px solid transparent",
            }}
          >
            <div style={{
              width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0,
              background: "var(--surface-sm)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={13} color="var(--muted-fg)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.title || item.name}
              </div>
              {item.subtitle && (
                <div style={{ fontSize: "11px", color: "var(--subtle-fg)", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.subtitle}
                </div>
              )}
            </div>
            {item.badge && (
              <span style={{
                fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                background: `${RISK_COLOR[item.badge]}18`, color: RISK_COLOR[item.badge],
                flexShrink: 0,
              }}>
                {item.badge}
              </span>
            )}
            {isActive && <ArrowRight size={12} color="var(--subtle-fg)" style={{ flexShrink: 0 }} />}
          </button>
        );
      })}
    </div>
  );
}

export default function SearchModal({ onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounceRef = useRef(null);

  // Auto-focus input
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults(null); setLoading(false); return; }
    setLoading(true);
    const ctrl = new AbortController();
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await fetchResults(query.trim(), ctrl.signal);
        setResults(data);
        setActiveIndex(0);
      } catch (e) {
        if (e.name !== "AbortError") setResults({ clients: [], projects: [], documents: [] });
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => { ctrl.abort(); clearTimeout(debounceRef.current); };
  }, [query]);

  // Build flat navigable list
  const allItems = results ? [
    ...results.clients.map(c => ({
      ...c, _type: "client",
      title: c.name, subtitle: c.industry || "Client",
      href: `/clients/${c.id}`,
    })),
    ...results.projects.map(p => ({
      ...p, _type: "project",
      title: p.name, subtitle: p.client_name,
      href: `/clients/${p.client_id}/projects/${p.id}`,
    })),
    ...results.documents.map(d => ({
      ...d, _type: "document",
      title: d.title, subtitle: `${d.client_name} · ${d.project_name}`,
      badge: d.risk_score || null,
      href: `/clients/${d.client_id}/projects/${d.project_id}/documents/${d.id}`,
    })),
  ] : [];

  const navigate = useCallback((item) => {
    router.push(item.href);
    onClose();
  }, [router, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && allItems[activeIndex]) navigate(allItems[activeIndex]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [allItems, activeIndex, navigate, onClose]);

  const clientItems = allItems.filter(i => i._type === "client");
  const projectItems = allItems.filter(i => i._type === "project");
  const documentItems = allItems.filter(i => i._type === "document");
  const clientStart = 0;
  const projectStart = clientItems.length;
  const documentStart = clientItems.length + projectItems.length;

  const showEmpty = results && !allItems.length && query.trim();
  const showInitial = !query.trim();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "14vh", left: "50%", transform: "translateX(-50%)",
        width: "min(560px, calc(100vw - 32px))", zIndex: 1001,
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "12px", overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
      }}>
        {/* Input row */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "12px 14px", borderBottom: "1px solid var(--border)",
        }}>
          {loading
            ? <div style={{ width: "16px", height: "16px", border: "2px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite", flexShrink: 0 }} />
            : <Search size={16} color="var(--muted-fg)" style={{ flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clients, projects, documents…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: "14px", color: "var(--fg)", caretColor: "var(--primary)",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--subtle-fg)", display: "flex" }}>
              <X size={14} />
            </button>
          )}
          <kbd style={{
            fontSize: "10px", padding: "2px 6px", borderRadius: "4px",
            border: "1px solid var(--border)", background: "var(--surface-sm)",
            color: "var(--subtle-fg)", fontFamily: "var(--font-mono)", flexShrink: 0,
          }}>ESC</kbd>
        </div>

        {/* Results area */}
        <div style={{ maxHeight: "360px", overflowY: "auto" }} className="no-scrollbar">
          {showInitial && (
            <div style={{ padding: "28px 14px", textAlign: "center" }}>
              <Search size={24} color="var(--border)" style={{ marginBottom: "8px" }} />
              <div style={{ fontSize: "13px", color: "var(--subtle-fg)" }}>Type to search across your workspace</div>
            </div>
          )}

          {showEmpty && (
            <div style={{ padding: "28px 14px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "var(--subtle-fg)" }}>No results for <strong style={{ color: "var(--text-2)" }}>"{query}"</strong></div>
            </div>
          )}

          {results && allItems.length > 0 && (
            <div style={{ paddingBottom: "6px" }}>
              <ResultGroup
                label="Clients" icon={Building2}
                items={clientItems} activeIndex={activeIndex} startIndex={clientStart}
                onHover={setActiveIndex} onClick={navigate}
              />
              <ResultGroup
                label="Projects" icon={FolderOpen}
                items={projectItems} activeIndex={activeIndex} startIndex={projectStart}
                onHover={setActiveIndex} onClick={navigate}
              />
              <ResultGroup
                label="Documents" icon={FileText}
                items={documentItems} activeIndex={activeIndex} startIndex={documentStart}
                onHover={setActiveIndex} onClick={navigate}
              />
            </div>
          )}
        </div>

        {/* Footer hint */}
        {allItems.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "8px 14px", borderTop: "1px solid var(--border)",
            fontSize: "11px", color: "var(--subtle-fg)",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <CornerDownLeft size={11} /> Select
            </span>
            <span>↑↓ Navigate</span>
            <span style={{ marginLeft: "auto" }}>{allItems.length} result{allItems.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
