"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProducts, type ProductsQueryParams } from "@/lib/api";
import { ProductCard } from "@/components/product-card";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Build query params from URL
  const queryParams: ProductsQueryParams = useMemo(() => {
    const params: ProductsQueryParams = {};

    const categoryId = searchParams.get("categoryId");
    if (categoryId) {
      const id = parseInt(categoryId, 10);
      if (!isNaN(id)) params.categoryId = id;
    }

    const categoryIds = searchParams.get("categoryIds");
    if (categoryIds) {
      const ids = categoryIds.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
      if (ids.length > 0) params.categoryIds = ids;
    }

    const search = searchParams.get("search");
    if (search) params.search = search;

    const inStock = searchParams.get("inStock");
    if (inStock === "true") params.inStock = true;
    if (inStock === "false") params.inStock = false;

    const minPrice = searchParams.get("minPrice");
    if (minPrice) {
      const price = parseFloat(minPrice);
      if (!isNaN(price)) params.minPrice = price;
    }

    const maxPrice = searchParams.get("maxPrice");
    if (maxPrice) {
      const price = parseFloat(maxPrice);
      if (!isNaN(price)) params.maxPrice = price;
    }

    const minStock = searchParams.get("minStock");
    if (minStock) {
      const stock = parseInt(minStock, 10);
      if (!isNaN(stock)) params.minStock = stock;
    }

    const maxStock = searchParams.get("maxStock");
    if (maxStock) {
      const stock = parseInt(maxStock, 10);
      if (!isNaN(stock)) params.maxStock = stock;
    }

    const createdAfter = searchParams.get("createdAfter");
    if (createdAfter) params.createdAfter = createdAfter;

    const createdBefore = searchParams.get("createdBefore");
    if (createdBefore) params.createdBefore = createdBefore;

    const sortBy = searchParams.get("sortBy");
    if (sortBy && ["name", "price", "stock", "createdAt", "updatedAt"].includes(sortBy)) {
      params.sortBy = sortBy as ProductsQueryParams["sortBy"];
    }

    const sortOrder = searchParams.get("sortOrder");
    if (sortOrder && ["asc", "desc"].includes(sortOrder)) {
      params.sortOrder = sortOrder as ProductsQueryParams["sortOrder"];
    }

    const page = searchParams.get("page");
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) params.page = pageNum;
    }

    const limit = searchParams.get("limit");
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
  const products = productsResponse?.data || [];
  const searchQuery = searchParams.get("search");

  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="flex flex-col items-start mb-6 sm:mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Буцах
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {searchQuery ? (
                <>
                  Хайлтын үр дүн:{" "}
                  <span className="text-primary">"{searchQuery}"</span>
                </>
              ) : (
                "Бүх бүтээгдэхүүн"
              )}
            </h1>
            {products.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {products.length} бараа олдлоо
              </p>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Бараа ачаалж байна...</p>
            </div>
          </div>
        ) : productsError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">
                Алдаа гарлаа
              </h2>
              <p className="text-gray-500 mb-6 text-center">
                Бараа ачаалахад алдаа гарлаа. Дахин оролдоно уу.
              </p>
              <Button onClick={() => router.push("/")}>
                Нүүр хуудас руу буцах
              </Button>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">
                Бараа олдсонгүй
              </h2>
              <p className="text-gray-500 mb-6 text-center">
                {searchQuery
                  ? `"${searchQuery}" хайлтад тохирох бараа олдсонгүй`
                  : "Одоогоор бараа байхгүй байна"}
              </p>
              <Button onClick={() => router.push("/")}>
                Нүүр хуудас руу буцах
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={parseFloat(product.price)}
                original={product.originalPrice ? parseFloat(product.originalPrice) : undefined}
                imageUrl={product.firstImage || product.images?.[0]}
                icon={!product.firstImage && !product.images?.[0] ? "📦" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

