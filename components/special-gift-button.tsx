'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function SpecialGiftButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const visitedGiftStore =
      typeof window !== 'undefined' && localStorage.getItem('visitedGiftStore') === 'true';
    const isGiftStore = pathname?.includes('/gift-store');
    const isPayment = pathname?.includes('/payment');
    const isOrderCreate = pathname?.includes('/orders/create');
    const isOrderDetail = /^\/orders\/[\w-]+$/.test(pathname || '');
    const isCart = pathname?.includes('/cart');
    const isProfile = pathname?.includes('/profile');
    if (isGiftStore && typeof window !== 'undefined') {
      localStorage.setItem('visitedGiftStore', 'true');
    }
    const shouldHide =
      isGiftStore || isPayment || isOrderCreate || isOrderDetail || isCart || isProfile;
    setShow(!shouldHide && !visitedGiftStore);
    setShowNotif(!visitedGiftStore && !shouldHide);
  }, [pathname]);

  useEffect(() => {
    if (!show) return;
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
  }, [show]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '15%',
        right: `max((100vw - 1280px) / 2,0px)`,
        zIndex: 1000,
      }}
      className="flex flex-col items-end"
    >
      <Button
        onClick={() => router.push('/gift-store')}
        className={`relative p-1 h-full rounded-full font-bold flex items-center justify-center
          transition-transform duration-200 bg-transparent/100 hover:bg-transparent/100
          ${animate ? 'animate-float ' : ''}
          hover:scale-105 hover:shadow-xl`}
      >
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            height: 44,
            width: 70,
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: -6,
              transform: 'translateX(-50%)',
              zIndex: 2,
              fontSize: 32,
              lineHeight: 1,
            }}
          >
            🎁
          </span>
          <svg
            width="80"
            height="40"
            viewBox="0 0 80 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', zIndex: 1 }}
          >
            <defs>
              <radialGradient id="cloudGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                <stop offset="100%" stopColor="#e0e7ef" stopOpacity="1" />
              </radialGradient>
            </defs>
            <ellipse cx="20" cy="32" rx="13" ry="8" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="40" cy="30" rx="18" ry="10" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="60" cy="32" rx="13" ry="8" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="30" cy="25" rx="8" ry="6" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="30" cy="25" rx="8" ry="6" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="50" cy="25" rx="8" ry="6" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="40" cy="20" rx="7" ry="5" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="25" cy="35" rx="4" ry="2.5" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="55" cy="35" rx="4" ry="2.5" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
          </svg>
        </span>

        {showNotif && (
          <span className="absolute -top-4 -right-[-8px] bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white font-bold select-none shadow-md animate-pulse">
            1
          </span>
        )}
      </Button>
    </div>
  );
}
