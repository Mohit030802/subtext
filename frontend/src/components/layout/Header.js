"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Upload, Sun, Moon, Search, Bell } from "lucide-react";
import { useTheme } from "@/lib/theme";
import dynamic from "next/dynamic";

const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false });

export default function Header({ navTree = [] }) {
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

  // Build lookup maps from navTree for friendly breadcrumb names
  const nameMap = useMemo(() => {
    const map = {};
    if (Array.isArray(navTree)) {
      for (const client of navTree) {
        if (client.id) map[client.id] = client.name;
        if (Array.isArray(client.projects)) {
          for (const proj of client.projects) {
            if (proj.id) map[proj.id] = proj.name;
            if (Array.isArray(proj.documents)) {
              for (const doc of proj.documents) {
                if (doc.id) map[doc.id] = doc.title;
              }
            }
          }
        }
      }
    }
    return map;
  }, [navTree]);

  // Build clickable, human-readable breadcrumb segments
  const crumbs = useMemo(() => {
    const list = [{ label: "Subtext", href: "/" }];
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length === 0) {
      list[0].active = true;
      return list;
    }

    if (parts[0] === "clients") {
      list.push({
        label: "Clients",
        href: "/clients",
        active: parts.length === 1,
      });

      if (parts[1]) {
        const clientId = parts[1];
        const clientName = nameMap[clientId] || (clientId.length > 10 ? clientId.slice(0, 8) + "…" : clientId);
        const hasProject = parts[2] === "projects" && parts[3];

        list.push({
          label: clientName,
          href: `/clients/${clientId}`,
          active: parts.length === 2,
        });

        if (hasProject) {
          const projectId = parts[3];
          const projectName = nameMap[projectId] || (projectId.length > 10 ? projectId.slice(0, 8) + "…" : projectId);
          const hasDocument = parts[4] === "documents" && parts[5];

          list.push({
            label: projectName,
            href: `/clients/${clientId}/projects/${projectId}`,
            active: parts.length === 4,
          });

          if (hasDocument) {
            const documentId = parts[5];
            const docTitle = nameMap[documentId] || (documentId.length > 10 ? documentId.slice(0, 8) + "…" : documentId);
            list.push({
              label: docTitle,
              href: `/clients/${clientId}/projects/${projectId}/documents/${documentId}`,
              active: true,
            });
          }
        }
      }
      return list;
    }

    if (parts[0] === "coffee") {
      list.push({
        label: "Support Subtext",
        href: "/coffee",
        active: true,
      });
      return list;
    }

    // Generic fallback for any other path
    let accPath = "";
    parts.forEach((p, idx) => {
      accPath += `/${p}`;
      const label = nameMap[p] || (p.charAt(0).toUpperCase() + p.slice(1));
      list.push({
        label: label.length > 18 ? label.slice(0, 16) + "…" : label,
        href: accPath,
        active: idx === parts.length - 1,
      });
    });

    return list;
  }, [pathname, nameMap]);

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
              {i > 0 && <span style={{ color: "var(--subtle-fg)", fontSize: "12px" }}>/</span>}
              {c.active ? (
                <span style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-1)",
                  maxWidth: "220px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  style={{
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "var(--subtle-fg)",
                    textDecoration: "none",
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    transition: "color 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--text-1)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--subtle-fg)"}
                >
                  {c.label}
                </Link>
              )}
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