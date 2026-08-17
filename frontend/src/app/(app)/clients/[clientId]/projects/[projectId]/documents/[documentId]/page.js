import { mockClients, mockProjects, mockDocuments, mockClauseRisks, mockObligations, mockChatMessages } from "@/lib/mock-data";
import DocumentWorkspace from "@/components/document/DocumentWorkspace";
import { notFound } from "next/navigation";

export default async function DocumentPage({ params }) {
  const { clientId, projectId, documentId } = await params;

  const client = mockClients.find((c) => c.id === clientId);
  const projects = mockProjects[clientId] || [];
  const project = projects.find((p) => p.id === projectId);
  const documents = mockDocuments[projectId] || [];
  const document = documents.find((d) => d.id === documentId);

  if (!document || !project || !client) notFound();

  const clauseRisks = mockClauseRisks[documentId] || [];
  const obligations = mockObligations[documentId] || [];

  return (
    <DocumentWorkspace
      document={document}
      clauseRisks={clauseRisks}
      obligations={obligations}
      chatMessages={mockChatMessages}
      clientId={clientId}
      projectId={projectId}
    />
  );
}
