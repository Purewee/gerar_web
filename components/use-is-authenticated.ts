import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/api';

/**
 * useIsAuthenticated - React hook to check if user is authenticated
 * Returns: boolean
 */
export function useIsAuthenticated(): boolean {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthToken());

  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(!!getAuthToken());
    checkAuth();

    // Listen for login/logout events (custom events or storage changes)
    window.addEventListener('authChanged', checkAuth);
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('authChanged', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return isAuthenticated;
}
