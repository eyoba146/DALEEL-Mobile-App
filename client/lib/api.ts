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

export type SupportedLanguage = 'en' | 'am' | 'om' | 'ar';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: 'diaspora' | 'foreign_resident';
  country: string;
  language: SupportedLanguage;
  isVerified: boolean;
  avatarUrl: string | null;
  savedAddress?: string | null;
  savedLatitude?: number | null;
  savedLongitude?: number | null;
};

export type AuthResponse = { user: AuthUser; token: string };

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    userType: 'diaspora' | 'foreign_resident';
    country: string;
    language: SupportedLanguage;
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
      language?: SupportedLanguage;
      savedAddress?: string | null;
      savedLatitude?: number | null;
      savedLongitude?: number | null;
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
  latitude?: number | null;
  longitude?: number | null;
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
  latitude?: number | null;
  longitude?: number | null;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  city: string;
  venue?: string | null;
  address?: string | null;
  category: string;
  price?: string | null;
  organizer?: string | null;
  blurb?: string | null;
  description?: string | null;
  agenda?: string | null;
  capacity?: number | null;
  verified?: boolean;
  image: string;
  latitude?: number | null;
  longitude?: number | null;
  _count?: { rsvps: number };
};

export type EventRsvpPayload = {
  fullName: string;
  email: string;
  phone?: string;
  ticketsCount?: number;
  notes?: string;
};

export type InvestmentOpportunity = {
  id: string;
  title: string;
  sector: string;
  location: string;
  minInvestment: number;
  currency: string;
  expectedReturn?: string | null;
  investmentModel?: string | null;
  timeline?: string | null;
  verified: boolean;
  blurb: string;
  image: string;
  description?: string | null;
  highlights?: string | null;
  incentives?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: string;
  createdAt?: string;
};

export type InvestmentInquiryPayload = {
  fullName: string;
  contactEmail: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  investmentBudget?: string;
  timeframe?: string;
  message: string;
};

export type Product = {
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
  images?: string | null;
  blurb: string;
  description?: string | null;
  materials?: string | null;
  origin?: string | null;
  inStock: boolean;
  status: string;
  createdAt?: string;
};

export type ProductOrderInquiryPayload = {
  fullName: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  quantity: number;
  deliveryAddress: string;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  notes?: string;
};

export type ProductOrderInquiry = {
  id: string;
  productId: string;
  userId?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  quantity: number;
  deliveryAddress: string;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  notes?: string | null;
  status: 'pending' | 'confirmed' | 'dispatched' | 'cancelled' | string;
  createdAt: string;
  product?: Product;
};

export type Favorite = {
  id: string;
  userId: string;
  itemType: 'destination' | 'service' | 'event' | 'investment' | 'product';
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
  events: (category?: string) =>
    apiRequest<EventItem[]>(category && category !== 'All' ? `/events?category=${encodeURIComponent(category)}` : '/events'),
  event: (id: string) => apiRequest<EventItem>(`/events/${id}`),
  createEventRsvp: (eventId: string, data: EventRsvpPayload, token?: string | null) =>
    apiRequest<{ success: boolean; message: string; rsvp: any }>(`/events/${eventId}/rsvp`, {
      method: 'POST',
      body: data,
      token,
    }),
  investments: (sector?: string) =>
    apiRequest<InvestmentOpportunity[]>(sector ? `/investments?sector=${encodeURIComponent(sector)}` : '/investments'),
  investment: (id: string) => apiRequest<InvestmentOpportunity>(`/investments/${id}`),
  createInvestmentInquiry: (opportunityId: string, data: InvestmentInquiryPayload, token?: string | null) =>
    apiRequest<{ success: boolean; message: string; inquiry: any }>(`/investments/${opportunityId}/inquiry`, {
      method: 'POST',
      body: data,
      token,
    }),
  products: (category?: string) =>
    apiRequest<Product[]>(category && category !== 'All' ? `/products?category=${encodeURIComponent(category)}` : '/products'),
  product: (id: string) => apiRequest<Product>(`/products/${id}`),
  createProductOrderInquiry: (productId: string, data: ProductOrderInquiryPayload, token?: string | null) =>
    apiRequest<{ success: boolean; message: string; inquiry: ProductOrderInquiry }>(`/products/${productId}/order-inquiry`, {
      method: 'POST',
      body: data,
      token,
    }),
  getMyProductInquiry: (productId: string, token?: string | null, email?: string) =>
    apiRequest<ProductOrderInquiry | null>(
      `/products/${productId}/my-inquiry${email ? `?email=${encodeURIComponent(email)}` : ''}`,
      { token }
    ),
  getMyProductInquiries: (token?: string | null, email?: string) =>
    apiRequest<ProductOrderInquiry[]>(
      `/products/inquiries/my${email ? `?email=${encodeURIComponent(email)}` : ''}`,
      { token }
    ),
  updateProductOrderInquiry: (
    inquiryId: string,
    data: Partial<ProductOrderInquiryPayload>,
    token?: string | null
  ) =>
    apiRequest<{ success: boolean; message: string; inquiry: ProductOrderInquiry }>(
      `/products/inquiries/${inquiryId}`,
      {
        method: 'PATCH',
        body: data,
        token,
      }
    ),
  cancelProductOrderInquiry: (inquiryId: string, token?: string | null) =>
    apiRequest<{ success: boolean; message: string; inquiry: ProductOrderInquiry }>(
      `/products/inquiries/${inquiryId}/cancel`,
      {
        method: 'PATCH',
        token,
      }
    ),
};

export const favoritesApi = {
  list: (token: string) => apiRequest<Favorite[]>('/favorites', { token }),
  add: (token: string, itemType: 'destination' | 'service' | 'event' | 'investment' | 'product', itemId: string) =>
    apiRequest<Favorite>('/favorites', { method: 'POST', body: { itemType, itemId }, token }),
  remove: (token: string, id: string) =>
    apiRequest<void>(`/favorites/${id}`, { method: 'DELETE', token }),
  removeByItem: (token: string, itemType: 'destination' | 'service' | 'event' | 'investment' | 'product', itemId: string) =>
    apiRequest<void>('/favorites', { method: 'DELETE', body: { itemType, itemId }, token }),
};

export type AppNotification = {
  id: string;
  userId?: string | null;
  title: string;
  message: string;
  type: 'order' | 'event' | 'investment' | 'system' | 'service' | string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationPreferences = {
  orders: boolean;
  events: boolean;
  investments: boolean;
  announcements: boolean;
};

export const notificationsApi = {
  list: (token?: string | null, category?: string) =>
    apiRequest<{ notifications: AppNotification[]; unreadCount: number }>(
      category && category !== 'All'
        ? `/notifications?category=${encodeURIComponent(category)}`
        : '/notifications',
      { token }
    ),
  markAsRead: (id: string, token?: string | null) =>
    apiRequest<{ success: boolean; notification: AppNotification }>(
      `/notifications/${id}/read`,
      { method: 'PATCH', token }
    ),
  markAllAsRead: (token?: string | null) =>
    apiRequest<{ success: boolean; message: string }>(
      '/notifications/read-all',
      { method: 'PATCH', token }
    ),
  dismiss: (id: string, token?: string | null) =>
    apiRequest<{ success: boolean; message: string }>(
      `/notifications/${id}`,
      { method: 'DELETE', token }
    ),
  getPreferences: (token?: string | null) =>
    apiRequest<NotificationPreferences>('/notifications/preferences', { token }),
  updatePreferences: (data: Partial<NotificationPreferences>, token?: string | null) =>
    apiRequest<{ success: boolean; preferences: NotificationPreferences }>(
      '/notifications/preferences',
      { method: 'PATCH', body: data, token }
    ),
};

export type CategoryItem = {
  id: string;
  type: 'destination' | 'service' | 'event' | 'investment' | 'product' | string;
  name: string;
  icon?: string | null;
  order?: number;
};

export const categoriesApi = {
  getAll: (type?: string) =>
    apiRequest<CategoryItem[]>(type ? `/categories?type=${encodeURIComponent(type)}` : '/categories'),
};

export type AnnouncementBanner = {
  id: string;
  title: string;
  description: string;
  icon?: string | null;
  actionUrl?: string | null;
  active: boolean;
  order?: number;
};

export const announcementsApi = {
  getAll: () => apiRequest<AnnouncementBanner[]>('/announcements'),
};


