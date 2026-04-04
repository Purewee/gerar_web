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
import { SpecialGiftButton } from '@/components/special-gift-button';

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
        <meta name="facebook-domain-verification" content="01plsykvl6ohvoz86e18anypvssfxc" />
        {/* Facebook Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '2147663602466682');
fbq('track', 'PageView');`,
          }}
        />
        {/* End Facebook Pixel Code */}
      </head>
      <body className="font-roboto">
        {/* Facebook Pixel NoScript */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2147663602466682&ev=PageView&noscript=1"
            alt="fb_pixel"
          />
        </noscript>
        {/* End Facebook Pixel NoScript */}
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
