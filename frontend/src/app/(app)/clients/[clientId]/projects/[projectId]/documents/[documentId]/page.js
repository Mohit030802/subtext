import { api } from "@/lib/api";
import DocumentWorkspace from "@/components/document/DocumentWorkspace";
import EmptyState from "@/components/ui/EmptyState";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params, searchParams }) {
  const { clientId, projectId, documentId } = await params;
  const { version } = await searchParams;
  let document = null;
  let versions = [];
  let hasError = false;

  try {
    const versionQuery = version ? `?version=${encodeURIComponent(version)}` : "";
    [document, versions] = await Promise.all([
      api.get(`/documents/${documentId}${versionQuery}`),
      api.get(`/documents/${documentId}/versions`),
    ]);
  } catch (error) {
    console.error("Document fetch error:", error);
    hasError = true;
  }

  if (hasError || !document) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", paddingTop: "2rem" }}>
        <EmptyState
          icon={AlertTriangle}
          title="Document not found"
          description="Could not load document analysis."
        />
      </div>
    );
  }

  return (
    <DocumentWorkspace 
      document={document}
      versions={versions}
      clientId={clientId}
      projectId={projectId}
    />
  );
}
