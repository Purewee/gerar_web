'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Menu, Heart, User, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/api';

/** Combined hamburger menu + magnifying glass icon (single integrated graphic) */
function MenuSearchIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Hamburger: three horizontal lines on the left */}
      <line x1="3" y1="6" x2="10" y2="6" />
      <line x1="3" y1="12" x2="10" y2="12" />
      <line x1="3" y1="18" x2="10" y2="18" />
      {/* Magnifying glass: circle aligned to the right of the lines */}
      <circle cx="14" cy="10" r="5" />
      {/* Handle: down and to the right */}
      <line x1="17.5" y1="12.5" x2="21" y2="16" />
    </svg>
  );
}

const navItems = [
  { href: '/', label: 'Нүүр', labelEn: 'Home', icon: Home },
  { href: '/products', label: 'Ангилал', labelEn: 'Browse', icon: Menu },
  { href: '/profile/favorites', label: 'Хадгалсан', labelEn: 'Favorites', icon: Heart },
  { href: '/profile', label: 'Бүртгэл', labelEn: 'Profile', icon: User },
  { href: '/cart', label: 'Сагс', labelEn: 'Cart', icon: ShoppingCart },
] as const;

export function BottomNav() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: cartResponse } = useCart();
  const cartItems = cartResponse?.data ?? [];
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

  useEffect(() => {
    setMounted(true);
    const auth = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(auth);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const updateAuth = () => {
      setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    };
    window.addEventListener('storage', updateAuth);
    window.addEventListener('authStateChanged', updateAuth);
    return () => {
      window.removeEventListener('storage', updateAuth);
      window.removeEventListener('authStateChanged', updateAuth);
    };
  }, [mounted]);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] safe-area-pb"
      role="navigation"
      aria-label="Гол цэс"
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {navItems.map(({ href, label, labelEn, icon: Icon }) => {
          const isCart = href === '/cart';
          const isBrowse = href === '/products';
          const isProfile = href === '/profile';
          const isFavorites = href === '/profile/favorites';
          const isGuestProfile = isProfile && mounted && !isAuthenticated;
          const isGuestFavorites = isFavorites && mounted && !isAuthenticated;
          const isActive =
            href === '/'
              ? pathname === '/'
              : href === '/profile/favorites'
                ? isAuthenticated && pathname === '/profile/favorites'
                : href === '/profile'
                  ? isAuthenticated && pathname?.startsWith('/profile') && pathname !== '/profile/favorites'
                  : pathname?.startsWith(href);

          const needsLoginButton = isProfile || isFavorites;
          const isGuestAuthItem = (isProfile && isGuestProfile) || (isFavorites && isGuestFavorites);
          const displayLabel = isGuestAuthItem ? 'Нэвтрэх' : label;
          const itemClasses = `flex flex-col items-center justify-center gap-0.5 py-2.5 px-3 min-w-0 flex-1 transition-colors duration-200 ${
            isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'
          }`;

          if (needsLoginButton && isGuestAuthItem) {
            return (
              <button
                key={href}
                type="button"
                className={itemClasses}
                aria-label={displayLabel}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openLoginModal'));
                }}
              >
                <span className="relative inline-flex">
                  <Icon
                    className="w-6 h-6 shrink-0"
                    strokeWidth={isActive ? 2.25 : 2}
                    aria-hidden
                  />
                </span>
                <span className="text-[10px] font-medium truncate w-full text-center">
                  {displayLabel}
                </span>
              </button>
            );
          }

          if (isProfile && !isGuestProfile) {
            return (
              <button
                key={href}
                type="button"
                className={itemClasses}
                aria-label={displayLabel}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => router.push('/profile')}
              >
                <span className="relative inline-flex">
                  <Icon
                    className="w-6 h-6 shrink-0"
                    strokeWidth={isActive ? 2.25 : 2}
                    aria-hidden
                  />
                </span>
                <span className="text-[10px] font-medium truncate w-full text-center">
                  {displayLabel}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={itemClasses}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative inline-flex items-center justify-center">
                {isBrowse ? (
                  <MenuSearchIcon
                    className="w-6 h-6 shrink-0"
                    strokeWidth={isActive ? 2.25 : 2}
                  />
                ) : (
                  <Icon
                    className="w-6 h-6 shrink-0"
                    strokeWidth={isActive ? 2.25 : 2}
                    aria-hidden
                  />
                )}
                {isCart && mounted && cartCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 bg-primary text-white text-[10px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center"
                    aria-hidden
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium truncate w-full text-center">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
