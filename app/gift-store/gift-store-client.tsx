'use client';

import { Suspense, useState, useEffect } from 'react';
import { BackButton } from '@/components/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { usePointProducts, useCurrentUser } from '@/lib/api';
import { PointProductCard } from '@/components/point-product-card';
import { ProductGridSkeleton } from '@/components/skeleton';
import { ArrowLeft, Loader2, Coins, MessageSquareWarning } from 'lucide-react';

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
    <div className="min-h-screen pt-4 max-w-7xl mx-auto">
      <BackButton className="ml-4 md:ml-6 border-2 border-gray-200  transition-all duration-200 rounded-lg shadow-sm" />
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 sm:py-8">
        {/* Info Card */}
        <div className="mb-8 p-4 md:p-8 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
          <div className="bg-blue-500 text-white md:p-4 p-2 rounded-full text-xs">
            <MessageSquareWarning className="md:w-8 w-4 h-4 md:h-8" />
          </div>
          <div className="text-sm text-blue-800">
            <strong className="md:text-2xl text-xl">5 сарын 15 ыг хүртэл</strong>
            <article className="text-sm md:text-base text-justify">
              Манайхаас захиалга хийх бүрт таньд жижиг урамшуулал бэлдсэн байгаа бөгөөд захиалга
              бүрт бэлэг дагалдана
            </article>
          </div>
        </div>

        {/* Products Grid */}
        <main className="flex-1 min-w-0">
          <h1 className="text-xl mb-4 sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            {/* <span className="">🎁</span> */}
            Бэлэгний жагсаалт
          </h1>
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
