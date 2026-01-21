import { fetchAPI, jsonHeaders } from "./base";

export interface PDFGenerationOptions {
  pageSize?: 'letter' | 'a4';
  includeTableOfContents?: boolean;
  coverPageMessage?: string;
  clinicianName?: string;
  patientName?: string;
  packetTitle?: string;
}

// Generate PDF from screening
export async function generatePDFFromScreening(
  screeningId: string, 
  options: PDFGenerationOptions = {}
): Promise<Blob> {
  const res = await fetch(`/api/packets/${screeningId}/generate-pdf`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders(),
    body: JSON.stringify(options),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `API Error: ${res.status}`);
  }
  
  return res.blob();
}

// Generate PDF from content IDs
export async function generatePDFFromContent(
  contentIds: string[],
  options: PDFGenerationOptions = {}
): Promise<Blob> {
  const res = await fetch("/api/content/generate-pdf", {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders(),
    body: JSON.stringify({ contentIds, ...options }),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `API Error: ${res.status}`);
  }
  
  return res.blob();
}

// Download PDF helper
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
