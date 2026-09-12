import { api } from "@/lib/api";
import ClientDetailsPageContent from "./ClientDetailsPageContent";

export default async function ClientPage({ params }) {
  const { clientId } = await params;
  let client = null;
  let projects = [];
  let hasError = false;

  try {
    const [clientData, projectsData] = await Promise.all([
      api.get(`/clients/${clientId}`),
      api.get(`/clients/${clientId}/projects`)
    ]);
    client = clientData;
    projects = projectsData;
  } catch (error) {
    console.error("Client fetch error:", error);
    hasError = true;
  }

  return <ClientDetailsPageContent client={client} projects={projects} hasError={hasError} />;
}
