"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Note: All queries default to refetchOnWindowFocus: false (configured in lib/providers.tsx).
 * To override this default for a specific query, add refetchOnWindowFocus: true to the query options.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

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

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// Set auth token
export const setAuthToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
};

// Remove auth token
export const removeAuthToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
};

// ==================== SESSION TOKEN (GUEST) ====================

const GUEST_SESSION_KEY = "guest_session_token";

// Get session token from localStorage
export const getSessionToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_SESSION_KEY);
};

// Set session token
export const setSessionToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_SESSION_KEY, token);
};

// Remove session token
export const removeSessionToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_SESSION_KEY);
};

// Base fetch function with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const sessionToken = getSessionToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add authentication token if available
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  // Add session token for guest users (only if not authenticated)
  if (sessionToken && !token) {
    (headers as Record<string, string>)["X-Session-Token"] = sessionToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error?.message || data.message || "API request failed"
      );
    }

    // Save session token if returned in response (for guest users)
    if ((data as any).sessionToken && (data as any).isGuest) {
      setSessionToken((data as any).sessionToken);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ==================== QUERY KEYS ====================

export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
  },

  // Categories
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (filters?: string) =>
      [...queryKeys.categories.lists(), { filters }] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.categories.details(), id] as const,
    products: (id: number, includeSubcategories?: boolean) =>
      [
        ...queryKeys.categories.detail(id),
        "products",
        { includeSubcategories },
      ] as const,
  },

  // Products
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (params?: ProductsQueryParams) =>
      [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.products.details(), id] as const,
  },

  // Cart
  cart: {
    all: ["cart"] as const,
    items: () => [...queryKeys.cart.all, "items"] as const,
  },

  // Favorites
  favorites: {
    all: ["favorites"] as const,
    lists: () => [...queryKeys.favorites.all, "list"] as const,
    list: (params?: { page?: number; limit?: number }) =>
      [...queryKeys.favorites.lists(), params] as const,
    status: (productId: number) =>
      [...queryKeys.favorites.all, "status", productId] as const,
  },

  // Addresses
  addresses: {
    all: ["addresses"] as const,
    lists: () => [...queryKeys.addresses.all, "list"] as const,
    details: () => [...queryKeys.addresses.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.addresses.details(), id] as const,
  },

  // Orders
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.orders.details(), id] as const,
  },
};

// ==================== AUTHENTICATION ====================

export interface RegisterRequest {
  phoneNumber: string;
  pin: string;
  name: string;
}

export interface LoginRequest {
  phoneNumber: string;
  pin: string;
}

export interface User {
  id: number;
  phoneNumber: string;
  name: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Auth API functions (for mutations)
const authApiFunctions = {
  register: async (
    data: RegisterRequest
  ): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (response.data?.token) {
      setAuthToken(response.data.token);
      // Merge guest cart if session token exists
      const sessionToken = getSessionToken();
      if (sessionToken) {
        try {
          await cartApiFunctions.merge(sessionToken);
          removeSessionToken();
        } catch (error) {
          // Don't block registration if merge fails
          console.error("Failed to merge cart:", error);
        }
      }
    }
    return response;
  },

  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (response.data?.token) {
      setAuthToken(response.data.token);
      // Merge guest cart if session token exists
      const sessionToken = getSessionToken();
      if (sessionToken) {
        try {
          await cartApiFunctions.merge(sessionToken);
          removeSessionToken();
        } catch (error) {
          // Don't block login if merge fails
          console.error("Failed to merge cart:", error);
        }
      }
    }
    return response;
  },

  forgotPassword: async (phoneNumber: string): Promise<ApiResponse<any>> => {
    return apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    });
  },

  resetPassword: async (data: {
    phoneNumber: string;
    resetCode: string;
    newPin: string;
    resetToken?: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiFetch<AuthResponse>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (response.data?.token) {
      setAuthToken(response.data.token);
      // Merge guest cart if session token exists
      const sessionToken = getSessionToken();
      if (sessionToken) {
        try {
          await cartApiFunctions.merge(sessionToken);
          removeSessionToken();
        } catch (error) {
          // Don't block password reset if merge fails
          console.error("Failed to merge cart:", error);
        }
      }
    }
    return response;
  },

  logout: async (): Promise<void> => {
    // Clear cart before logging out
    try {
      await cartApiFunctions.clear();
      // Dispatch cart update event so UI updates immediately
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      // Don't block logout if cart clear fails
      console.error("Failed to clear cart on logout:", error);
    }
    
    removeAuthToken();
    // Remove session token to clear guest cart
    removeSessionToken();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("mobile");
    localStorage.removeItem("profile_name");
    localStorage.removeItem("profile_email");
    localStorage.removeItem("profile_address");
    window.dispatchEvent(new CustomEvent("authStateChanged"));
  },
};

// Auth hooks
export const useAuthRegister = () => {
  return useMutation({
    mutationFn: authApiFunctions.register,
  });
};

export const useAuthLogin = () => {
  return useMutation({
    mutationFn: authApiFunctions.login,
  });
};

export const useAuthForgotPassword = () => {
  return useMutation({
    mutationFn: authApiFunctions.forgotPassword,
  });
};

export const useAuthResetPassword = () => {
  return useMutation({
    mutationFn: authApiFunctions.resetPassword,
  });
};

export const authApi = authApiFunctions;

// ==================== PRODUCTS ====================

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
  isFavorite?: boolean;
  stock: number;
  categories: Category[];
  categoryId: number | null;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsQueryParams {
  categoryId?: number;
  categoryIds?: number[];
  search?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: "name" | "price" | "stock" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Products API functions
const productsApiFunctions = {
  getAll: async (
    params?: ProductsQueryParams
  ): Promise<ApiResponse<Product[]>> => {
    const queryParams = new URLSearchParams();

    if (params?.categoryId) {
      queryParams.append("categoryId", params.categoryId.toString());
    }
    if (params?.categoryIds && params.categoryIds.length > 0) {
      params.categoryIds.forEach((id) => {
        queryParams.append("categoryIds[]", id.toString());
      });
    }
    if (params?.search) {
      queryParams.append("search", params.search);
    }
    if (params?.inStock !== undefined) {
      queryParams.append("inStock", params.inStock.toString());
    }
    if (params?.minPrice) {
      queryParams.append("minPrice", params.minPrice.toString());
    }
    if (params?.maxPrice) {
      queryParams.append("maxPrice", params.maxPrice.toString());
    }
    if (params?.minStock) {
      queryParams.append("minStock", params.minStock.toString());
    }
    if (params?.maxStock) {
      queryParams.append("maxStock", params.maxStock.toString());
    }
    if (params?.createdAfter) {
      queryParams.append("createdAfter", params.createdAfter);
    }
    if (params?.createdBefore) {
      queryParams.append("createdBefore", params.createdBefore);
    }
    if (params?.sortBy) {
      queryParams.append("sortBy", params.sortBy);
    }
    if (params?.sortOrder) {
      queryParams.append("sortOrder", params.sortOrder);
    }
    if (params?.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    const queryString = queryParams.toString();
    return apiFetch<Product[]>(
      `/products${queryString ? `?${queryString}` : ""}`
    );
  },

  getById: async (id: number): Promise<ApiResponse<Product>> => {
    return apiFetch<Product>(`/products/${id}`);
  },
};

// Products hooks
export const useProducts = (params?: ProductsQueryParams) => {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productsApiFunctions.getAll(params),
  });
};

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApiFunctions.getById(id),
    enabled: !!id,
  });
};

export const productsApi = productsApiFunctions;

// ==================== CATEGORIES ====================

export interface Category {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

// Categories API functions
const categoriesApiFunctions = {
  getAll: async (): Promise<ApiResponse<Category[]>> => {
    return apiFetch<Category[]>("/categories");
  },

  getById: async (id: number): Promise<ApiResponse<Category>> => {
    return apiFetch<Category>(`/categories/${id}`);
  },

  getProducts: async (
    id: number,
    includeSubcategories?: boolean
  ): Promise<ApiResponse<Product[]>> => {
    const query = includeSubcategories ? `?includeSubcategories=true` : "";
    return apiFetch<Product[]>(`/categories/${id}/products${query}`);
  },
};

// Categories hooks
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => categoriesApiFunctions.getAll(),
    staleTime: 1.5 * 60 * 60 * 1000, // 1.5 hours
  });
};

export const useCategory = (id: number) => {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoriesApiFunctions.getById(id),
    enabled: !!id,
  });
};

export const useCategoryProducts = (
  id: number,
  includeSubcategories?: boolean
) => {
  return useQuery({
    queryKey: queryKeys.categories.products(id, includeSubcategories),
    queryFn: () => categoriesApiFunctions.getProducts(id, includeSubcategories),
    enabled: !!id,
  });
};

export const categoriesApi = categoriesApiFunctions;

// ==================== CART ====================

export interface CartItem {
  id: number;
  userId: number | null; // null for guest users
  sessionToken?: string; // For guest users
  productId: number;
  quantity: number;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

// Cart API functions
const cartApiFunctions = {
  get: async (): Promise<ApiResponse<CartItem[]>> => {
    return apiFetch<CartItem[]>("/cart");
  },

  add: async (
    productId: number,
    quantity: number
  ): Promise<ApiResponse<CartItem>> => {
    const token = getAuthToken();
    const sessionToken = getSessionToken();
    const body: any = { productId, quantity };

    // Add session token for guest users
    if (!token && sessionToken) {
      body.sessionToken = sessionToken;
    }

    return apiFetch<CartItem>("/cart", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  update: async (
    productId: number,
    quantity: number
  ): Promise<ApiResponse<CartItem>> => {
    const token = getAuthToken();
    const sessionToken = getSessionToken();
    const body: any = { quantity };

    // Add session token for guest users
    if (!token && sessionToken) {
      body.sessionToken = sessionToken;
    }

    return apiFetch<CartItem>(`/cart/${productId}/update`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  remove: async (productId: number): Promise<ApiResponse<CartItem>> => {
    const token = getAuthToken();
    const sessionToken = getSessionToken();
    const body: any = {};

    // Add session token for guest users
    if (!token && sessionToken) {
      body.sessionToken = sessionToken;
    }

    return apiFetch<CartItem>(`/cart/${productId}/remove`, {
      method: "POST",
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
  },

  clear: async (): Promise<ApiResponse<{ deletedCount: number }>> => {
    const token = getAuthToken();
    const sessionToken = getSessionToken();
    const body: any = {};

    // Add session token for guest users
    if (!token && sessionToken) {
      body.sessionToken = sessionToken;
    }

    return apiFetch<{ deletedCount: number }>("/cart/clear", {
      method: "POST",
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
  },

  merge: async (sessionToken: string): Promise<ApiResponse<{ mergedCount: number; skippedCount: number }>> => {
    return apiFetch<{ mergedCount: number; skippedCount: number }>("/cart/merge", {
      method: "POST",
      body: JSON.stringify({ sessionToken }),
    });
  },
};

// Cart hooks
export const useCart = () => {
  return useQuery({
    queryKey: queryKeys.cart.items(),
    queryFn: () => cartApiFunctions.get(),
  });
};

export const useCartAdd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: number;
      quantity: number;
    }) => cartApiFunctions.add(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
};

export const useCartUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: number;
      quantity: number;
    }) => cartApiFunctions.update(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
};

export const useCartRemove = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => cartApiFunctions.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
};

export const useCartClear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cartApiFunctions.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
};

export const useCartMerge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionToken: string) => cartApiFunctions.merge(sessionToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      // Clear session token after successful merge
      removeSessionToken();
    },
  });
};

export const cartApi = cartApiFunctions;

// ==================== FAVORITES ====================

// Favorites API functions
const favoritesApiFunctions = {
  get: async (
    page?: number,
    limit?: number
  ): Promise<ApiResponse<Product[]>> => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    const query = params.toString();
    return apiFetch<Product[]>(`/favorites${query ? `?${query}` : ""}`);
  },

  add: async (productId: number): Promise<ApiResponse<Product>> => {
    return apiFetch<Product>("/favorites", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
  },

  remove: async (productId: number): Promise<ApiResponse<Product>> => {
    return apiFetch<Product>(`/favorites/${productId}/remove`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  checkStatus: async (
    productId: number
  ): Promise<ApiResponse<{ productId: number; isFavorited: boolean }>> => {
    return apiFetch<{ productId: number; isFavorited: boolean }>(
      `/favorites/${productId}/status`
    );
  },
};

// Favorites hooks
export const useFavorites = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.favorites.list(params),
    queryFn: () => favoritesApiFunctions.get(params?.page, params?.limit),
  });
};

export const useFavoriteStatus = (productId: number) => {
  return useQuery({
    queryKey: queryKeys.favorites.status(productId),
    queryFn: () => favoritesApiFunctions.checkStatus(productId),
    enabled: !!productId && !!getAuthToken(), // Only enable if authenticated
  });
};

export const useFavoriteAdd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => favoritesApiFunctions.add(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
};

export const useFavoriteRemove = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => favoritesApiFunctions.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
};

export const favoritesApi = favoritesApiFunctions;

// ==================== ADDRESSES ====================

export interface Address {
  id: number;
  userId: number;
  label: string | null;
  fullName: string;
  phoneNumber: string;
  provinceOrDistrict: string;
  khorooOrSoum: string;
  street: string | null;
  neighborhood: string | null;
  residentialComplex: string | null;
  building: string | null;
  entrance: string | null;
  apartmentNumber: string | null;
  addressNote: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  label?: string;
  fullName: string;
  phoneNumber: string;
  provinceOrDistrict: string;
  khorooOrSoum: string;
  street?: string;
  neighborhood?: string;
  residentialComplex?: string;
  building?: string;
  entrance?: string;
  apartmentNumber?: string;
  addressNote?: string;
  isDefault?: boolean;
}

// Addresses API functions
const addressesApiFunctions = {
  getAll: async (): Promise<ApiResponse<Address[]>> => {
    return apiFetch<Address[]>("/addresses");
  },

  getById: async (id: number): Promise<ApiResponse<Address>> => {
    return apiFetch<Address>(`/addresses/${id}`);
  },

  create: async (data: CreateAddressRequest): Promise<ApiResponse<Address>> => {
    return apiFetch<Address>("/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: Partial<CreateAddressRequest>
  ): Promise<ApiResponse<Address>> => {
    return apiFetch<Address>(`/addresses/${id}/update`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<Address>> => {
    return apiFetch<Address>(`/addresses/${id}/delete`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  setDefault: async (id: number): Promise<ApiResponse<Address>> => {
    return apiFetch<Address>(`/addresses/${id}/set-default`, {
      method: "PATCH",
    });
  },

  getDistricts: async (): Promise<ApiResponse<string[]>> => {
    return apiFetch<string[]>("/addresses/districts");
  },

  getKhoroo: async (district: string): Promise<ApiResponse<{ district: string; khorooOptions: string[] }>> => {
    return apiFetch<{ district: string; khorooOptions: string[] }>(`/addresses/khoroo?district=${encodeURIComponent(district)}`);
  },
};

// Addresses hooks
export const useAddresses = () => {
  return useQuery({
    queryKey: queryKeys.addresses.lists(),
    queryFn: () => addressesApiFunctions.getAll(),
  });
};

export const useAddress = (id: number) => {
  return useQuery({
    queryKey: queryKeys.addresses.detail(id),
    queryFn: () => addressesApiFunctions.getById(id),
    enabled: !!id,
  });
};

export const useAddressCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAddressRequest) =>
      addressesApiFunctions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
};

export const useAddressUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateAddressRequest>;
    }) => addressesApiFunctions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
};

export const useAddressDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => addressesApiFunctions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
};

export const useAddressSetDefault = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => addressesApiFunctions.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
};

export const useDistricts = () => {
  return useQuery({
    queryKey: [...queryKeys.addresses.all, "districts"],
    queryFn: () => addressesApiFunctions.getDistricts(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - districts don't change often
  });
};

export const useKhoroo = (district: string | null) => {
  return useQuery({
    queryKey: [...queryKeys.addresses.all, "khoroo", district],
    queryFn: () => {
      if (!district) {
        throw new Error("District is required");
      }
      return addressesApiFunctions.getKhoroo(district);
    },
    enabled: !!district && district.length > 0,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
  });
};

export const addressesApi = addressesApiFunctions;

// ==================== ORDERS ====================

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

export interface GuestAddress {
  fullName: string;
  phoneNumber: string;
  provinceOrDistrict: string;
  khorooOrSoum: string;
  street?: string;
  neighborhood?: string;
  residentialComplex?: string;
  building?: string;
  entrance?: string;
  apartmentNumber?: string;
  addressNote?: string;
  label?: string;
}

export interface CreateOrderRequest {
  // For authenticated users
  addressId?: number;
  // For guest users
  sessionToken?: string;
  address?: GuestAddress;
  // Common
  deliveryTimeSlot?: "10-14" | "14-18" | "18-21" | "21-00";
}

// Orders API functions
const ordersApiFunctions = {
  getAll: async (): Promise<ApiResponse<Order[]>> => {
    return apiFetch<Order[]>("/orders");
  },

  getById: async (id: number): Promise<ApiResponse<Order>> => {
    return apiFetch<Order>(`/orders/${id}`);
  },

  create: async (data: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    const token = getAuthToken();
    const sessionToken = getSessionToken();
    const body: any = { ...data };

    // For guest users, ensure session token is included
    if (!token && sessionToken && !body.sessionToken) {
      body.sessionToken = sessionToken;
    }

    return apiFetch<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

// Orders hooks
export const useOrders = () => {
  return useQuery({
    queryKey: queryKeys.orders.lists(),
    queryFn: () => ordersApiFunctions.getAll(),
  });
};

export const useOrder = (id: number) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApiFunctions.getById(id),
    enabled: !!id,
  });
};

export const useOrderCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersApiFunctions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
};

export const ordersApi = ordersApiFunctions;
