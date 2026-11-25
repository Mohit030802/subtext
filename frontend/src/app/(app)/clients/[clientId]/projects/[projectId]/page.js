import { api } from "@/lib/api";
import ProjectDetailsPageContent from "./ProjectDetailsPageContent";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params, searchParams }) {
  const { clientId, projectId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialAutoDiscover =
    resolvedSearchParams?.autoDiscover === "1" ||
    resolvedSearchParams?.autoDiscover === "true";
  let client = null;
  let project = null;
  let documents = [];
  let hasError = false;

  try {
    const [clientData, projectData, documentsData] = await Promise.all([
      api.get(`/clients/${clientId}`),
      api.get(`/projects/${projectId}`),
      api.get(`/projects/${projectId}/documents`)
    ]);
    client = clientData;
    project = projectData;
    documents = documentsData;
  } catch (error) {
    console.error("Project fetch error:", error);
    hasError = true;
  }

  return (
    <ProjectDetailsPageContent
      client={client}
      project={project}
      documents={documents}
      hasError={hasError}
      initialAutoDiscover={initialAutoDiscover}
    />
  );
}
