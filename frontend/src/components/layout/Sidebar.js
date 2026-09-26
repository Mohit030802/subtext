"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, ChevronDown,
  FileText, FolderOpen, Building2, Plus, Zap, LogOut,
} from "lucide-react";

const RISK_COLORS = {
  HIGH:   "#f87171",
  MEDIUM: "#fbbf24",
  LOW:    "#34d399",
};

function DocNode({ doc, clientId, projectId }) {
  const pathname = usePathname();
  const href = `/clients/${clientId}/projects/${projectId}/documents/${doc.id}`;
  const active = pathname === href;

  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "5px 8px 5px 10px", borderRadius: "5px",
        fontSize: "12px",
        color: active ? "var(--text-1)" : "var(--sidebar-fg)",
        background: active ? "var(--sidebar-accent)" : "transparent",
        textDecoration: "none", transition: "all 0.12s", position: "relative",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface-sm)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {active && (
        <span style={{
          position: "absolute", left: 0, top: "3px", bottom: "3px",
          width: "2px", background: "var(--primary)", borderRadius: "0 2px 2px 0",
        }} />
      )}
      <FileText size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {doc.title}
      </span>
      {doc.risk_score && (
        <span style={{
          width: "5px", height: "5px", borderRadius: "50%",
          background: RISK_COLORS[doc.risk_score], flexShrink: 0,
        }} />
      )}
    </Link>
  );
}

function ProjectNode({ project, clientId }) {
  const [open, setOpen] = useState(true);
  const hasDocs = project.documents?.length > 0;

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          width: "100%", padding: "5px 8px", borderRadius: "5px",
          fontSize: "12px", color: "var(--sidebar-fg)", background: "transparent",
          border: "none", cursor: "pointer", transition: "all 0.12s", textAlign: "left",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-sm)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {hasDocs
          ? <ChevronDown size={11} style={{ opacity: 0.4, transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s", flexShrink: 0 }} />
          : <span style={{ width: 11 }} />
        }
        <FolderOpen size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {project.name}
        </span>
      </button>
      {open && hasDocs && (
        <div style={{ marginLeft: "16px", marginTop: "1px" }}>
          {project.documents.map(doc => (
            <DocNode key={doc.id} doc={doc} clientId={clientId} projectId={project.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientNode({ client }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: "2px" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          width: "100%", padding: "6px 8px", borderRadius: "6px",
          fontSize: "12px", fontWeight: 500, color: "var(--text-3)",
          background: "transparent", border: "none", cursor: "pointer",
          transition: "all 0.12s", textAlign: "left",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-sm)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <ChevronDown size={11} style={{
          opacity: 0.35, flexShrink: 0,
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.15s",
        }} />
        <Building2 size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {client.name}
        </span>
      </button>
      {open && (
        <div style={{ marginLeft: "16px", marginTop: "2px", marginBottom: "2px" }}>
          {client.projects?.map(p => (
            <ProjectNode key={p.id} project={p} clientId={client.id} />
          ))}
          {(!client.projects || client.projects.length === 0) && (
            <div style={{ fontSize: "11px", color: "var(--subtle-fg)", padding: "4px 8px", fontStyle: "italic" }}>
              No projects yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ navTree = [] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, bottom: 0, width: "240px",
      background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--sidebar-border)",
      display: "flex", flexDirection: "column", zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "16px 16px 14px",
        borderBottom: "1px solid var(--sidebar-border)",
      }}>
        <div style={{
          width: "28px", height: "28px", borderRadius: "7px",
          background: "var(--primary)", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
        }}>
          <Zap size={14} color="#fff" fill="#fff" />
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--fg)", lineHeight: 1 }}>
            Subtext
          </div>
          <div style={{ fontSize: "10px", color: "var(--subtle-fg)", marginTop: "3px", letterSpacing: "0.02em" }}>
            Read between the lines
          </div>
        </div>
      </div>

      {/* Primary Nav */}
      <div style={{ padding: "10px 8px 6px" }}>
        {[
          { href: "/", label: "Dashboard", icon: LayoutDashboard },
          { href: "/clients", label: "Clients", icon: Users },
        ].map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="nav-item"
              style={active ? { background: "var(--sidebar-accent)", color: "#c4b5fd" } : {}}
            >
              {active && (
                <span style={{
                  position: "absolute", left: 0, top: "4px", bottom: "4px",
                  width: "2px", background: "var(--primary)", borderRadius: "0 2px 2px 0",
                }} />
              )}
              <Icon size={14} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--sidebar-border)", margin: "4px 0" }} />

      {/* Workspace Tree — real data from API */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }} className="no-scrollbar">
        <div className="section-label" style={{ marginBottom: "8px" }}>Workspace</div>

        {navTree.length === 0 ? (
          <div style={{
            padding: "16px 8px", textAlign: "center",
            fontSize: "12px", color: "var(--subtle-fg)", lineHeight: 1.5,
          }}>
            No clients yet.
            <br />
            <button
              onClick={() => router.push("/clients")}
              style={{
                marginTop: "8px", fontSize: "12px", color: "var(--primary)",
                background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
              }}
            >
              Create your first client →
            </button>
          </div>
        ) : (
          navTree.map(client => (
            <ClientNode key={client.id} client={client} />
          ))
        )}

        {/* Add Client shortcut */}
        <Link
          href="/clients"
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            width: "100%", marginTop: "8px", padding: "6px 8px", borderRadius: "6px",
            fontSize: "12px", color: "var(--subtle-fg)", background: "transparent",
            border: "1px dashed var(--border)", cursor: "pointer",
            transition: "all 0.12s", textDecoration: "none",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--sidebar-fg)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--subtle-fg)"; }}
        >
          <Plus size={12} />
          Add Client
        </Link>
      </div>

      {/* User + Sign Out */}
      <div style={{
        borderTop: "1px solid var(--sidebar-border)",
        padding: "12px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "rgba(124,58,237,0.2)",
              border: "1px solid rgba(124,58,237,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700, color: "#a78bfa", flexShrink: 0,
            }}>{initials}</div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-1)", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "User"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--subtle-fg)", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email || ""}
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            style={{
              width: "26px", height: "26px", borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "1px solid var(--border)",
              cursor: "pointer", flexShrink: 0, transition: "all 0.12s",
              color: "var(--subtle-fg)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)"; e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--subtle-fg)"; }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}