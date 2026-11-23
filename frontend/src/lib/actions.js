"use server";
import { revalidatePath } from "next/cache";
import { api } from "./api";

export async function triggerProcessing(documentId, driveAccessToken) {
  return api.post(`/documents/${documentId}/process`, {
    drive_access_token: driveAccessToken,
  });
}

export async function createClient(formData) {
  const data = {
    name: formData.get("name"),
    industry: formData.get("industry") || null,
    contact_name: formData.get("contact_name") || null,
    contact_email: formData.get("contact_email") || null,
  };
  const client = await api.post("/clients", data);
  revalidatePath("/clients");
  return client;
}

export async function createProject(clientId, formData) {
  const data = {
    name: formData.get("name"),
    description: formData.get("description") || null,
  };
  const project = await api.post(`/clients/${clientId}/projects`, data);
  revalidatePath(`/clients/${clientId}`);
  return project;
}

export async function importDocument(projectId, driveData) {
  // driveData includes drive_access_token — backend uses it to download the file for processing
  const doc = await api.post(`/projects/${projectId}/documents`, driveData);
  revalidatePath(`/clients`);
  return doc;
}

export async function updateDocument(documentId, driveData) {
  const doc = await api.post(`/documents/${documentId}/versions`, driveData);
  revalidatePath(`/clients`);
  return doc;
}

export async function deleteClient(clientId) {
  await api.delete(`/clients/${clientId}`);
  revalidatePath("/clients");
}

export async function deleteProject(projectId, clientId) {
  await api.delete(`/projects/${projectId}`);
  revalidatePath(`/clients/${clientId}`);
}

export async function updateObligationStatus(obligationId, status) {
  // We'll need the document ID for this - pass it in
  // For now just call the update endpoint
  revalidatePath("/");
}

export async function markObligationCalendarSynced(documentId, obligationId, calendarEventId) {
  const obligation = await api.put(`/documents/${documentId}/obligations/${obligationId}`, {
    is_synced_calendar: true,
    calendar_event_id: calendarEventId,
  });
  revalidatePath("/");
  return obligation;
}
