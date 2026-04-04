'use client';

import { Suspense, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { usePointProducts, useCurrentUser } from '@/lib/api';
import { PointProductCard } from '@/components/point-product-card';
import { ProductGridSkeleton } from '@/components/skeleton';
import { ArrowLeft, Loader2, Coins } from 'lucide-react';

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
    <div className="bg-linear-to-b from-yellow-50 via-white to-gray-50 min-h-screen pt-4 max-w-7xl mx-auto">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="flex items-center gap-2 px-2 ml-4 md:ml-6 border-2 border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-200 rounded-lg shadow-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="font-medium">Буцах</span>
      </Button>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 sm:py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-yellow-100">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                {/* <Coins className="w-8 h-8 text-yellow-500" /> */}
                <span className="">🎁</span>
                Бэлэгний дэлгүүр
              </h1>
              <p className="text-gray-500 text-sm mt-1">Цуглуулсан оноогоороо бэлэг аваарай</p>
            </div>
          </div>

          {user && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 px-6 py-3 rounded-xl flex items-center gap-4">
              <div className="bg-yellow-500 p-2 rounded-full shadow-md">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-sm text-yellow-800 font-medium block">Таны оноо</span>
                <span className="text-2xl font-bold text-yellow-700">
                  {user.points.toLocaleString()}{' '}
                  <span className="text-sm font-semibold uppercase">оноо</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
          <div className="bg-blue-500 text-white p-1 rounded-full text-xs">ℹ️</div>
          <div className="text-sm text-blue-800">
            <strong>Яаж оноо цуглуулах вэ?</strong> Та 150₮-ийн худалдан авалт тутамдаа 1 оноо
            цуглуулна. Цуглуулсан оноо бүр нь 1₮-тэй тэнцэх үнэтэй бөгөөд зөвхөн энэ дэлгүүрт
            ашиглах боломжтой.
          </div>
        </div>

        {/* Products Grid */}
        <main className="flex-1 min-w-0">
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
              {products.map(product => (
                <div
                  key={product.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  <PointProductCard product={product} inGrid={true} className="h-full" />
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
