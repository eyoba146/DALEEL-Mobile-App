// DALEEL Admin Mobile API Client
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_STORAGE_KEY = 'daleel_admin_token';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.64.242:4000/api';

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'DESTINATION_MANAGER'
  | 'SERVICE_MANAGER'
  | 'EVENT_MANAGER'
  | 'MARKETPLACE_MANAGER'
  | 'INVESTMENT_OFFICER';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  adminRole: AdminRole;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface Destination {
  id: string;
  name: string;
  region: string;
  blurb: string;
  image: string;
  description: string;
  bestTimeToVisit?: string | null;
  elevation?: string | null;
  unescoStatus: boolean;
  rating: number;
  latitude?: number | null;
  longitude?: number | null;
  highlights?: string;
  gettingThere?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  location: string;
  address?: string | null;
  verified: boolean;
  blurb: string;
  description?: string | null;
  rating?: number;
  reviewCount?: number;
  operatingHours?: string | null;
  features?: string;
  image: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  city: string;
  venue?: string | null;
  category: string;
  price?: string | null;
  organizer?: string | null;
  agenda?: string | null;
  capacity?: number | null;
  blurb?: string | null;
  description?: string | null;
  image: string;
  verified?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  _count?: { rsvps: number };
}

export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerLocation: string;
  sellerPhone?: string | null;
  sellerWhatsapp?: string | null;
  image: string;
  images?: string | string[];
  blurb?: string | null;
  description?: string | null;
  materials?: string | null;
  origin?: string | null;
  inStock: boolean;
  status?: string;
}

export interface InvestmentOpportunity {
  id: string;
  title: string;
  sector: string;
  location: string;
  minInvestment: number;
  currency?: string;
  investmentModel?: string;
  verified?: boolean;
  status?: string;
  blurb: string;
  image: string;
  description?: string | null;
  expectedReturn?: string | null;
  timeline?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  highlights?: string;
  incentives?: string;
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

export interface SidebarCounts {
  totalPending: number;
  services: number;
  events: number;
  marketplace: number;
  investments: number;
  unverifiedUsers: number;
  reviews?: number;
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
  status: 'pending' | 'in_progress' | 'confirmed' | 'completed' | 'cancelled' | string;
  createdAt: string;
  details: Record<string, any>;
}

export interface UnifiedInquiriesResponse {
  inquiries: UnifiedInquiryItem[];
  total: number;
  counts?: {
    active: number;
    confirmed: number;
    cancelled: number;
    all: number;
  };
  userRole: string;
  accessibleModules: {
    services: boolean;
    events: boolean;
    marketplace: boolean;
    investments: boolean;
  };
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  userType: 'diaspora' | 'foreign_resident';
  country: string;
  language: string;
  isVerified: boolean;
  isActive?: boolean;
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

export interface AdminReviewItem {
  id: string;
  targetType: 'service' | 'product' | 'destination';
  targetId: string;
  userId?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  photos?: string | null;
  verified: boolean;
  status: 'approved' | 'rejected' | 'pending';
  helpfulCount: number;
  createdAt: string;
  targetTitle?: string;
  targetImage?: string;
  targetCategory?: string;
}

let inMemoryToken: string | null = null;

export async function getAdminToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  try {
    inMemoryToken = await AsyncStorage.getItem(API_STORAGE_KEY);
    return inMemoryToken;
  } catch {
    return null;
  }
}

export async function setAdminToken(token: string | null): Promise<void> {
  inMemoryToken = token;
  try {
    if (token) {
      await AsyncStorage.setItem(API_STORAGE_KEY, token);
    } else {
      await AsyncStorage.removeItem(API_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to save admin token in AsyncStorage:', err);
  }
}

export class AdminApiError extends Error {
  status: number;
  data: any;
  reason?: string;
  rsvp?: any;
  scannedCode?: string;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.reason = data?.reason;
    this.rsvp = data?.rsvp;
    this.scannedCode = data?.scannedCode;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      await setAdminToken(null);
    }
    const message = data.message || data.error || `Request failed with status ${response.status}`;
    throw new AdminApiError(message, response.status, data);
  }

  return data as T;
}

export const adminApi = {
  // Authentication
  login: async (email: string, password: string) => {
    const res = await request<{ token: string; admin: AdminUser }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (res.token) {
      await setAdminToken(res.token);
    }
    return res;
  },

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

  // Dashboard Stats & Counters
  getStats: () => request<PlatformStats>('/admin/stats'),
  getSidebarCounts: () => request<SidebarCounts>('/admin/sidebar-counts'),

  // Role-Based Unified Inquiries Triage Desk
  getUnifiedInquiries: (params?: { department?: string; status?: string; queue?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.department) q.set('department', params.department);
    if (params?.status) q.set('status', params.status);
    if (params?.queue) q.set('queue', params.queue);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return request<UnifiedInquiriesResponse>(`/admin/inquiries/unified${qs ? `?${qs}` : ''}`);
  },

  updateUnifiedInquiryStatus: (module: string, id: string, status: string) =>
    request<{ success: boolean; item: any }>(`/admin/inquiries/unified/${module}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Heritage Destinations
  getDestinations: () => request<any[]>('/admin/destinations'),
  createDestination: (data: any) =>
    request<any>('/admin/destinations', { method: 'POST', body: JSON.stringify(data) }),
  updateDestination: (id: string, data: any) =>
    request<any>(`/admin/destinations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDestination: (id: string) =>
    request<any>(`/admin/destinations/${id}`, { method: 'DELETE' }),

  // Verified Services & Partners
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

  // Events, Summits & Gate Verification
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
  checkInEventPass: (code: string, eventId?: string) =>
    request<{ success: boolean; reason: string; message: string; rsvp: any }>('/admin/events/check-in', {
      method: 'POST',
      body: JSON.stringify({ code, eventId }),
    }),
  getEventAttendance: (eventId: string) =>
    request<{
      event: { id: string; title: string; date: string; venue?: string; capacity?: number };
      metrics: {
        totalRsvps: number;
        totalTickets: number;
        checkedInCount: number;
        checkedInTickets: number;
        remainingTickets: number;
        confirmedCount: number;
        pendingCount: number;
        cancelledCount: number;
        attendanceRate: number;
        capacity: number | null;
      };
      attendees: Array<{
        id: string;
        passCode: string;
        fullName: string;
        email: string;
        phone?: string;
        ticketsCount: number;
        notes?: string;
        status: string;
        createdAt: string;
      }>;
    }>(`/admin/events/${eventId}/attendance`),
  undoEventCheckIn: (rsvpId: string) =>
    request<{ success: boolean; message: string; rsvp: any }>(`/admin/events/undo-check-in/${rsvpId}`, {
      method: 'POST',
    }),

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

  // Registered Mobile Members
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
  updateRegisteredUser: (
    id: string,
    data: { isActive?: boolean; revokeVerification?: boolean; isVerified?: boolean; phone?: string; country?: string; userType?: string }
  ) => request<RegisteredUser>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Staff Team Governance (Super Admin)
  getTeam: () => request<AdminUser[]>('/admin/team'),
  createTeamMember: (data: { name: string; email: string; password: string; adminRole: string; phone?: string }) =>
    request<AdminUser>('/admin/team', { method: 'POST', body: JSON.stringify(data) }),
  deleteTeamMember: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/team/${id}`, { method: 'DELETE' }),
  resetCoordinatorPassword: (id: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(`/admin/team/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  // Reviews Moderation
  getAdminReviews: (params?: { targetType?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.targetType) q.set('targetType', params.targetType);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return request<{
      reviews: AdminReviewItem[];
      counts: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        verified: number;
      };
    }>(`/admin/reviews${qs ? `?${qs}` : ''}`);
  },
  updateReviewStatus: (id: string, status: 'approved' | 'rejected' | 'pending') =>
    request<{ review: AdminReviewItem }>(`/admin/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  toggleReviewVerified: (id: string, verified: boolean) =>
    request<{ review: AdminReviewItem }>(`/admin/reviews/${id}/verified`, {
      method: 'PATCH',
      body: JSON.stringify({ verified }),
    }),
  deleteReview: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/reviews/${id}`, { method: 'DELETE' }),
};
