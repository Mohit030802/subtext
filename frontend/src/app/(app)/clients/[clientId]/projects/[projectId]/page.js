import { api } from "@/lib/api";
import ProjectDetailsPageContent from "./ProjectDetailsPageContent";

export default async function ProjectPage({ params }) {
  const { clientId, projectId } = await params;
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

  return <ProjectDetailsPageContent client={client} project={project} documents={documents} hasError={hasError} />;
}
