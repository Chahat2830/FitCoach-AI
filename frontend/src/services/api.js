const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`Cannot connect to the backend at ${API_BASE}. Start FastAPI and check VITE_API_URL.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.detail === "string"
      ? data.detail
      : data.message || `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return data;
}

export async function uploadBodyScan(images) {
  const formData = new FormData();
  for (const view of ["front", "back", "side"]) {
    if (!images[view]?.file) throw new Error(`Please select the ${view} photo.`);
    formData.append(view, images[view].file);
  }
  return apiRequest("/api/upload-body-scan", { method: "POST", body: formData });
}

export const getDashboardData = () => apiRequest("/api/dashboard-data");
export const generateRecommendations = () => apiRequest("/api/ai-recommendations", { method: "POST" });
export const getLatestRecommendations = () => apiRequest("/api/ai-recommendations/latest");
