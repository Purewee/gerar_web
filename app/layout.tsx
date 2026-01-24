import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ConditionalNavigation } from '@/components/conditional-navigation';
import { Providers } from '@/lib/providers';
import { CategoriesProvider } from '@/components/categories-provider';

export const metadata: Metadata = {
  title: 'GERAR',
  description:
    'GERAR-д тавтай морил! Тавилга, гэрийн чимэглэл, гэрэлтүүлэг, орны даавуу, гал тогооны хэрэгсэл болон гэрийн тавилгын бүх хэрэгцээнд хамгийн сайн хямд үнэ, санал болголттой.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className="font-roboto">
        <Providers>
          <CategoriesProvider>
            <ConditionalNavigation>{children}</ConditionalNavigation>
          </CategoriesProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
