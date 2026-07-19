import axios from 'axios'

import { useAuthStore } from '../stores/authStore'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/** Centralized auth token reader — single source of truth for JWT retrieval. */
export function getAuthToken() {
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

export const authAPI = {
  login: (email, password, workspaceId, turnstileToken) =>
    api.post('/api/auth/token', { email, password, workspaceId, turnstile_token: turnstileToken }),
  signup: (email, password, workspaceName, turnstileToken) =>
    api.post('/api/auth/signup', { email, password, workspace_name: workspaceName, turnstile_token: turnstileToken }),
  verify: () => api.get('/api/auth/verify'),
}

// list/create existed already. remove() calls the new
// DELETE /api/clients/{workspaceId}/subscribers/{id} route added to
// newsletter-core today. (Unsubscribing is a separate, public,
// token-based flow // /api/unsubscribe // not this.)
export const subscribersAPI = {
  list: (workspaceId, params) =>
    api.get(`/api/clients/${workspaceId}/subscribers`, { params }),
  create: (workspaceId, data) =>
    api.post(`/api/clients/${workspaceId}/subscribers`, data),
  remove: (workspaceId, id) =>
    api.delete(`/api/clients/${workspaceId}/subscribers/${id}`),
  bulkRemove: (workspaceId, ids) =>
    api.delete(`/api/clients/${workspaceId}/subscribers`, { data: { ids } }),
  exportCsv: (workspaceId, params) =>
    api.get(`/api/clients/${workspaceId}/subscribers/export`, {
      params,
      responseType: 'blob',
    }),
  importCsv: (workspaceId, csv, confirmed = false) =>
    api.post(`/api/clients/${workspaceId}/subscribers/import`, { csv, confirmed }),
}

// list/create existed already. update()/remove() call the new
// PATCH and DELETE /api/clients/{workspaceId}/campaigns/{id} routes.
// Both only work on campaigns still in "draft" status. schedule() is a thin
// wrapper around update() for the common "send now" action // it flips the
// campaign to status=scheduled with scheduled_for=now. Actual delivery is
// still handled by the backend's admin sweep job
// (app/api/admin/campaigns/process), which needs to run on a schedule.
export const campaignsAPI = {
  list: (workspaceId, params) =>
    api.get(`/api/clients/${workspaceId}/campaigns`, { params }),
  create: (workspaceId, data) =>
    api.post(`/api/clients/${workspaceId}/campaigns`, data),
  update: (workspaceId, id, data) =>
    api.patch(`/api/clients/${workspaceId}/campaigns/${id}`, data),
  remove: (workspaceId, id) =>
    api.delete(`/api/clients/${workspaceId}/campaigns/${id}`),
  schedule: (workspaceId, id) =>
    api.patch(`/api/clients/${workspaceId}/campaigns/${id}`, { schedule_now: true }),
  sendTest: (workspaceId, id, email) =>
    api.post(`/api/clients/${workspaceId}/campaigns/${id}/test`, { email }),
  publish: (workspaceId, id) =>
    api.post(`/api/clients/${workspaceId}/campaigns/${id}/publish`),
}

export const templatesAPI = {
  list: (workspaceId) =>
    api.get(`/api/clients/${workspaceId}/templates`),
  create: (workspaceId, data) =>
    api.post(`/api/clients/${workspaceId}/templates`, data),
}

// list/create existed already. remove() calls the new
// DELETE /api/clients/{workspaceId}/subscriber-lists/{id} route.
export const listsAPI = {
  list: (workspaceId) =>
    api.get(`/api/clients/${workspaceId}/subscriber-lists`),
  create: (workspaceId, data) =>
    api.post(`/api/clients/${workspaceId}/subscriber-lists`, data),
  remove: (workspaceId, id) =>
    api.delete(`/api/clients/${workspaceId}/subscriber-lists/${id}`),
}

export const brandingAPI = {
  get: (workspaceId) =>
    api.get(`/api/clients/${workspaceId}/branding`),
  update: (workspaceId, data) =>
    api.put(`/api/clients/${workspaceId}/branding`, data),
  testProvider: (workspaceId) =>
    api.post(`/api/clients/${workspaceId}/test-provider`),
  providerStatus: (workspaceId) =>
    api.get(`/api/clients/${workspaceId}/provider-status`),
}

// This route didn't exist in newsletter-core before today // added at
// app/api/clients/[workspaceId]/analytics/route.ts (JWT-authenticated,
// same pattern as the other client routes). See that file for the exact
// response shape.
export const analyticsAPI = {
  overview: (workspaceId, params) =>
    api.get(`/api/clients/${workspaceId}/analytics`, { params }),
  activity: (workspaceId) =>
    api.get(`/api/clients/${workspaceId}/activity`),
  heatmap: (workspaceId) =>
    api.get(`/api/clients/${workspaceId}/analytics/heatmap`),
  sms: (workspaceId) =>
    api.get(`/api/clients/${workspaceId}/analytics/sms`),
  live: (workspaceId) =>
    api.get(`/api/clients/${workspaceId}/analytics/live`),
}

export const automationsAPI = {
  list: (workspaceId, params) =>
    api.get(`/api/clients/${workspaceId}/automations`, { params }),
  create: (workspaceId, data) =>
    api.post(`/api/clients/${workspaceId}/automations`, data),
}

// Embeddable signup form widgets ("email for media")
export const widgetsAPI = {
  list: (workspaceId) =>
    api.get(`/api/clients/${workspaceId}/widgets`),
  create: (workspaceId, data) =>
    api.post(`/api/clients/${workspaceId}/widgets`, data),
  update: (workspaceId, id, data) =>
    api.patch(`/api/clients/${workspaceId}/widgets/${id}`, data),
  remove: (workspaceId, id) =>
    api.delete(`/api/clients/${workspaceId}/widgets/${id}`),
}

export const usersAPI = {
  list: (workspaceId) =>
    api.get(`/api/clients/${workspaceId}/users`),
  create: (workspaceId, data) =>
    api.post(`/api/clients/${workspaceId}/users`, data),
}

export default api
