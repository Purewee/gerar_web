'use client';

import { Suspense, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { usePointProducts, useCurrentUser } from '@/lib/api';
import { PointProductCard } from '@/components/point-product-card';
import { ProductGridSkeleton } from '@/components/skeleton';
import { Loader2, Coins } from 'lucide-react';
import { BackButton } from '@/components/back-button';

function LoyaltyStoreContent() {
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
    <div className=" min-h-screen max-w-7xl mx-auto pt-4">
      <BackButton className="ml-4 md:ml-6 border-2 border-gray-200  transition-all duration-200 rounded-lg shadow-sm" />
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 sm:py-8">
        <div className="flex flex-col mb-4 gap-8">
          <div className="relative group overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-yellow-400 via-yellow-500 to-amber-600 opacity-10 group-hover:opacity-15 transition-opacity duration-500 rounded-2xl" />
            <div className="relative border border-yellow-200/50 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/40 backdrop-blur-sm shadow-xl shadow-yellow-500/5">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 animate-pulse" />
                  <div className="relative w-14 h-14 bg-linear-to-br from-yellow-300 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform duration-500">
                    <Coins className="w-8 h-8 text-white drop-shadow-md" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-yellow-900 leading-tight">
                    Урамшууллын оноо
                  </h3>
                  <p className="text-yellow-800/60 font-medium text-xs sm:max-w-[450px] max-w-[260px] text-justify">
                    Та худалдан авалтынхаа үнийн дүнгийн 150₮ тутамд 1 оноо цуглуулна. Цуглуулсан
                    оноогоо зөвхөн энэ дэлгүүрт ашиглах боломжтой.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end gap-2">
                <div className="text-center md:text-right">
                  <div className="flex items-baseline gap-2 justify-center md:justify-end">
                    <span className="text-3xl font-black text-yellow-400 tracking-tighter">
                      {user ? user.points.toLocaleString() : '0'}
                    </span>
                    <span className="text-xs font-bold text-yellow-600 uppercase tracking-widest">
                      оноо
                    </span>
                  </div>
                </div>
                {/* <Button
                  onClick={() => (window.location.href = '/loyalty-store')}
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl px-4 py-2 shadow-md shadow-yellow-500/20 hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-300 h-auto group/btn text-xs"
                >
                  Дэлгүүр орох
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                </Button> */}
              </div>
            </div>
          </div>
          {/* {user && (
            <div className="bg-yellow-500/10 border w-full border-yellow-500/20 p-12 rounded-xl flex items-center justify-between gap-4 md:gap-6">
              <div className="bg-yellow-500 p-3 rounded-full shadow-md">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <div className="">
                <div className="text-3xl font-bold text-yellow-700 w-full flex flex-col items-center">
                  <h2>{user.points.toLocaleString()} </h2>
                  <h4 className="text-sm ">Таны оноо</h4>
                </div>
              </div>
            </div>
          )} */}
          {/* Info Card */}
          {/* <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
            <div className="bg-blue-500 text-white p-1 rounded-full text-xs">ℹ️</div>
            <div className="text-sm text-blue-800">
              <strong>Яаж оноо цуглуулах вэ?</strong>
              <p>
                Та худалдан авалтынхаа үнийн дүнгийн 150₮ тутамд 1 оноо цуглуулна. Цуглуулсан
                оноогоо зөвхөн энэ дэлгүүрт ашиглах боломжтой.
              </p>
            </div>
          </div> */}
        </div>

        {/* Products Grid */}
        <main className="flex-1 min-w-0">
          <h1 className="text-xl mb-4">Онооны дэлгүүр</h1>
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
              {products.slice(8).map(product => (
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

export default function LoyaltyStoreClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
        </div>
      }
    >
      <LoyaltyStoreContent />
    </Suspense>
  );
}
