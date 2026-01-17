"use client";

import { useEffect, useState } from "react";
import { useCategories, type Category } from "@/lib/api";
import { useCategoriesStore } from "@/lib/stores/categories";

const CATEGORIES_CACHE_KEY = "categories_cache";

export function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cachedCategories] = useState<Category[] | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = sessionStorage.getItem(CATEGORIES_CACHE_KEY);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  });
  const { data: categoriesResponse, isLoading } = useCategories({
    enabled: !cachedCategories,
  });
  const setCategories = useCategoriesStore((state) => state.setCategories);
  const setLoading = useCategoriesStore((state) => state.setLoading);
  const hasLoaded = useCategoriesStore((state) => state.hasLoaded);
  const hydrateFromCache = useCategoriesStore((state) => state.hydrateFromCache);

  // Hydrate from sessionStorage on first mount
  useEffect(() => {
    if (hasLoaded) return;
    if (cachedCategories && cachedCategories.length > 0) {
      hydrateFromCache(cachedCategories);
    }
  }, [cachedCategories, hasLoaded, hydrateFromCache]);

  // Sync loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Update store and cache when API returns
  useEffect(() => {
    const categories = categoriesResponse?.data;
    if (categories && Array.isArray(categories)) {
      setCategories(categories);
      try {
        sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categories));
      } catch {
        // Ignore storage errors
      }
    }
  }, [categoriesResponse, setCategories]);

  return <>{children}</>;
}
