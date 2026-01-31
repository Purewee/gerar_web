import { create } from "zustand";
import type { Category } from "@/lib/api";

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  hasLoaded: boolean;
  setCategories: (categories: Category[]) => void;
  setLoading: (isLoading: boolean) => void;
  hydrateFromCache: (categories: Category[]) => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  isLoading: true,
  hasLoaded: false,
  setCategories: (categories) =>
    set({ categories, isLoading: false, hasLoaded: true }),
  setLoading: (isLoading) => set({ isLoading }),
  hydrateFromCache: (categories) =>
    set({ categories, isLoading: false, hasLoaded: true }),
}));
