'use client';

import { useEffect, useRef, useState } from 'react';
import { useCategories, type Category } from '@/lib/api';
import { useCategoriesStore } from '@/lib/stores/categories';

const CATEGORIES_CACHE_KEY = 'categories_cache';

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [cachedCategories] = useState<Category[] | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem(CATEGORIES_CACHE_KEY);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  });

  const hydrateFromCache = useCategoriesStore(state => state.hydrateFromCache);
  const setCategories = useCategoriesStore(state => state.setCategories);
  const setLoading = useCategoriesStore(state => state.setLoading);
  const hydratedFromCacheRef = useRef(false);

  // Hydrate synchronously during render when we have cache – instant display, no loading flash
  if (cachedCategories && cachedCategories.length > 0 && !hydratedFromCacheRef.current) {
    hydratedFromCacheRef.current = true;
    hydrateFromCache(cachedCategories);
  }

  const { data: categoriesResponse, isLoading } = useCategories({
    enabled: !cachedCategories,
  });

  // Sync loading only when fetching from API (no cache). When using cache we never show loading.
  useEffect(() => {
    if (cachedCategories) return;
    setLoading(isLoading);
  }, [cachedCategories, isLoading, setLoading]);

  // Update store and cache when API returns
  useEffect(() => {
    const categories = categoriesResponse?.data;
    if (categories && Array.isArray(categories)) {
      setCategories(categories);
      try {
        sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categories));
      } catch {
        /* ignore */
      }
    }
  }, [categoriesResponse, setCategories]);

  return <>{children}</>;
}
