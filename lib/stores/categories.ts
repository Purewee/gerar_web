import { create } from "zustand";
import type { Category } from "@/lib/api";

interface CategoriesState {
  categories: Category[];
  featuredCategories: Category[];
  isLoading: boolean;
  hasLoaded: boolean;
  setCategories: (categories: Category[]) => void;
  setFeaturedCategories: (categories: Category[]) => void;
  setLoading: (isLoading: boolean) => void;
  hydrateFromCache: (categories: Category[]) => void;
  hydrateFeaturedFromCache: (categories: Category[]) => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  featuredCategories: [],
  isLoading: true,
  hasLoaded: false,
  setCategories: (categories) =>
    set({ categories, isLoading: false, hasLoaded: true }),
  setFeaturedCategories: (featuredCategories) => set({ featuredCategories }),
  setLoading: (isLoading) => set({ isLoading }),
  hydrateFromCache: (categories) =>
    set({ categories, isLoading: false, hasLoaded: true }),
  hydrateFeaturedFromCache: (featuredCategories) => set({ featuredCategories }),
}));
