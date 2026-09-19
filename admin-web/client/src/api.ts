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
  registeredUsersCount?: number;
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  userType: 'diaspora' | 'foreign_resident';
  country: string;
  language: string;
  isVerified: boolean;
  phone?: string | null;
  savedAddress?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    favorites: number;
    serviceInquiries: number;
    eventRsvps: number;
    productOrderInquiries: number;
    investmentInquiries: number;
  };
}

export interface UnifiedInquiryItem {
  id: string;
  module: 'SERVICES' | 'EVENTS' | 'MARKETPLACE' | 'INVESTMENTS';
  moduleLabel: string;
  title: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerWhatsapp?: string | null;
  status: string;
  createdAt: string;
  details: Record<string, any>;
}

export interface UnifiedInquiriesResponse {
  inquiries: UnifiedInquiryItem[];
  total: number;
  userRole: string;
  accessibleModules: {
    services: boolean;
    events: boolean;
    marketplace: boolean;
    investments: boolean;
  };
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

  // Registered Mobile Members Directory (Super Admin)
  getRegisteredUsers: (params?: { search?: string; userType?: string; isVerified?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.userType) q.set('userType', params.userType);
    if (params?.isVerified) q.set('isVerified', params.isVerified);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return request<{ users: RegisteredUser[]; total: number; page: number; totalPages: number }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  updateRegisteredUser: (id: string, data: { isVerified?: boolean; phone?: string; country?: string; userType?: string }) =>
    request<RegisteredUser>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Role-Based Master Triage Desk
  getUnifiedInquiries: (params?: { department?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.department) q.set('department', params.department);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return request<UnifiedInquiriesResponse>(`/admin/inquiries/unified${qs ? `?${qs}` : ''}`);
  },

  updateUnifiedInquiryStatus: (module: string, id: string, status: string) =>
    request<{ success: boolean; item: any }>(`/admin/inquiries/unified/${module}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
