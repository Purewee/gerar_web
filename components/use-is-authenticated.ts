import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/api';

/**
 * useIsAuthenticated - React hook to check if user is authenticated
 * Returns: boolean
 */
export function useIsAuthenticated(): boolean {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    setIsAuthenticated(!!getAuthToken());
  }, []);
  return isAuthenticated;
}
