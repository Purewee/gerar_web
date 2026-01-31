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
  { id: 'favorites', label: 'Миний дуртай', href: '/profile/favorites', icon: Heart },
  { id: 'addresses', label: 'Хаягууд', href: '/profile/addresses', icon: MapPin },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    const storedMobile = localStorage.getItem('mobile');
    if (auth === 'true' && storedMobile) {
      setIsAuthenticated(true);
    } else {
      router.replace('/auth/login');
    }
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
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-12">
        {/* Mobile: horizontal card grid (menus) */}
        <div className="lg:hidden mb-6">
          <nav className="grid grid-cols-4 gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 shadow-sm transition-all duration-200 min-h-[88px] ${
                    active
                      ? 'bg-primary/10 border-primary text-primary shadow-md'
                      : 'bg-white border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200 hover:shadow-md active:scale-[0.98]'
                  }`}
                >
                  <Icon className={`w-6 h-6 shrink-0 ${active ? 'text-primary' : 'text-gray-600'}`} />
                  <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Desktop: vertical sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 lg:p-6">
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 border-2 ${
                          active
                            ? 'bg-primary/10 border-primary text-primary shadow-sm'
                            : 'border-transparent hover:bg-gray-100/80 text-gray-700 hover:border-gray-200 hover:scale-[1.01] hover:shadow-sm'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 hover:bg-red-50/80 text-red-600 hover:scale-[1.01] hover:shadow-sm cursor-pointer"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Гарах</span>
                    </button>
                  </div>
                </nav>
              </CardContent>
            </Card>
          </aside>
          <main className="lg:col-span-3">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</div>
          </main>
        </div>

        {/* Mobile: Гарах at bottom of page (after tab content) */}
        <div className="lg:hidden mt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-600 bg-red-100 hover:bg-red-50/80 transition-all duration-200 text-sm font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Гарах
          </button>
        </div>
      </div>
    </div>
  );
}
