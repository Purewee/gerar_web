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
  metadataBase: new URL('https://gerar.mn'),
  title: {
    default: 'Gerar Household - Гэр ахуйн бараа бүтээгдэхүүн',
    template: '%s | Gerar Household',
  },
  description:
    'Gerar Household-д тавтай морил! Манай гэр ахуйн барааны дэлгүүр нь таны өдөр тутмын хэрэгцээг бүрэн хангах өргөн сонголттой бүтээгдэхүүнийг нэг дороос санал болгож байна. Гал тогооны хэрэгсэл, цэвэрлэгээний бүтээгдэхүүн, цахилгаан хэрэгслийн дагалдах хэрэгсэл, гоо сайхан болон автомашин, гар багаж зэрэг зайлшгүй шаардлагатай бараануудыг худалдаалж байна.',
  keywords: ['гэр ахуй', 'бараа', 'монгол', 'gerar', 'household', 'kitchenware', 'cleaning'],
  authors: [{ name: 'Gerar Household' }],
  creator: 'Gerar Household',
  publisher: 'Gerar Household',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'mn_MN',
    url: 'https://gerar.mn',
    siteName: 'Gerar Household',
    title: 'Gerar Household - Гэр ахуйн бараа бүтээгдэхүүн',
    description: 'Манай гэр ахуйн барааны дэлгүүр нь таны өдөр тутмын хэрэгцээг бүрэн хангах өргөн сонголттой бүтээгдэхүүнийг нэг дороос санал болгож байна.',
    images: [
      {
        url: '/logo3.svg',
        width: 800,
        height: 600,
        alt: 'Gerar Household Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gerar Household - Гэр ахуйн бараа бүтээгдэхүүн',
    description: 'Манай гэр ахуйн барааны дэлгүүр нь таны өдөр тутмын хэрэгцээг бүрэн хангах өргөн сонголттой бүтээгдэхүүнийг нэг дороос санал болгож байна.',
    images: ['/logo3.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
