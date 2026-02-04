'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProducts, type ProductsQueryParams } from '@/lib/api';
import { ProductCard } from '@/components/product-card';
import { ProductGridSkeleton } from '@/components/skeleton';
import { FilterSidebar } from '@/components/filter-sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Build query params from URL
  const queryParams: ProductsQueryParams = useMemo(() => {
    const params: ProductsQueryParams = {};

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

    const search = searchParams.get('search');
    if (search) params.search = search;

    const inStock = searchParams.get('inStock');
    if (inStock === 'true') params.inStock = true;
    if (inStock === 'false') params.inStock = false;

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

  // Fetch products using hook
  const {
    data: productsResponse,
    isLoading: loading,
    error: productsError,
  } = useProducts(queryParams);
  const products = (productsResponse?.data || []).filter(p => p.isHidden !== true);
  const searchQuery = searchParams.get('search');

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchParams.get('categoryId') || searchParams.get('categoryIds')) count++;
    if (searchParams.get('minPrice') || searchParams.get('maxPrice')) count++;
    if (searchParams.get('inStock') === 'true') count++;
    return count;
  }, [searchParams]);

  return (
    <div className="bg-linear-to-b from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Top Row: Back Button and Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="sm:flex hidden items-center gap-2 px-3 sm:px-4 py-2 border-2 border-gray-200 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200 rounded-lg shadow-sm hover:shadow-md group"
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
                ) : (
                  'Бүх бүтээгдэхүүн'
                )}
              </h1>
            </div>
          </div>

          {/* Bottom Row: Active Filters and Mobile Filter Button */}
          <div className="flex items-center justify-between gap-4">
            {mounted && activeFiltersCount > 0 && !loading && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                {activeFiltersCount} шүүлт идэвхтэй
              </span>
            )}

            {/* Mobile Filter Button */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="sm:hidden border-2 border-gray-300 hover:border-primary hover:bg-primary/5 transition-all shadow-sm hover:shadow-md"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Шүүлт
                  {mounted && activeFiltersCount > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center text-[14px] leading-[14px] font-bold shadow-sm">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[85vw] sm:w-[400px] overflow-y-auto bg-gray-50"
              >
                <SheetHeader className="border-b border-gray-200 pb-4 mb-4">
                  <SheetTitle className="text-xl font-bold text-gray-900">Шүүлт</SheetTitle>
                </SheetHeader>
                <div className="mt-2">
                  <FilterSidebar productsCount={products.length} isLoading={loading} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block shrink-0 max-w-[350px] w-full">
            <div className="sticky top-6">
              <FilterSidebar productsCount={products.length} isLoading={loading} />
            </div>
          </aside>

          {/* Products Section */}
          <main className="flex-1 min-w-0">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-4 sm:gap-5">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ProductCard product={product} inGrid={true} className="h-full" />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
