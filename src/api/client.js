// src/api/client.js - Unified API Service client for full-stack communication
const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP ${response.status} Error`);
  }

  return response.json();
}

export const api = {
  // Authentication
  auth: {
    register: (name, email, password) => {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
    },
    login: (email, password) => {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
    me: () => request('/auth/me'),
    requestPasswordReset: (email) => {
      return request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    verifyResetToken: (email, token) => {
      return request('/auth/verify-reset-token', {
        method: 'POST',
        body: JSON.stringify({ email, token }),
      });
    },
    resetPassword: (email, token, newPassword) => {
      return request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token, newPassword }),
      });
    },
  },

  // Previews CRUD
  previews: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/previews?${query}`);
    },
    create: (url, collectionId = null) => {
      return request('/previews', {
        method: 'POST',
        body: JSON.stringify({ url, collectionId }),
      });
    },
    assignCollection: (id, collectionId) => {
      return request(`/previews/${id}/collection`, {
        method: 'PATCH',
        body: JSON.stringify({ collectionId }),
      });
    },
    duplicate: (id) => {
      return request(`/previews/${id}/duplicate`, {
        method: 'POST',
      });
    },
    delete: (id) => {
      return request(`/previews/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Collections CRUD
  collections: {
    list: () => request('/collections'),
    create: (name, description = '') => {
      return request('/collections', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
    },
    update: (id, name, description = '') => {
      return request(`/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description }),
      });
    },
    delete: (id) => {
      return request(`/collections/${id}`, {
        method: 'DELETE',
      });
    },
    removePreview: (collectionId, previewId) => {
      return request(`/collections/${collectionId}/remove-preview`, {
        method: 'PATCH',
        body: JSON.stringify({ previewId }),
      });
    },
  },

  // API Keys CRUD
  apiKeys: {
    list: () => request('/apikeys'),
    create: (name) => {
      return request('/apikeys', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    },
    regenerate: (id) => {
      return request(`/apikeys/${id}/regenerate`, {
        method: 'POST',
      });
    },
    delete: (id) => {
      return request(`/apikeys/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Dashboard Metrics
  analytics: {
    get: () => request('/analytics'),
  },
};
