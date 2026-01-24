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
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          <aside className="lg:col-span-1">
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
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
                          active
                            ? 'bg-linear-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                            : 'hover:bg-gray-100/80 text-gray-700 hover:scale-[1.01] hover:shadow-sm'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-primary-foreground' : ''}`} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 hover:bg-red-50/80 text-red-600 hover:scale-[1.01] hover:shadow-sm"
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
      </div>
    </div>
  );
}
