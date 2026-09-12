import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Building2, ChevronRight, AlertTriangle, Users } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ClientPageContent from "./ClientPageContent"; // Client component wrapper for state

export default async function ClientsPage() {
  let clients = [];
  let hasError = false;

  try {
    clients = await api.get("/clients");
  } catch (error) {
    console.error("Clients fetch error:", error);
    hasError = true;
  }

  return <ClientPageContent clients={clients} hasError={hasError} />;
}
