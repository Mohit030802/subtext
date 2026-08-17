import Link from "next/link";
import { mockClients, mockProjects, mockDocuments } from "@/lib/mock-data";
import { formatDate, RISK_CONFIG, DOC_TYPE_COLORS } from "@/lib/utils";
import { ArrowLeft, Upload, FileText, ChevronRight, AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";

function RiskPill({ level }) {
  const cfg = RISK_CONFIG[level];
  if (!cfg) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1 h-1 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export default async function ProjectPage({ params }) {
  const { clientId, projectId } = await params;
  const client = mockClients.find((c) => c.id === clientId);
  const projects = mockProjects[clientId] || [];
  const project = projects.find((p) => p.id === projectId);
  if (!project || !client) notFound();

  const documents = mockDocuments[projectId] || [];
  const docTypeCfg = (type) => DOC_TYPE_COLORS[type] || DOC_TYPE_COLORS.OTHER;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <Link href={`/clients/${clientId}`} className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-white/5 transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
              <span>{client.name}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground/60">{project.name}</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{project.description}</p>
            )}
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary bg-primary hover:bg-primary/90 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Documents */}
      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed flex flex-col items-center justify-center py-20 text-center animate-fade-up"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No documents yet</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Upload your first contract to start AI analysis</p>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-primary bg-primary hover:bg-primary/90 transition-colors">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, i) => {
            const dtCfg = docTypeCfg(doc.doc_type);
            return (
              <Link
                key={doc.id}
                href={`/clients/${clientId}/projects/${projectId}/documents/${doc.id}`}
                className={`group animate-fade-up stagger-${Math.min(i + 1, 6)} flex items-start gap-4 rounded-xl border p-5 hover:border-white/15 transition-all duration-200 overflow-hidden relative`}
                style={{ background: "var(--card)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "radial-gradient(ellipse at left, rgba(99,102,241,0.04) 0%, transparent 50%)" }} />

                {/* Left indicator by risk */}
                {doc.risk_score === "HIGH" && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl bg-red-400" />
                )}
                {doc.risk_score === "MEDIUM" && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl bg-amber-400" />
                )}

                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{ background: dtCfg.bg, borderColor: `${dtCfg.color}30` }}>
                  <FileText className="w-5 h-5" style={{ color: dtCfg.color }} />
                </div>

                <div className="flex-1 min-w-0 relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{doc.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: dtCfg.bg, color: dtCfg.color }}>{doc.doc_type}</span>
                        {doc.page_count && (
                          <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{doc.page_count} pages</span>
                        )}
                        <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                    {doc.risk_score && <RiskPill level={doc.risk_score} />}
                  </div>

                  {doc.summary?.key_takeaways && (
                    <ul className="mt-3 space-y-1">
                      {doc.summary.key_takeaways.slice(0, 2).map((t, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span className="inline-block w-1 h-1 rounded-full mt-1.5 shrink-0 bg-primary/50" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 shrink-0 mt-3 opacity-0 group-hover:opacity-40 transition-opacity relative" style={{ color: "var(--muted-foreground)" }} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
