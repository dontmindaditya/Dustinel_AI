import axios, { AxiosError, AxiosInstance } from "axios";
import { API_BASE_URL } from "./constants";
import type {
  AuthResponse,
  CheckinRequest,
  CheckinResponse,
  SasUrlResponse,
  WorkersListResponse,
  WorkerHistoryResponse,
  WorkerStatsResponse,
  DashboardSummary,
  AlertsResponse,
  RiskTrendDataPoint,
  PaginationParams,
} from "@/types/api";
import type { Worker } from "@/types/worker";

// Create axios instance
const createApiClient = (token?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: 30000,
  });

  client.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Auth
export const authApi = {
  login: async (azureToken: string): Promise<AuthResponse> => {
    const client = createApiClient();
    const res = await client.post("/auth/login", { token: azureToken });
    return res.data;
  },
  refresh: async (token: string): Promise<AuthResponse> => {
    const client = createApiClient(token);
    const res = await client.post("/auth/refresh");
    return res.data;
  },
  logout: async (token: string): Promise<void> => {
    const client = createApiClient(token);
    await client.post("/auth/logout");
  },
  me: async (token: string) => {
    const client = createApiClient(token);
    const res = await client.get("/auth/me");
    return res.data;
  },
};

// Check-in
export const checkinApi = {
  getSasUrl: async (
    token: string,
    type: "face" | "environment",
    workerId: string
  ): Promise<SasUrlResponse> => {
    const client = createApiClient(token);
    const res = await client.get(`/upload/sas?type=${type}&workerId=${workerId}`);
    return res.data;
  },
  submitCheckin: async (
    token: string,
    data: CheckinRequest
  ): Promise<CheckinResponse> => {
    const client = createApiClient(token);
    const res = await client.post("/checkin", data);
    return res.data;
  },
  getCheckinStatus: async (token: string, jobId: string) => {
    const client = createApiClient(token);
    const res = await client.get(`/checkin/${jobId}`);
    return res.data;
  },
};

// Workers
export const workersApi = {
  list: async (
    token: string,
    params?: PaginationParams & { search?: string; site?: string }
  ): Promise<WorkersListResponse> => {
    const client = createApiClient(token);
    const res = await client.get("/workers", { params });
    return res.data;
  },
  get: async (token: string, id: string): Promise<Worker> => {
    const client = createApiClient(token);
    const res = await client.get(`/workers/${id}`);
    return res.data;
  },
  getHistory: async (
    token: string,
    id: string,
    params?: PaginationParams
  ): Promise<WorkerHistoryResponse> => {
    const client = createApiClient(token);
    const res = await client.get(`/workers/${id}/history`, { params });
    return res.data;
  },
  getStats: async (token: string, id: string): Promise<WorkerStatsResponse> => {
    const client = createApiClient(token);
    const res = await client.get(`/workers/${id}/stats`);
    return res.data;
  },
  update: async (token: string, id: string, data: Partial<Worker>): Promise<Worker> => {
    const client = createApiClient(token);
    const res = await client.put(`/workers/${id}`, data);
    return res.data;
  },
  create: async (token: string, data: Partial<Worker>): Promise<Worker> => {
    const client = createApiClient(token);
    const res = await client.post("/workers", data);
    return res.data;
  },
};

// Admin
export const adminApi = {
  getDashboard: async (token: string): Promise<DashboardSummary> => {
    const client = createApiClient(token);
    const res = await client.get("/admin/dashboard");
    return res.data;
  },
  getAlerts: async (
    token: string,
    params?: PaginationParams & { severity?: string; status?: string; workerId?: string }
  ): Promise<AlertsResponse> => {
    const client = createApiClient(token);
    const res = await client.get("/admin/alerts", { params });
    return res.data;
  },
  resolveAlert: async (token: string, alertId: string) => {
    const client = createApiClient(token);
    const res = await client.post(`/admin/alerts/${alertId}/resolve`);
    return res.data;
  },
  getRiskTrend: async (
    token: string,
    days = 7
  ): Promise<RiskTrendDataPoint[]> => {
    const client = createApiClient(token);
    const res = await client.get(`/admin/analytics/risk-trend?days=${days}`);
    return res.data;
  },
  getCompliance: async (token: string) => {
    const client = createApiClient(token);
    const res = await client.get("/admin/analytics/compliance");
    return res.data;
  },
};

// Direct blob upload using SAS URL (bypasses backend)
export const uploadImageToBlob = async (
  sasUrl: string,
  file: Blob,
  contentType = "image/jpeg"
): Promise<void> => {
  await fetch(sasUrl, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": contentType,
    },
    body: file,
  });
};