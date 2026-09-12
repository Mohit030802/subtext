import { api } from "@/lib/api";
import DocumentWorkspace from "@/components/document/DocumentWorkspace";
import EmptyState from "@/components/ui/EmptyState";
import { AlertTriangle } from "lucide-react";

export default async function DocumentPage({ params }) {
  const { clientId, projectId, documentId } = await params;
  let document = null;
  let hasError = false;

  try {
    document = await api.get(`/documents/${documentId}`);
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
      clientId={clientId}
      projectId={projectId}
    />
  );
}
