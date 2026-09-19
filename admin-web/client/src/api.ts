// DALEEL Admin Portal API Client

const BASE_URL = 'http://localhost:4000/api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  adminRole: 'SUPER_ADMIN' | 'DESTINATION_MANAGER' | 'SERVICE_MANAGER' | 'EVENT_MANAGER' | 'MARKETPLACE_MANAGER' | 'INVESTMENT_OFFICER';
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface PlatformStats {
  destinationsCount: number;
  servicesCount: number;
  eventsCount: number;
  productsCount: number;
  investmentsCount: number;
  serviceInquiriesCount: number;
  productOrdersCount: number;
  eventRsvpsCount: number;
  investmentInquiriesCount: number;
  adminTeamCount: number;
}

function getStoredToken(): string | null {
  return localStorage.getItem('daleel_admin_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('daleel_admin_token', token);
  } else {
    localStorage.removeItem('daleel_admin_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      setStoredToken(null);
    }
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const adminApi = {
  // Authentication
  login: (email: string, password: string) =>
    request<{ token: string; admin: AdminUser }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string; coordinatorName?: string }>('/admin/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getMe: () => request<AdminUser>('/admin/me'),

  updateProfile: (data: { name?: string; phone?: string; avatarUrl?: string }) =>
    request<AdminUser>('/admin/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Media & Photo Upload
  uploadImage: (imageBase64: string) =>
    request<{ url: string; filename: string }>('/admin/upload', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    }),

  // Metrics
  getStats: () => request<PlatformStats>('/admin/stats'),

  // Team Management (Super Admin)
  getTeam: () => request<AdminUser[]>('/admin/team'),
  createTeamMember: (data: { name: string; email: string; password: string; adminRole: string; phone?: string }) =>
    request<AdminUser>('/admin/team', { method: 'POST', body: JSON.stringify(data) }),
  updateTeamMember: (id: string, data: Partial<{ name: string; adminRole: string; phone: string; password: string }>) =>
    request<AdminUser>(`/admin/team/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTeamMember: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/team/${id}`, { method: 'DELETE' }),
  resetCoordinatorPassword: (id: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(`/admin/team/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  // Heritage Destinations
  getDestinations: () => request<any[]>('/admin/destinations'),
  createDestination: (data: any) =>
    request<any>('/admin/destinations', { method: 'POST', body: JSON.stringify(data) }),
  updateDestination: (id: string, data: any) =>
    request<any>(`/admin/destinations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDestination: (id: string) =>
    request<any>(`/admin/destinations/${id}`, { method: 'DELETE' }),

  // Verified Services
  getServices: () => request<any[]>('/admin/services'),
  createService: (data: any) =>
    request<any>('/admin/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id: string, data: any) =>
    request<any>(`/admin/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id: string) =>
    request<any>(`/admin/services/${id}`, { method: 'DELETE' }),
  getServiceInquiries: () => request<any[]>('/admin/services-inquiries'),
  updateServiceInquiryStatus: (id: string, status: string) =>
    request<any>(`/admin/services-inquiries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Events & Gatherings
  getEvents: () => request<any[]>('/admin/events'),
  createEvent: (data: any) =>
    request<any>('/admin/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: string, data: any) =>
    request<any>(`/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: string) =>
    request<any>(`/admin/events/${id}`, { method: 'DELETE' }),
  getEventRsvps: () => request<any[]>('/admin/events-rsvps'),
  updateEventRsvpStatus: (id: string, status: string) =>
    request<any>(`/admin/events-rsvps/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Artisan Marketplace
  getProducts: () => request<any[]>('/admin/products'),
  createProduct: (data: any) =>
    request<any>('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) =>
    request<any>(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request<any>(`/admin/products/${id}`, { method: 'DELETE' }),
  getOrders: () => request<any[]>('/admin/orders'),
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Diaspora Investments
  getInvestments: () => request<any[]>('/admin/investments'),
  createInvestment: (data: any) =>
    request<any>('/admin/investments', { method: 'POST', body: JSON.stringify(data) }),
  updateInvestment: (id: string, data: any) =>
    request<any>(`/admin/investments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvestment: (id: string) =>
    request<any>(`/admin/investments/${id}`, { method: 'DELETE' }),
  getInvestmentInquiries: () => request<any[]>('/admin/investments-inquiries'),
  updateInvestmentInquiryStatus: (id: string, status: string) =>
    request<any>(`/admin/investments-inquiries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
