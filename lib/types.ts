// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== AUTHENTICATION TYPES ====================

export interface RegisterRequest {
  phoneNumber: string;
  pin: string;
  name: string;
  email?: string;
}

export interface LoginRequest {
  phoneNumber: string;
  pin: string;
}

export interface User {
  id: number;
  phoneNumber: string;
  name: string;
  email?: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ==================== CATEGORY TYPES ====================

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description: string | null;
  parentId: number | null;
  order?: number;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

// ==================== PRODUCT TYPES ====================

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  originalPrice: string | null;
  images: string[];
  firstImage: string | null;
  hasDiscount: boolean;
  discountAmount: string | null;
  discountPercentage: number | null;
  stock: number;
  categories: Category[];
  categoryId: number | null;
  category?: Category | null;
  isFavorite?: boolean;
  /** false = visible (default), true = hidden from catalog (still shown in order history) */
  isHidden?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsQueryParams {
  category?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "name" | "price" | "stock" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ==================== CART TYPES ====================

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

// ==================== FAVORITES TYPES ====================

export interface FavoriteStatus {
  productId: number;
  isFavorite: boolean;
  favoriteId: number;
}

// ==================== ADDRESS TYPES ====================

export interface Address {
  id: number;
  userId: number;
  label?: string | null;
  provinceOrDistrict?: string;
  khorooOrSoum?: string;
  street?: string;
  neighborhood?: string | null;
  residentialComplex?: string | null;
  building?: string | null;
  entrance?: string | null;
  apartmentNumber?: string | null;
  addressNote?: string | null;
  fullName?: string;
  phoneNumber?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  label?: string | null;
  provinceOrDistrict?: string;
  khorooOrSoum?: string;
  street?: string;
  neighborhood?: string | null;
  residentialComplex?: string | null;
  building?: string | null;
  entrance?: string | null;
  apartmentNumber?: string | null;
  addressNote?: string | null;
  fullName?: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

// ==================== ORDER TYPES ====================

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  userId: number;
  addressId: number | null;
  deliveryTimeSlot: string | null;
  totalAmount: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  address?: Address;
  items?: OrderItem[];
}

export interface CreateOrderRequest {
  addressId?: number;
  address?: unknown;
  fullName: string;
  phoneNumber: string;
  email: string;
  deliveryDate?: string;
  deliveryTimeSlot?: "10-14" | "14-18" | "18-21" | "21-00";
}

export interface BuyNowRequestGuest {
  productId: number;
  quantity: number;
  sessionToken?: string;
}

export interface BuyNowRequestAuthenticated {
  productId: number;
  quantity: number;
  addressId: number;
  deliveryTimeSlot: "10-14" | "14-18" | "18-21" | "21-00";
}

export type BuyNowRequest = BuyNowRequestGuest | BuyNowRequestAuthenticated;

export interface FinalizeOrderRequest {
  sessionToken: string;
  deliveryTimeSlot: "10-14" | "14-18" | "18-21" | "21-00";
  addressId?: number;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault?: boolean;
  };
}
