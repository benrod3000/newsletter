import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import type { ApiResponse, AnalyticsOverview, Campaign, Subscriber, DeliverabilityOverview, DnsCheckResponse } from './types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/** Centralized auth token reader - single source of truth for JWT retrieval. */
export function getAuthToken(): string | null {
  return useAuthStore.getState().token
}

const api = axios.create({
  baseURL: API_BASE,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Sessions expire (30 days), and a stale token 401s on every call. Without
 * this, each page handled that independently or not at all, leaving the
 * dashboard as empty states and spinners with no way to recover short of
 * clearing site data.
 *
 * Auth endpoints are excluded: a 401 from /api/auth/token is "wrong password",
 * which the login form reports itself. Redirecting on it would wipe the error.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url: string = error.config?.url ?? ''
    const isAuthEndpoint = url.startsWith('/api/auth/')

    if (status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().clearAuth()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──

export const authAPI = {
  login: (email: string, password: string, workspaceId?: string, turnstileToken?: string) =>
    api.post<ApiResponse>('/api/auth/token', { email, password, workspaceId, turnstile_token: turnstileToken }),
  signup: (email: string, password: string, workspaceName?: string, turnstileToken?: string) =>
    api.post<ApiResponse>('/api/auth/signup', { email, password, workspace_name: workspaceName, turnstile_token: turnstileToken }),
  verify: () => api.get<ApiResponse>('/api/auth/verify'),
  forgotPassword: (email: string, turnstileToken?: string) =>
    api.post<ApiResponse>('/api/auth/forgot-password', { email, turnstile_token: turnstileToken }),
  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse>('/api/auth/reset-password', { token, password }),
}

// ── Subscribers ──

export const subscribersAPI = {
  list: (workspaceId: string, params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ subscribers: Subscriber[]; total: number }>>(`/api/clients/${workspaceId}/subscribers`, { params }),
  create: (workspaceId: string, data: Record<string, unknown>) =>
    api.post<ApiResponse>(`/api/clients/${workspaceId}/subscribers`, data),
  remove: (workspaceId: string, id: string) =>
    api.delete<ApiResponse>(`/api/clients/${workspaceId}/subscribers/${id}`),
  bulkRemove: (workspaceId: string, ids: string[]) =>
    api.delete<ApiResponse>(`/api/clients/${workspaceId}/subscribers`, { data: { ids } }),
  exportCsv: (workspaceId: string, params?: Record<string, unknown>) =>
    api.get(`/api/clients/${workspaceId}/subscribers/export`, { params, responseType: 'blob' }),
  importCsv: (workspaceId: string, csv: string, confirmed?: boolean) =>
    api.post<ApiResponse>(`/api/clients/${workspaceId}/subscribers/import`, { csv, confirmed }),
}

// ── Campaigns / Broadcasts ──

export const campaignsAPI = {
  list: (workspaceId: string, params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ campaigns: Campaign[] }>>(`/api/clients/${workspaceId}/campaigns`, { params }),
  create: (workspaceId: string, data: Record<string, unknown>) =>
    api.post<ApiResponse>(`/api/clients/${workspaceId}/campaigns`, data),
  update: (workspaceId: string, id: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse>(`/api/clients/${workspaceId}/campaigns/${id}`, data),
  remove: (workspaceId: string, id: string) =>
    api.delete<ApiResponse>(`/api/clients/${workspaceId}/campaigns/${id}`),
  schedule: (workspaceId: string, id: string) =>
    api.patch<ApiResponse>(`/api/clients/${workspaceId}/campaigns/${id}`, { schedule_now: true }),
  sendTest: (workspaceId: string, id: string, email: string) =>
    api.post<ApiResponse>(`/api/clients/${workspaceId}/campaigns/${id}/test`, { email }),
  publish: (workspaceId: string, id: string) =>
    api.post<ApiResponse>(`/api/clients/${workspaceId}/campaigns/${id}/publish`),
}

// ── Templates ──

export const templatesAPI = {
  list: (workspaceId: string) =>
    api.get<ApiResponse>(`/api/clients/${workspaceId}/templates`),
  create: (workspaceId: string, data: Record<string, unknown>) =>
    api.post<ApiResponse>(`/api/clients/${workspaceId}/templates`, data),
}

// ── Lists / Segments ──

export const listsAPI = {
  list: (workspaceId: string) =>
    api.get<ApiResponse>(`/api/clients/${workspaceId}/subscriber-lists`),
  create: (workspaceId: string, data: Record<string, unknown>) =>
    api.post<ApiResponse>(`/api/clients/${workspaceId}/subscriber-lists`, data),
  remove: (workspaceId: string, id: string) =>
    api.delete<ApiResponse>(`/api/clients/${workspaceId}/subscriber-lists/${id}`),
}

// ── Branding ──

export const brandingAPI = {
  get: (workspaceId: string) =>
    api.get<ApiResponse>(`/api/clients/${workspaceId}/branding`),
  update: (workspaceId: string, data: Record<string, unknown>) =>
    api.put<ApiResponse>(`/api/clients/${workspaceId}/branding`, data),
  testProvider: (workspaceId: string) =>
    api.post<ApiResponse>(`/api/clients/${workspaceId}/test-provider`),
  providerStatus: (workspaceId: string) =>
    api.get<ApiResponse>(`/api/clients/${workspaceId}/provider-status`),
}

// ── Analytics ──

export const analyticsAPI = {
  overview: (workspaceId: string, params?: Record<string, unknown>) =>
    api.get<ApiResponse<AnalyticsOverview>>(`/api/clients/${workspaceId}/analytics`, { params }),
  activity: (workspaceId: string) =>
    api.get<ApiResponse>(`/api/clients/${workspaceId}/activity`),
  heatmap: (workspaceId: string) =>
    api.get<ApiResponse>(`/api/clients/${workspaceId}/analytics/heatmap`),
  sms: (workspaceId: string) =>
    api.get<ApiResponse>(`/api/clients/${workspaceId}/analytics/sms`),
  live: (workspaceId: string) =>
    api.get<ApiResponse>(`/api/clients/${workspaceId}/analytics/live`),
}

// ── Automations ──

export const automationsAPI = {
  list: (workspaceId: string, params?: Record<string, unknown>) =>
    api.get<ApiResponse>(`/api/clients/${workspaceId}/automations`, { params }),
  create: (workspaceId: string, data: Record<string, unknown>) =>
    api.post<ApiResponse>(`/api/clients/${workspaceId}/automations`, data),
}

// ── Widgets / Capture Forms ──

export const widgetsAPI = {
  list: (workspaceId: string) =>
    api.get<ApiResponse>(`/api/clients/${workspaceId}/widgets`),
  create: (workspaceId: string, data: Record<string, unknown>) =>
    api.post<ApiResponse>(`/api/clients/${workspaceId}/widgets`, data),
  update: (workspaceId: string, id: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse>(`/api/clients/${workspaceId}/widgets/${id}`, data),
  remove: (workspaceId: string, id: string) =>
    api.delete<ApiResponse>(`/api/clients/${workspaceId}/widgets/${id}`),
}

// ── Users / Team ──

export const usersAPI = {
  list: (workspaceId: string) =>
    api.get<ApiResponse>(`/api/clients/${workspaceId}/users`),
  create: (workspaceId: string, data: Record<string, unknown>) =>
    api.post<ApiResponse>(`/api/clients/${workspaceId}/users`, data),
}

// ── Deliverability ──

// These previously called /api/admin/deliverability/*, which sits behind admin
// Basic Auth — the dashboard's bearer token always 401'd, so the page never
// worked. The workspace-scoped routes share the same implementation.
export const deliverabilityAPI = {
  overview: (workspaceId: string) =>
    api.get<ApiResponse<DeliverabilityOverview>>(`/api/clients/${workspaceId}/deliverability/overview`),
  checkDns: (workspaceId: string, domain: string) =>
    api.get<ApiResponse<DnsCheckResponse>>(`/api/clients/${workspaceId}/deliverability/dns`, { params: { domain } }),
}

export default api
