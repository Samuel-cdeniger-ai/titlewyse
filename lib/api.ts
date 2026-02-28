/**
 * TitleWyse API client
 * Single source of truth for all backend calls.
 * Always includes the ngrok bypass header so mobile browsers work correctly.
 */

export const API_BASE = "https://soo-courtliest-stetson.ngrok-free.dev";

const HEADERS = {
  "ngrok-skip-browser-warning": "true",
};

export async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const existingHeaders = (opts.headers || {}) as Record<string, string>;
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...HEADERS, ...existingHeaders },
  });
}

export async function uploadDocument(file: File, docTypeHint: string): Promise<{ document_id: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_type_hint", docTypeHint.toLowerCase());
  const res = await apiFetch("/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return res.json();
}

export async function startAnalysis(params: {
  document_ids: string[];
  buyer_name?: string;
  property_address?: string;
  intended_use?: string;
  matter_ref?: string;
}): Promise<{ job_id: string; status: string }> {
  const res = await apiFetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Analysis failed: ${res.statusText}`);
  return res.json();
}

export async function getJobStatus(jobId: string): Promise<{
  status: string;
  stage: string;
  pct: number;
  analysis_id?: string;
  error?: string;
}> {
  const res = await apiFetch(`/jobs/${jobId}`);
  if (!res.ok) throw new Error(`Job not found: ${jobId}`);
  return res.json();
}

export async function getAnalysis(analysisId: string): Promise<Record<string, unknown>> {
  const res = await apiFetch(`/analyses/${analysisId}`);
  if (!res.ok) throw new Error(`Analysis not found: ${analysisId}`);
  return res.json();
}

export async function generateDocuments(analysisId: string): Promise<{ files: Record<string, string> }> {
  const res = await apiFetch("/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis_id: analysisId }),
  });
  if (!res.ok) throw new Error(`Generate failed: ${res.statusText}`);
  return res.json();
}

export function downloadUrl(filename: string): string {
  return `${API_BASE}/download/${encodeURIComponent(filename)}`;
}

export interface Matter {
  analysis_id: string;
  matter_ref: string;
  analysis_date: string;
  property_description: string;
  buyer_name: string;
  schedule_a: {
    proposed_insured: string;
    legal_description: string;
    policy_amount: string;
    effective_date: string;
  };
  summary: Record<string, unknown>;
  objection_count: number;
  endorsement_count: number;
  overall_risk: string;
}

export async function listMatters(): Promise<{ matters: Matter[]; count: number }> {
  const res = await apiFetch("/matters");
  if (!res.ok) throw new Error("Failed to load matters");
  return res.json();
}

export async function deleteMatter(analysisId: string): Promise<void> {
  const res = await apiFetch(`/matters/${analysisId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete matter");
}
