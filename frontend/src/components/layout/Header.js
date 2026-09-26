"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Upload, Sun, Moon, Search, Bell } from "lucide-react";
import { useTheme } from "@/lib/theme";
import dynamic from "next/dynamic";

const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false });

export default function Header() {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Build readable breadcrumb
  const crumbs = [];
  const parts = pathname.split("/").filter(Boolean);
  const labelMap = { clients: "Clients", projects: "Projects", documents: "Documents" };
  crumbs.push({ label: "Subtext", active: false });
  parts.forEach((p, i) => {
    const label = labelMap[p] || (p.length > 12 ? p.slice(0, 10) + "…" : p);
    crumbs.push({ label, active: i === parts.length - 1 });
  });
  if (parts.length === 0) crumbs.push({ label: "Dashboard", active: true });

  return (
    <>
      <header style={{
        position: "fixed", top: 0, left: "240px", right: 0, height: "48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        background: "rgba(9,9,11,0.85)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        zIndex: 40,
      }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {i > 0 && <span style={{ color: "var(--subtle-fg)", fontSize: "13px" }}>/</span>}
              <span style={{
                fontSize: "13px",
                fontWeight: c.active ? 500 : 400,
                color: c.active ? "var(--text-1)" : "var(--subtle-fg)",
              }}>{c.label}</span>
            </span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "5px 10px", borderRadius: "6px",
              background: "var(--surface-xs)",
              border: "1px solid var(--border)",
              color: "var(--subtle-fg)", fontSize: "12px", cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--muted-fg)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--subtle-fg)"; }}
          >
            <Search size={13} />
            <span>Search</span>
            <kbd style={{
              fontSize: "10px", padding: "1px 5px", borderRadius: "4px",
              border: "1px solid var(--border)",
              background: "var(--surface-sm)", color: "var(--subtle-fg)",
              fontFamily: "var(--font-mono)", lineHeight: 1.5,
            }}>⌘K</kbd>
          </button>

          {/* Upload */}
          <button style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 12px", borderRadius: "6px",
            background: "var(--primary)", color: "#fff",
            fontSize: "12px", fontWeight: 600, cursor: "pointer",
            border: "none", transition: "all 0.12s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#6d28d9"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--primary)"}
          >
            <Upload size={13} />
            Upload
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            style={{
              width: "32px", height: "32px", borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--subtle-fg)", cursor: "pointer", transition: "all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-sm)"; e.currentTarget.style.color = "var(--fg)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--subtle-fg)"; }}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}