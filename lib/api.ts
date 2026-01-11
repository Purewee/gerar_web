"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ApiResponse,
  Pagination,
  RegisterRequest,
  LoginRequest,
  User,
  AuthResponse,
  Category,
  Product,
  ProductsQueryParams,
  CartItem,
  FavoriteStatus,
  Address,
  CreateAddressRequest,
  Order,
  OrderItem,
  CreateOrderRequest,
  BuyNowRequest,
  FinalizeOrderRequest,
} from "./types";

/**
 * Note: All queries default to refetchOnWindowFocus: false (configured in lib/providers.tsx).
 * To override this default for a specific query, add refetchOnWindowFocus: true to the query options.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Re-export types for convenience
export type {
  ApiResponse,
  Pagination,
  RegisterRequest,
  LoginRequest,
  User,
  AuthResponse,
  Category,
  Product,
  ProductsQueryParams,
  CartItem,
  FavoriteStatus,
  Address,
  CreateAddressRequest,
  Order,
  OrderItem,
  CreateOrderRequest,
  BuyNowRequest,
  FinalizeOrderRequest,
};

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

// Base fetch function with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
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
    list: (includeSubcategories?: boolean) =>
      [...queryKeys.categories.lists(), { includeSubcategories }] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.categories.details(), id] as const,
    products: (
      id: number,
      includeSubcategories?: boolean,
      page?: number,
      limit?: number
    ) =>
      [
        ...queryKeys.categories.detail(id),
        "products",
        { includeSubcategories, page, limit },
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
    }
    return response;
  },

  logout: (): void => {
    removeAuthToken();
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

// Products API functions
const productsApiFunctions = {
  getAll: async (
    params?: ProductsQueryParams
  ): Promise<ApiResponse<Product[]>> => {
    const queryParams = new URLSearchParams();

    if (params?.category) {
      queryParams.append("category", params.category.toString());
    }
    if (params?.search) {
      queryParams.append("search", params.search);
    }
    if (params?.minPrice) {
      queryParams.append("minPrice", params.minPrice.toString());
    }
    if (params?.maxPrice) {
      queryParams.append("maxPrice", params.maxPrice.toString());
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

// Categories API functions
const categoriesApiFunctions = {
  getAll: async (
    includeSubcategories?: boolean
  ): Promise<ApiResponse<Category[]>> => {
    const queryParams = new URLSearchParams();
    if (includeSubcategories !== undefined) {
      queryParams.append(
        "includeSubcategories",
        includeSubcategories.toString()
      );
    }
    const queryString = queryParams.toString();
    return apiFetch<Category[]>(
      `/categories${queryString ? `?${queryString}` : ""}`
    );
  },

  getById: async (id: number): Promise<ApiResponse<Category>> => {
    return apiFetch<Category>(`/categories/${id}`);
  },

  getProducts: async (
    id: number,
    includeSubcategories?: boolean,
    page?: number,
    limit?: number
  ): Promise<ApiResponse<Product[]>> => {
    const queryParams = new URLSearchParams();
    if (includeSubcategories !== undefined) {
      queryParams.append(
        "includeSubcategories",
        includeSubcategories.toString()
      );
    }
    if (page) {
      queryParams.append("page", page.toString());
    }
    if (limit) {
      queryParams.append("limit", limit.toString());
    }
    const queryString = queryParams.toString();
    return apiFetch<Product[]>(
      `/categories/${id}/products${queryString ? `?${queryString}` : ""}`
    );
  },
};

// Categories hooks
export const useCategories = (includeSubcategories?: boolean) => {
  return useQuery({
    queryKey: queryKeys.categories.list(includeSubcategories),
    queryFn: () => categoriesApiFunctions.getAll(includeSubcategories),
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
  includeSubcategories?: boolean,
  page?: number,
  limit?: number
) => {
  return useQuery({
    queryKey: queryKeys.categories.products(
      id,
      includeSubcategories,
      page,
      limit
    ),
    queryFn: () =>
      categoriesApiFunctions.getProducts(id, includeSubcategories, page, limit),
    enabled: !!id,
  });
};

export const categoriesApi = categoriesApiFunctions;

// ==================== CART ====================

// Cart API functions
const cartApiFunctions = {
  get: async (): Promise<ApiResponse<CartItem[]>> => {
    return apiFetch<CartItem[]>("/cart");
  },

  add: async (
    productId: number,
    quantity: number
  ): Promise<ApiResponse<CartItem>> => {
    return apiFetch<CartItem>("/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
  },

  update: async (
    productId: number,
    quantity: number
  ): Promise<ApiResponse<CartItem>> => {
    return apiFetch<CartItem>(`/cart/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  },

  remove: async (productId: number): Promise<ApiResponse<CartItem>> => {
    return apiFetch<CartItem>(`/cart/${productId}`, {
      method: "DELETE",
    });
  },

  clear: async (): Promise<ApiResponse<{ deletedCount: number }>> => {
    return apiFetch<{ deletedCount: number }>("/cart", {
      method: "DELETE",
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
    return apiFetch<Product>(`/favorites/${productId}`, {
      method: "DELETE",
    });
  },

  checkStatus: async (
    productId: number
  ): Promise<ApiResponse<FavoriteStatus>> => {
    return apiFetch<FavoriteStatus>(`/favorites/${productId}/status`);
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
    enabled: !!productId,
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

// Addresses API functions
const addressesApiFunctions = {
  getAll: async (): Promise<ApiResponse<Address[]>> => {
    return apiFetch<Address[]>("/addresses");
  },

  getById: async (id: number): Promise<ApiResponse<Address>> => {
    return apiFetch<Address>(`/addresses/${id}`);
  },

  create: async (data: CreateAddressRequest): Promise<ApiResponse<Address>> => {
    // Get fullName from localStorage (check both profile_name and user_name)
    const fullName =
      (typeof window !== "undefined" &&
        (localStorage.getItem("profile_name") ||
          localStorage.getItem("user_name"))) ||
      null;

    // Get phoneNumber from localStorage
    const phoneNumber =
      (typeof window !== "undefined" && localStorage.getItem("mobile")) || null;

    // Prepare request body with fullName and phoneNumber if available
    const requestBody: any = { ...data };
    if (fullName) {
      requestBody.fullName = fullName;
    }
    if (phoneNumber) {
      requestBody.phoneNumber = phoneNumber;
    }

    return apiFetch<Address>("/addresses", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  },

  update: async (
    id: number,
    data: Partial<CreateAddressRequest>
  ): Promise<ApiResponse<Address>> => {
    return apiFetch<Address>(`/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<Address>> => {
    return apiFetch<Address>(`/addresses/${id}`, {
      method: "DELETE",
    });
  },

  setDefault: async (id: number): Promise<ApiResponse<Address>> => {
    return apiFetch<Address>(`/addresses/${id}/set-default`, {
      method: "PATCH",
    });
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

export const addressesApi = addressesApiFunctions;

// ==================== ORDERS ====================

// Orders API functions
const ordersApiFunctions = {
  getAll: async (): Promise<ApiResponse<Order[]>> => {
    return apiFetch<Order[]>("/orders");
  },

  getById: async (id: number): Promise<ApiResponse<Order>> => {
    return apiFetch<Order>(`/orders/${id}`);
  },

  create: async (data: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    return apiFetch<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  buyNow: async (data: BuyNowRequest): Promise<ApiResponse<Order | any>> => {
    return apiFetch<Order | any>("/orders/buy-now", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  finalize: async (data: FinalizeOrderRequest): Promise<ApiResponse<Order>> => {
    return apiFetch<Order>("/orders/finalize", {
      method: "POST",
      body: JSON.stringify(data),
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

export const useOrderBuyNow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BuyNowRequest) => ordersApiFunctions.buyNow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
};

export const useOrderFinalize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FinalizeOrderRequest) =>
      ordersApiFunctions.finalize(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
};

export const ordersApi = ordersApiFunctions;
