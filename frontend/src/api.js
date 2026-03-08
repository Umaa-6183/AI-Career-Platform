/**
 * CareerIQ Pro — API Client
 * Centralized fetch wrapper with auth headers, error handling, and retry logic
 */

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const TIMEOUT_MS = 10_000;

// ── Token management ──────────────────────────────────────────────────────────

export const getAccessToken = () => sessionStorage.getItem("ciq_access_token");
export const getRefreshToken = () => sessionStorage.getItem("ciq_refresh_token");
export const setTokens = (access, refresh) => {
  sessionStorage.setItem("ciq_access_token", access);
  if (refresh) sessionStorage.setItem("ciq_refresh_token", refresh);
};
export const clearTokens = () => {
  sessionStorage.removeItem("ciq_access_token");
  sessionStorage.removeItem("ciq_refresh_token");
};


// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function apiRequest(endpoint, options = {}, retries = 1) {
  const token = getAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Token expired — try refresh once
    if (res.status === 401 && retries > 0) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiRequest(endpoint, options, 0);
      }
      clearTokens();
      window.location.reload();
      return null;
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, errorData.detail || errorData.message || "Request failed", errorData);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new ApiError(408, "Request timeout");
    }
    if (err instanceof ApiError) throw err;
    // Network error — return null for graceful fallback
    console.warn(`API unavailable (${endpoint}): ${err.message}`);
    return null;
  }
}


async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}


class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}


// ── API Methods ───────────────────────────────────────────────────────────────

export const api = {
  // Auth
  auth: {
    register: (payload) => apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
    login: (email, password) => apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    logout: (refreshToken) => apiRequest("/api/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) }),
    refresh: (refreshToken) => apiRequest("/api/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) }),
  },

  // Resume
  resume: {
    analyze: (resumeText, targetRole) => apiRequest("/api/resume/analyze", { method: "POST", body: JSON.stringify({ resume_text: resumeText, target_role: targetRole }) }),
    optimizeATS: (resumeText, jobDescription) => apiRequest("/api/resume/ats-optimize", { method: "POST", body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }) }),
  },

  // Salary
  salary: {
    normalize: (role, years, skills, location) => apiRequest("/api/salary/normalize", { method: "POST", body: JSON.stringify({ role, experience_years: years, skills, location }) }),
    levels: () => apiRequest("/api/salary-levels"),
  },

  // Jobs
  jobs: {
    match: (payload) => apiRequest("/api/jobs/match", { method: "POST", body: JSON.stringify(payload) }),
    search: (query, params = {}) => apiRequest("/api/jobs/search", { method: "POST", body: JSON.stringify({ query, ...params }) }),
    save: (jobId) => apiRequest(`/api/jobs/${jobId}/save`, { method: "POST" }),
    apply: (jobId, notes) => apiRequest(`/api/jobs/${jobId}/apply`, { method: "POST", body: JSON.stringify({ notes }) }),
  },

  // Skills
  skills: {
    gap: (currentSkills, targetRole) => apiRequest("/api/skills/gap", { method: "POST", body: JSON.stringify({ current_skills: currentSkills, target_role: targetRole }) }),
    update: (skillData) => apiRequest("/api/skills/update", { method: "POST", body: JSON.stringify(skillData) }),
    delete: (skillName) => apiRequest(`/api/skills/${skillName}`, { method: "DELETE" }),
    resources: (skill) => apiRequest(`/api/resources/${encodeURIComponent(skill)}`),
  },

  // Market
  market: {
    insights: () => apiRequest("/api/market/insights"),
    trending: () => apiRequest("/api/market/trending-skills"),
    benchmarks: () => apiRequest("/api/market/salary-benchmarks"),
    benchmark: (payload) => apiRequest("/api/market/benchmark", { method: "POST", body: JSON.stringify(payload) }),
  },

  // Career
  career: {
    forecast: (payload) => apiRequest("/api/career/growth-forecast", { method: "GET" }),
    portfolio: (skills, role) => apiRequest("/api/portfolio/recommend", { method: "POST", body: JSON.stringify({ skills, target_role: role }) }),
    sideHustles: () => apiRequest("/api/side-hustles"),
  },

  // Progress
  progress: {
    update: (payload) => apiRequest("/api/progress/update", { method: "POST", body: JSON.stringify(payload) }),
    history: () => apiRequest("/api/progress/history"),
    scores: () => apiRequest("/api/progress/scores"),
  },

  // User
  user: {
    profile: () => apiRequest("/api/user/profile"),
    update: (payload) => apiRequest("/api/user/profile", { method: "PUT", body: JSON.stringify(payload) }),
    delete: () => apiRequest("/api/user/delete", { method: "DELETE" }),
    export: () => apiRequest("/api/user/export"),
  },

  // Health
  health: () => apiRequest("/health"),
};

export default api;
