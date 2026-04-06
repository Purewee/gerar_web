'use client';

import { Suspense, useState, useEffect } from 'react';
import { BackButton } from '@/components/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { usePointProducts, useCurrentUser } from '@/lib/api';
import { GiftProductCard } from '@/components/gift-product-card';
import { ProductGridSkeleton } from '@/components/skeleton';
import { Loader2, MessageSquareWarning } from 'lucide-react';

function GiftStoreContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const { data: userResponse } = useCurrentUser();
  const user = userResponse?.data;

  const { data: productsResponse, isLoading: loading, error: productsError } = usePointProducts();
  const products = productsResponse?.data || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-4 max-w-7xl mx-auto bg-linear-to-bl from-indigo-500 via-purple-500 to-pink-500">
      <BackButton className="ml-4 md:ml-6 border-2 text-white border-gray-200  transition-all duration-200 rounded-lg shadow-sm" />
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 sm:py-8">
        {/* Info Card */}
        <div className="mb-8 p-4 md:p-8 md:py-16 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
          <div className="bg-blue-500 text-white md:p-4 p-2 rounded-full text-xs">
            <MessageSquareWarning className="md:w-8 w-4 h-4 md:h-8" />
          </div>
          <div className="text-sm text-blue-800">
            <strong className="md:text-2xl text-xl">5 сарын 15-ыг хүртэл</strong>
            <article className="text-sm md:text-base text-justify">
              Захиалга бүрт урамшууллын бэлэг дагалдана.
            </article>
          </div>
        </div>

        {/* Products Grid */}
        <main className="flex-1 min-w-0">
          <h1 className="text-xl mb-4 sm:text-2xl text-white font-bold text-gray-900 flex items-center gap-2">
            {/* <span className="">🎁</span> */}
            Бэлэгний жагсаалт
          </h1>
          {loading ? (
            <ProductGridSkeleton count={8} grid />
          ) : productsError ? (
            <Card className="border-2 border-red-200 bg-red-50/50 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Алдаа гарлаа</h2>
                <p className="text-gray-600 mb-6 text-center max-w-md">
                  Бараа ачаалахад алдаа гарлаа. Дахин оролдоно уу.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  Дахин ачаалах
                </Button>
              </CardContent>
            </Card>
          ) : products.length === 0 ? (
            <Card className="border-2 border-gray-200 bg-linear-to-br from-gray-50 to-white shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24">
                <div className="text-7xl mb-6 opacity-30">🎁</div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                  Одоогоор бараа байхгүй байна
                </h2>
                <p className="text-gray-600 mb-8 text-center max-w-md">
                  Онооны дэлгүүрт тун удахгүй шинэ бараанууд нэмэгдэх болно.
                </p>
                <Button
                  onClick={() => router.push('/')}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  Нүүр хуудас руу буцах
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {products.slice(0, 8).map(product => (
                <div
                  key={product.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  <GiftProductCard product={product} inGrid={true} className="h-full" />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function GiftStoreClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
        </div>
      }
    >
      <GiftStoreContent />
    </Suspense>
  );
}
