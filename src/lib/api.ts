/**
 * API Client для замены Supabase
 * Все запросы к собственному backend API
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://ayvazyan-rekomenduet.ru:3000/api';

// JWT Token storage
let authToken: string | null = localStorage.getItem('auth_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

// Helper: make API request
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      return { error: json.error || json.message || 'Request failed' };
    }

    return { data: json.data || json };
  } catch (error) {
    console.error('API Request Error:', error);
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

// Admin Auth
export const adminAuth = {
  async signIn(email: string, password: string) {
    return apiRequest<{ token: string; user: any }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signOut() {
    setAuthToken(null);
    return { error: null };
  },
};

// Partners
export const partners = {
  async list(filters?: { status?: string; city?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams(filters as any);
    return apiRequest<any[]>(`/partners?${params}`);
  },

  async get(id: string) {
    return apiRequest<any>(`/partners/${id}`);
  },

  async create(data: any) {
    return apiRequest<any>('/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiRequest<any>(`/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string, permanent = false) {
    return apiRequest<any>(`/partners/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  },
};

// Applications
export const applications = {
  async list(filters?: { status?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams(filters as any);
    return apiRequest<any[]>(`/applications?${params}`);
  },

  async get(id: string) {
    return apiRequest<any>(`/applications/${id}`);
  },

  async create(data: any) {
    return apiRequest<any>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async approve(id: string, moderated_by: string) {
    return apiRequest<any>(`/applications/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ moderated_by }),
    });
  },

  async reject(id: string, moderated_by: string, rejection_reason: string) {
    return apiRequest<any>(`/applications/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ moderated_by, rejection_reason }),
    });
  },
};

// Orders
export const orders = {
  async list(filters?: { status?: string; category?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams(filters as any);
    return apiRequest<any[]>(`/orders?${params}`);
  },

  async create(data: any) {
    return apiRequest<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Questions
export const questions = {
  async list(filters?: { status?: string; category?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams(filters as any);
    return apiRequest<any[]>(`/questions?${params}`);
  },

  async create(data: any) {
    return apiRequest<any>('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Categories
export const categories = {
  async list(is_active?: boolean) {
    const params = is_active !== undefined ? `?is_active=${is_active}` : '';
    return apiRequest<any[]>(`/categories${params}`);
  },
};

// Upload
export const upload = {
  async file(file: File): Promise<{ data?: { url: string }; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        return { error: json.error || 'Upload failed' };
      }

      return { data: { url: json.url } };
    } catch (error) {
      console.error('Upload Error:', error);
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  },
};

// Telegram
export const telegram = {
  async publishPartner(partner_id: string) {
    return apiRequest<{ channel_post_id: number }>('/telegram/publish-partner', {
      method: 'POST',
      body: JSON.stringify({ partner_id }),
    });
  },

  async updatePartnerPost(partner_id: string) {
    return apiRequest<any>('/telegram/update-partner-post', {
      method: 'POST',
      body: JSON.stringify({ partner_id }),
    });
  },

  async deletePartnerPost(partner_id: string) {
    return apiRequest<any>(`/telegram/delete-partner-post/${partner_id}`, {
      method: 'DELETE',
    });
  },

  async notify(user_id: number, text: string) {
    return apiRequest<any>('/telegram/notify', {
      method: 'POST',
      body: JSON.stringify({ user_id, text }),
    });
  },

  async checkChannel(user_id: number) {
    return apiRequest<{ isSubscribed: boolean; status: string }>('/telegram/check-channel', {
      method: 'POST',
      body: JSON.stringify({ user_id }),
    });
  },
};

// Admin Stats
export const admin = {
  async getStats() {
    return apiRequest<any>('/admin/stats');
  },
};

// Geocoding
export const geocode = {
  async address(address: string) {
    return apiRequest<{ suggestions: any[] }>('/telegram/geocode-address', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  },

  async city(city: string) {
    return apiRequest<{ suggestions: any[]; exactMatch?: boolean }>('/telegram/geocode-city', {
      method: 'POST',
      body: JSON.stringify({ city }),
    });
  },
};

// Export default client object
export default {
  auth: adminAuth,
  partners,
  applications,
  orders,
  questions,
  categories,
  upload,
  telegram,
  admin,
  geocode,
  professions: {
    async list(is_active?: boolean) {
      const params = is_active !== undefined ? `?is_active=${is_active}` : '';
      return apiRequest<any[]>(`/professions${params}`);
    },
    async create(data: any) {
      return apiRequest<any>('/professions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async update(id: string, data: any) {
      return apiRequest<any>(`/professions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    async delete(id: string) {
      return apiRequest<any>(`/professions/${id}`, {
        method: 'DELETE',
      });
    },
  },
  settings: {
    async getAll() {
      return apiRequest<Record<string, string>>('/settings');
    },
    async get(key: string) {
      return apiRequest<string>(`/settings/${key}`);
    },
    async set(key: string, value: string) {
      return apiRequest<any>(`/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
    },
    async getFormFields(formType: string) {
      return apiRequest<any[]>(`/settings/form-fields/${formType}`);
    },
    async updateFormField(id: string, data: any) {
      return apiRequest<any>(`/settings/form-fields/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },
  cardTemplates: {
    async list() {
      return apiRequest<any[]>('/card-templates');
    },
    async create(formData: FormData) {
      try {
        const headers: HeadersInit = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        const response = await fetch(`${API_URL}/card-templates`, {
          method: 'POST',
          headers,
          body: formData,
        });
        const json = await response.json();
        if (!response.ok) {
          return { error: json.error || 'Request failed' };
        }
        return { data: json.data };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Network error' };
      }
    },
    async delete(id: string) {
      return apiRequest<any>(`/card-templates/${id}`, {
        method: 'DELETE',
      });
    },
  },
};
