// Central API client. Swap EXPO_PUBLIC_API_URL in a .env file once the
// backend is deployed — everything else in the app calls through here,
// so no screen needs to change when you wire it to the real server.

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data.error || data.message || JSON.stringify(data);
    } catch {
      message = await res.text().catch(() => res.statusText);
    }
    throw new ApiError(message || 'Request failed', res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Auth endpoints (match these routes on the Express backend) ---

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: 'diaspora' | 'foreign_resident';
  country: string;
  language: 'en' | 'am';
  isVerified: boolean;
  avatarUrl: string | null;
};

export type AuthResponse = { user: AuthUser; token: string };

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    userType: 'diaspora' | 'foreign_resident';
    country: string;
    language: 'en' | 'am';
  }) => apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: data }),

  login: (data: { email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: data }),

  me: (token: string) => apiRequest<AuthUser>('/auth/me', { token }),

  verifyEmail: (data: { email: string; code: string }) =>
    apiRequest<{ message: string }>('/auth/verify-email', { method: 'POST', body: data }),

  resendVerification: (token: string) =>
    apiRequest<{ message: string }>('/auth/resend-verification', { method: 'POST', token }),

  changePendingEmail: (token: string, newEmail: string) =>
    apiRequest<{ message: string; email: string }>('/auth/change-pending-email', { method: 'PATCH', body: { newEmail }, token }),

  forgotPassword: (data: { email: string }) =>
    apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: data }),

  verifyResetCode: (data: { email: string; code: string }) =>
    apiRequest<{ message: string }>('/auth/verify-reset-code', { method: 'POST', body: data }),

  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    apiRequest<{ message: string }>('/auth/reset-password', { method: 'POST', body: data }),

  updateProfile: (
    token: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      avatarUrl?: string | null;
      userType?: 'diaspora' | 'foreign_resident';
      country?: string;
      language?: 'en' | 'am';
    }
  ) => apiRequest<{ user: AuthUser }>('/auth/profile', { method: 'PATCH', body: data, token }),

  uploadAvatar: (token: string, base64: string) =>
    apiRequest<{ user: AuthUser; avatarUrl: string }>('/auth/avatar-upload', {
      method: 'POST',
      body: { image: base64 },
      token,
    }),

  changePassword: (token: string, data: { currentPassword: string; newPassword: string }) =>
    apiRequest<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: data,
      token,
    }),
};

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('/uploads/')) {
      try {
        const backendOrigin = BASE_URL.replace(/\/api\/?$/, '');
        const uploadPath = url.substring(url.indexOf('/uploads/'));
        return `${backendOrigin}${uploadPath}`;
      } catch {
        return url;
      }
    }
    return url;
  }
  if (url.startsWith('/')) {
    const backendOrigin = BASE_URL.replace(/\/api\/?$/, '');
    return `${backendOrigin}${url}`;
  }
  return url;
}

export type Destination = {
  id: string;
  name: string;
  region: string;
  blurb: string;
  image: string;
  description?: string | null;
  bestTimeToVisit?: string | null;
  elevation?: string | null;
  unescoStatus?: boolean;
  highlights?: string | null;
  gettingThere?: string | null;
  rating?: number;
};

export type Service = {
  id: string;
  name: string;
  category: string;
  location: string;
  verified: boolean;
  blurb: string;
  image: string;
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  rating?: number;
  reviewCount?: number;
  operatingHours?: string | null;
  features?: string | null;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  city: string;
  category: string;
  image: string;
};

export type Favorite = {
  id: string;
  userId: string;
  itemType: 'destination' | 'service' | 'event';
  itemId: string;
  createdAt: string;
};

export type ServiceInquiryPayload = {
  fullName: string;
  contactEmail: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  timeframe?: string;
  message: string;
};

export const contentApi = {
  destinations: () => apiRequest<Destination[]>('/destinations'),
  destination: (id: string) => apiRequest<Destination>(`/destinations/${id}`),
  services: (category?: string) =>
    apiRequest<Service[]>(category ? `/services?category=${encodeURIComponent(category)}` : '/services'),
  service: (id: string) => apiRequest<Service>(`/services/${id}`),
  createInquiry: (serviceId: string, data: ServiceInquiryPayload, token?: string | null) =>
    apiRequest<{ success: boolean; message: string; inquiry: any }>(`/services/${serviceId}/inquiry`, {
      method: 'POST',
      body: data,
      token,
    }),
  events: () => apiRequest<EventItem[]>('/events'),
};

export const favoritesApi = {
  list: (token: string) => apiRequest<Favorite[]>('/favorites', { token }),
  add: (token: string, itemType: 'destination' | 'service' | 'event', itemId: string) =>
    apiRequest<Favorite>('/favorites', { method: 'POST', body: { itemType, itemId }, token }),
  remove: (token: string, id: string) =>
    apiRequest<void>(`/favorites/${id}`, { method: 'DELETE', token }),
  removeByItem: (token: string, itemType: 'destination' | 'service' | 'event', itemId: string) =>
    apiRequest<void>('/favorites', { method: 'DELETE', body: { itemType, itemId }, token }),
};

