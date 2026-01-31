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
const Footer = dynamic(() => import('@/components/footer').then(mod => mod.Footer), {
  ssr: true, // Keep SSR for SEO but load async
});

export const metadata: Metadata = {
  title: 'GERAR',
  description:
    'GERAR-д тавтай морил! Тавилга, гэрийн чимэглэл, гэрэлтүүлэг, орны даавуу, гал тогооны хэрэгсэл болон гэрийн тавилгын бүх хэрэгцээнд хамгийн сайн хямд үнэ, санал болголттой.',
  other: {
    'google-fonts': 'https://fonts.googleapis.com',
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
            <div className="pb-20 md:pb-0">
              {children}
              <Footer />
            </div>
            <BottomNav />
          </CategoriesProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
