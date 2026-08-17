import Link from "next/link";
import { mockClients, mockProjects } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Plus, FolderOpen, FileText, AlertTriangle, Calendar, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

export default async function ClientPage({ params }) {
  const { clientId } = await params;
  const client = mockClients.find((c) => c.id === clientId);
  if (!client) notFound();

  const projects = mockProjects[clientId] || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-white/5 transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted-foreground)" }}>
                {client.industry}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {projects.length} projects · {client.document_count} documents
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary bg-primary hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project, i) => (
          <Link
            key={project.id}
            href={`/clients/${clientId}/projects/${project.id}`}
            className={`group animate-fade-up stagger-${Math.min(i + 1, 6)} relative rounded-xl border p-5 overflow-hidden hover:border-white/15 transition-all duration-200`}
            style={{ background: "var(--card)", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "radial-gradient(ellipse at top left, rgba(99,102,241,0.05) 0%, transparent 60%)" }} />

            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "var(--muted-foreground)" }} />
              </div>

              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-xs line-clamp-2 mb-4" style={{ color: "var(--muted-foreground)" }}>
                  {project.description}
                </p>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <FileText className="w-3.5 h-3.5" />
                  {project.document_count} docs
                </div>
                {project.high_risk_count > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {project.high_risk_count} risks
                  </div>
                )}
                {project.upcoming_deadlines > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {project.upcoming_deadlines} due
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
