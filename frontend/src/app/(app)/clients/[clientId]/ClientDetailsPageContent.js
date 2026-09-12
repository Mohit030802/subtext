"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, FolderOpen, FileText, AlertTriangle, Calendar, ChevronRight } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import NewProjectModal from "@/components/projects/NewProjectModal";

export default function ClientDetailsPageContent({ client, projects = [], hasError }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (hasError || !client) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", paddingTop: "2rem" }}>
        <EmptyState
          icon={AlertTriangle}
          title="Client not found"
          description="Could not load client details."
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/clients" style={{
            width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)",
            transition: "background 0.15s", color: "var(--subtle-fg)"
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#fafafa" }}>{client.name}</h1>
              <span style={{
                fontSize: "10px", padding: "2px 8px", borderRadius: "99px",
                background: "rgba(255,255,255,0.06)", color: "var(--subtle-fg)"
              }}>
                {client.industry || "Other"}
              </span>
            </div>
            <p style={{ fontSize: "14px", color: "var(--subtle-fg)", marginTop: "4px" }}>
              {projects.length} projects · {client.document_count || 0} documents
            </p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={14} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create a project to start organizing documents for this client."
          action={{ label: "New Project", onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {projects.map((project, i) => (
            <Link
              key={project.id}
              href={`/clients/${client.id}/projects/${project.id}`}
              className={`fade-up delay-${Math.min(i + 1, 6)}`}
              style={{
                position: "relative", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)",
                padding: "20px", overflow: "hidden", transition: "all 0.2s",
                background: "var(--card)", textDecoration: "none", display: "block"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                const chevron = e.currentTarget.querySelector(".chevron");
                if (chevron) chevron.style.opacity = "0.4";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                const chevron = e.currentTarget.querySelector(".chevron");
                if (chevron) chevron.style.opacity = "0";
              }}
            >
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <FolderOpen size={16} color="#818cf8" />
                  </div>
                  <ChevronRight className="chevron" size={16} color="var(--subtle-fg)" style={{ opacity: 0, transition: "opacity 0.2s" }} />
                </div>

                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa", marginBottom: "4px", transition: "color 0.2s" }}>
                  {project.name}
                </h3>
                {project.description && (
                  <p style={{
                    fontSize: "12px", color: "var(--subtle-fg)", marginBottom: "16px",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                  }}>
                    {project.description}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: !project.description ? "16px" : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--subtle-fg)" }}>
                    <FileText size={14} />
                    {project.document_count || 0} docs
                  </div>
                  {project.high_risk_count > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#f87171" }}>
                      <AlertTriangle size={14} />
                      {project.high_risk_count} risks
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isModalOpen && <NewProjectModal clientId={client.id} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
