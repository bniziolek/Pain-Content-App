const API_BASE = "/api";

export async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: "include",
    ...options,
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `API Error: ${res.status}`);
  }
  
  return res.json();
}

export function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}
