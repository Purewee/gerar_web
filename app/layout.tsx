import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { Providers } from '@/lib/providers';
import { CategoriesProvider } from '@/components/categories-provider';
import { Navigation } from '@/components/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { FontLoader } from '@/components/font-loader';
import dynamic from 'next/dynamic';
import { Toaster } from '@/components/ui/sonner';

// Defer non-critical components to reduce initial bundle size
const Footer = dynamic(() => import('@/components/footer').then(mod => mod.HomeFooter), {
  ssr: true, // Keep SSR for SEO but load async
});

export const metadata: Metadata = {
  title: 'Gerar Household - Гэр ахуйн бараа бүтээгдэхүүн',
  description:
    'Gerar Household-д тавтай морил! Манай гэр ахуйн барааны дэлгүүр нь таны өдөр тутмын хэрэгцээг бүрэн хангах өргөн сонголттой бүтээгдэхүүнийг нэг дороос санал болгож байна. Гал тогооны хэрэгсэл, цэвэрлэгээний бүтээгдэхүүн, цахилгаан хэрэгслийн дагалдах хэрэгсэл, гоо сайхан болон автомашин, гар багаж зэрэг зайлшгүй шаардлагатай бараануудыг худалдаалж байна. Таны амьдралыг илүү хялбар, цэгцтэй, тав тухтай болгох нь бидний зорилго.',
  openGraph: {
    title: 'Gerar Household - Гэр ахуйн бараа бүтээгдэхүүн',
    description:
      'Gerar Household-д тавтай морил! Манай гэр ахуйн барааны дэлгүүр нь таны өдөр тутмын хэрэгцээг бүрэн хангах өргөн сонголттой бүтээгдэхүүнийг нэг дороос санал болгож байна.',
    type: 'website',
    url: 'https://gerar.mn/', // Хуудасны үндсэн URL
    images: [
      {
        url: '/og-image.jpg', // public фолдер доторх зураг
        width: 1200,
        height: 630,
        alt: 'OG зураг',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <head>
        {/* Preconnect to external domains for faster connections */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.emartmall.mn" />
      </head>
      <body className="font-roboto">
        <FontLoader />
        <Providers>
          <CategoriesProvider>
            <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
              <Navigation />
            </Suspense>
            <div className="pb-14 md:pb-0">
              {children}
              {/* Desktop: бүх хуудсанд */}
              <div className="hidden md:block">
                <Footer />
              </div>
            </div>
            <BottomNav />
          </CategoriesProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
