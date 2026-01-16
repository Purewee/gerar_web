"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCategory, useProducts } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import Image from "next/image";
import { ProductGridSkeleton, Spinner } from "@/components/skeleton";

function CategoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get("cat");
  const categoryId = categoryParam ? parseInt(categoryParam, 10) : null;

  // Fetch products for this category using getProducts API
  const {
    data: productsResponse,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts(categoryId ? { categoryId } : undefined);
  const products = productsResponse?.data || [];

  // Get category info from products (all products in a category should have the same category)
  const category =
    products.length > 0 && products[0].category
      ? products[0].category
      : products.length > 0 &&
        products[0].categories &&
        products[0].categories.length > 0
      ? products[0].categories[0]
      : null;

  const categoryName =
    category?.name || (categoryId ? `Ангилал #${categoryId}` : "Ангилал");
  const categoryDescription = category?.description || null;

  // Show loading state while fetching products
  if (productsLoading) {
    return (
      <div className="h-full bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col items-start mb-6 sm:mb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Буцах
            </Button>
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  // Show message if no category selected
  if (!categoryId) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Ангилал сонгоно уу</p>
          <Button onClick={() => router.push("/")}>
            Нүүр хуудас руу буцах
          </Button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl sm:text-3xl font-bold">{categoryName}</h1>
            {categoryDescription && (
              <p className="text-sm text-gray-600 mt-2">
                {categoryDescription}
              </p>
            )}
            {products.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {products.length} бараа олдлоо
              </p>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {productsError ? (
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
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">
                Бараа олдсонгүй
              </h2>
              <p className="text-gray-500 mb-6 text-center">
                Энэ ангилалд одоогоор бараа байхгүй байна
              </p>
              <Button onClick={() => router.push("/")}>
                Нүүр хуудас руу буцах
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => {
              const price = parseFloat(product.price);
              const originalPrice = product.originalPrice
                ? parseFloat(product.originalPrice)
                : undefined;
              const imageUrl = product.firstImage || product.images?.[0];

              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={price}
                  original={originalPrice}
                  imageUrl={imageUrl}
                  icon={!imageUrl ? "📦" : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full bg-gray-50 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
