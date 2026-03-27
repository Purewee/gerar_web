'use client';

import { Suspense, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useInfiniteProducts, useCategory, useFeature, type ProductsQueryParams } from '@/lib/api';
import { ProductCard } from '@/components/product-card';
import { ProductGridSkeleton } from '@/components/skeleton';
import { FilterSidebar } from '@/components/filter-sidebar';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { FilterSidebarMobile } from '@/components/filter-sidebar-mobile';

function ObserverDiv({ onIntersect, disabled }: { onIntersect: () => void; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect();
        }
      },
      { rootMargin: '200px' },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [disabled, onIntersect]);

  return <div ref={ref} className="h-4 w-full" />;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Build query params from URL
  const queryParams: ProductsQueryParams = useMemo(() => {
    const params: ProductsQueryParams = {};

    // Category filters
    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      const id = parseInt(categoryId, 10);
      if (!isNaN(id)) params.categoryId = id;
    }

    const categoryIds = searchParams.get('categoryIds');
    if (categoryIds) {
      const ids = categoryIds
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id));
      if (ids.length > 0) params.categoryIds = ids;
    }

    // Feature filters
    const featureId = searchParams.get('featureId');
    if (featureId) {
      const id = parseInt(featureId, 10);
      if (!isNaN(id)) params.featureId = id;
    }

    const featureIds = searchParams.get('featureIds');
    if (featureIds) {
      const ids = featureIds
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id));
      if (ids.length > 0) params.featureIds = ids;
    }

    const search = searchParams.get('search');
    if (search) params.search = search;

    const inStock = searchParams.get('inStock');
    if (inStock === 'true') params.inStock = true;
    if (inStock === 'false') params.inStock = false;

    const onSale = searchParams.get('onSale');
    if (onSale === 'true') params.onSale = true;

    const minPrice = searchParams.get('minPrice');
    if (minPrice) {
      const price = parseFloat(minPrice);
      if (!isNaN(price)) params.minPrice = price;
    }

    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) {
      const price = parseFloat(maxPrice);
      if (!isNaN(price)) params.maxPrice = price;
    }

    const minStock = searchParams.get('minStock');
    if (minStock) {
      const stock = parseInt(minStock, 10);
      if (!isNaN(stock)) params.minStock = stock;
    }

    const maxStock = searchParams.get('maxStock');
    if (maxStock) {
      const stock = parseInt(maxStock, 10);
      if (!isNaN(stock)) params.maxStock = stock;
    }

    const createdAfter = searchParams.get('createdAfter');
    if (createdAfter) params.createdAfter = createdAfter;

    const createdBefore = searchParams.get('createdBefore');
    if (createdBefore) params.createdBefore = createdBefore;

    const sortBy = searchParams.get('sortBy');
    if (sortBy && ['name', 'price', 'stock', 'createdAt', 'updatedAt'].includes(sortBy)) {
      params.sortBy = sortBy as ProductsQueryParams['sortBy'];
    }

    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      params.sortOrder = sortOrder as ProductsQueryParams['sortOrder'];
    }

    const page = searchParams.get('page');
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) params.page = pageNum;
    }

    const limit = searchParams.get('limit');
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) params.limit = limitNum;
    }

    return params;
  }, [searchParams]);

  const {
    data: productsResponse,
    isLoading: loading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: productsError,
  } = useInfiniteProducts(queryParams);

  const categoryId = searchParams.get('categoryId');
  const featureId = searchParams.get('featureId');
  // Fetch category name only from category API
  const { data: categoryResponse } = useCategory(categoryId ? parseInt(categoryId) : 0);
  const category = categoryResponse?.data;
  // Fetch feature name only from feature API
  const { data: featureResponse } = useFeature(featureId ? parseInt(featureId) : 0);
  const feature = featureResponse?.data;

  const pages = productsResponse?.pages || [];
  let products = pages.flatMap(page => page.data || []).filter(p => p.isHidden !== true);

  // featureId-г FilterSidebarMobile-д ашиглахын тулд дахин тодорхойлно
  // const featureId = searchParams.get('featureId');
  // Always shuffle products for random order
  if (products.length > 1) {
    products = [...products];
    for (let i = products.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [products[i], products[j]] = [products[j], products[i]];
    }
  }

  const totalProductsCount = productsResponse?.pages?.[0]?.pagination?.total ?? products.length;
  const searchQuery = searchParams.get('search');

  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');

  const isPriceAscActive = sortBy === 'price' && sortOrder === 'asc';
  const isPriceDescActive = sortBy === 'price' && sortOrder === 'desc';

  const handlePriceAsc = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('sortBy', 'price');
    params.set('sortOrder', 'asc');
    params.delete('page'); // UX

    router.push(`/products?${params.toString()}`);
  };

  const handlePriceDesc = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('sortBy', 'price');
    params.set('sortOrder', 'desc');
    params.delete('page');

    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="bg-linear-to-b from-gray-50 via-white to-gray-50 relative">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 sm:py-8 h-full">
        {/* Header (Desktop) */}
        <div className="flex hidden sm:block flex-col gap-4 mb-8">
          {/* Top Row: Back Button and Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="sm:flex items-center gap-2 px-3 sm:px-4 py-2 border-2 border-gray-200 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200 rounded-lg shadow-sm hover:shadow-md group"
              aria-label="Өмнөх хуудас руу буцах"
            >
              <ArrowLeft
                className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
                aria-hidden="true"
              />
              <span className="font-medium hidden sm:inline">Буцах</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                {mounted && searchQuery ? (
                  <>
                    Хайлтын үр дүн:{' '}
                    <span className="text-primary bg-primary/10 px-2 py-1 rounded-lg">
                      {searchQuery}
                    </span>
                  </>
                ) : mounted && searchParams.get('onSale') === 'true' ? (
                  'Хямдралтай бараа'
                ) : feature ? (
                  feature.name
                ) : category ? (
                  category.name
                ) : (
                  'Бүх бүтээгдэхүүн'
                )}
              </h1>
            </div>
          </div>
        </div>

        {/* Header (Mobile) */}
        <div className="flex sm:hidden items-center gap-3 mb-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 border-2 border-gray-200 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200 rounded-lg shadow-sm hover:shadow-md group"
            aria-label="Өмнөх хуудас руу буцах"
          >
            <ArrowLeft
              className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
            <span className="font-medium">Буцах</span>
          </Button>
          <h1 className="text-lg font-bold text-gray-900 truncate">
            {mounted && searchQuery ? (
              <>
                Хайлтын үр дүн:{' '}
                <span className="text-primary bg-primary/10 px-2 py-1 rounded-lg">
                  {searchQuery}
                </span>
              </>
            ) : mounted && searchParams.get('onSale') === 'true' ? (
              'Хямдралтай бараа'
            ) : feature ? (
              feature.name
            ) : category ? (
              category.name
            ) : (
              'Бүх бүтээгдэхүүн'
            )}
          </h1>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block shrink-0 max-w-[350px] w-full">
            <div className="sticky top-40">
              <FilterSidebar productsCount={totalProductsCount} isLoading={loading} />
            </div>
          </aside>

          {/* Products Section */}
          <main className="flex-1 min-w-0">
            {/* Hide FilterSidebarMobile if viewing a feature's products page */}
            {!(featureId && products.length > 0) && (
              <FilterSidebarMobile
                productsCount={totalProductsCount}
                isLoading={loading}
                className="sm:hidden"
              />
            )}
            {!mounted || loading ? (
              <ProductGridSkeleton count={8} grid />
            ) : productsError ? (
              <Card className="border-2 border-red-200 bg-red-50/50 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24">
                  <div className="text-6xl mb-4 animate-bounce">⚠️</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Алдаа гарлаа</h2>
                  <p className="text-gray-600 mb-6 text-center max-w-md">
                    Бараа ачаалахад алдаа гарлаа. Дахин оролдоно уу.
                  </p>
                  <Button
                    onClick={() => router.push('/')}
                    className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                  >
                    Нүүр хуудас руу буцах
                  </Button>
                </CardContent>
              </Card>
            ) : products.length === 0 ? (
              <Card className="border-2 border-gray-200 bg-linear-to-br from-gray-50 to-white shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24">
                  <div className="text-7xl mb-6 animate-pulse">🔍</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                    Бараа олдсонгүй
                  </h2>
                  <p className="text-gray-600 mb-8 text-center max-w-md">
                    {mounted && searchQuery
                      ? `${searchQuery} хайлтад тохирох бараа олдсонгүй`
                      : 'Одоогоор бараа байхгүй байна'}
                  </p>
                  <Button
                    onClick={() => router.push('/')}
                    className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                  >
                    Нүүр хуудас руу буцах
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-4 sm:gap-5">
                  {products.map((product, index) => (
                    <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4">
                      <ProductCard product={product} inGrid={true} className="h-full" />
                    </div>
                  ))}
                </div>

                {hasNextPage && (
                  <div className="mt-8 flex justify-center">
                    <ObserverDiv
                      onIntersect={() => {
                        if (!isFetchingNextPage) {
                          fetchNextPage();
                        }
                      }}
                      disabled={isFetchingNextPage}
                    />
                    {isFetchingNextPage && (
                      <div className="flex items-center gap-2 text-primary">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-medium">Уншиж байна...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProductsClient() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
