'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { User, ShoppingBag, Heart, LogOut, MapPin } from 'lucide-react';
import { authApi } from '@/lib/api';

type MenuItem = 'profile' | 'orders' | 'favorites' | 'addresses';

const menuItems: { id: MenuItem; label: string; href: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Миний профайл', href: '/profile', icon: User },
  { id: 'orders', label: 'Миний захиалгууд', href: '/profile/orders', icon: ShoppingBag },
  { id: 'favorites', label: 'Миний хадгалсан', href: '/profile/favorites', icon: Heart },
  { id: 'addresses', label: 'Хаягууд', href: '/profile/addresses', icon: MapPin },
];

export default function ProfileClientLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('isAuthenticated');
      const storedMobile = localStorage.getItem('mobile');
      if (auth === 'true' && storedMobile) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.replace('/');
        // Open the login modal so the user can re-authenticate
        window.dispatchEvent(new CustomEvent('openLoginModal'));
      }
    };

    checkAuth();

    // React when session validator (or any 401) clears the auth state
    window.addEventListener('authStateChanged', checkAuth);
    return () => window.removeEventListener('authStateChanged', checkAuth);
  }, [router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('mobile');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_email');
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      router.replace('/');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/profile') return pathname === '/profile';
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100/50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-12">
        {/* Mobile: horizontal cohesive tab bar */}
        <div className="lg:hidden mb-10 sticky top-0 z-30">
          <nav className="flex items-center justify-between bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/50 shadow-2xl shadow-black/5 ring-1 ring-black/5">
            {menuItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-300 ${
                    active
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-100'
                      : 'text-gray-500 hover:text-gray-900 active:scale-95'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} />
                  <span
                    className={`text-[10px] font-black uppercase tracking-tighter text-center leading-tight ${active ? 'text-white' : 'text-gray-400'}`}
                  >
                    {item.label.split(' ').length > 1 ? item.label.split(' ')[1] : item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Desktop: vertical premium sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-12 space-y-6">
              <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-white/50 shadow-2xl shadow-black/5 ring-1 ring-black/5 overflow-hidden">
                <div className="p-2 space-y-1">
                  {menuItems.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`group w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 relative ${
                          active
                            ? 'bg-primary text-white shadow-xl shadow-primary/20'
                            : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl transition-colors duration-300 ${
                            active
                              ? 'bg-white/20'
                              : 'bg-gray-100 group-hover:bg-white border border-gray-100 group-hover:border-gray-200'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />
                        </div>
                        <span className="font-bold tracking-tight">{item.label}</span>
                        {active && (
                          <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </Link>
                    );
                  })}
                </div>

                <div className="p-2 mt-2 border-t border-gray-100/50">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 text-red-500 hover:bg-red-50 hover:text-red-600 group cursor-pointer"
                  >
                    <div className="p-2 rounded-xl bg-red-50 group-hover:bg-white border border-red-50 group-hover:border-red-100">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-bold tracking-tight">Гарах</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div
              className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out ${pathname !== '/profile' ? 'sm:px-0' : ''}`}
            >
              {/* Outer wrapper for sub-pages on mobile */}
              {pathname !== '/profile' ? (
                <>
                  <div className="lg:hidden p-1.5 bg-white/30 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-2xl shadow-black/5 ring-1 ring-black/5">
                    <div className="overflow-hidden rounded-4xl">{children}</div>
                  </div>
                  <div className="hidden lg:block">{children}</div>
                </>
              ) : (
                children
              )}
            </div>
          </main>
        </div>

        {/* Mobile: logout button style - float or fixed? For now just simplified */}
        <div className="lg:hidden mt-12 mb-6">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all duration-300 text-sm font-black uppercase tracking-widest cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Системээс гарах
          </button>
        </div>
      </div>
    </div>
  );
}
