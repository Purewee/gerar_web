'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function SpecialGiftButton() {
  const router = useRouter();
  const pathname = usePathname();
  // Always show the button in navigation
  const [animate, setAnimate] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const visitedGiftStore =
      typeof window !== 'undefined' && localStorage.getItem('visitedGiftStore') === 'true';
    // Mark as visited if on gift store page
    if (pathname?.includes('/gift-store') && typeof window !== 'undefined') {
      localStorage.setItem('visitedGiftStore', 'true');
    }
    setShowNotif(!visitedGiftStore);
  }, [pathname]);

  useEffect(() => {
    const visitedGiftStore =
      typeof window !== 'undefined' && localStorage.getItem('visitedGiftStore') === 'true';
    if (visitedGiftStore) {
      setAnimate(false);
      return;
    }
    // эхэнд 1 удаа хөдөлнө
    setAnimate(true);
    const timeout = setTimeout(() => setAnimate(false), 2000);

    // 10 сек тутам trigger
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 2000);
    }, 10000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [pathname]);
  // Always render as a regular inline button for use inside navigation
  return (
    <Button
      onClick={() => router.push('/gift-store')}
      className={`relative p-0 font-bold flex items-center px-1 justify-center
        transition-transform duration-200 bg-white hover:bg-yellow-50 
        ${animate ? 'animate-float ' : ''}
        hover:scale-105 hover:shadow-xl`}
      style={{ boxShadow: '0 2px 8px 0 rgba(234,179,8,0.10)' }}
    >
      <span
        style={{
          lineHeight: 1,
          zIndex: 2,
        }}
        className="text-xl sm:text-xl md:text-2xl"
      >
        🎁
      </span>
      {showNotif && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white font-bold select-none shadow-md animate-pulse">
          1
        </span>
      )}
    </Button>
  );
}
