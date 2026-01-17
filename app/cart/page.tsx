"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { useCart, useCartUpdate, useCartRemove, useCartClear, useOrderCreate, useProducts } from "@/lib/api";
import { useCategoriesStore } from "@/lib/stores/categories";
import { ProductCard } from "@/components/product-card";
import Image from "next/image";
import { CardSkeleton } from "@/components/skeleton";

export default function CartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch cart using hook
  const {
    data: cartResponse,
    isLoading: loading,
    error: cartError,
    refetch: refetchCart,
  } = useCart();
  
  const cartItems = cartResponse?.data || [];
  
  // Treat certain errors (like 401/403) as empty cart for better UX
  const isAuthError = cartError && (
    (cartError as any)?.message?.includes('401') || 
    (cartError as any)?.message?.includes('403') ||
    (cartError as any)?.message?.includes('Authentication') ||
    (cartError as any)?.message?.includes('Unauthorized')
  );

  // Fetch categories and products for suggestions
  const categories = useCategoriesStore((state) => state.categories);
  const { data: productsResponse } = useProducts({ limit: 6, sortBy: "createdAt", sortOrder: "desc" });
  const suggestedProducts = productsResponse?.data || [];

  const updateCartMutation = useCartUpdate();
  const removeCartMutation = useCartRemove();
  const clearCartMutation = useCartClear();
  const createOrderMutation = useOrderCreate();

  const handleQuantityChange = async (productId: number, delta: number) => {
    const item = cartItems.find((item) => item.productId === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) return;

    try {
      await updateCartMutation.mutateAsync({ productId, quantity: newQuantity });
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Тоо ширхэг шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      await removeCartMutation.mutateAsync(productId);
      window.dispatchEvent(new Event("cartUpdated"));
      toast({
        title: "Зүйл устгагдсан",
        description: "Зүйл таны сагснаас устгагдлаа",
      });
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Зүйл устгахад алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCartMutation.mutateAsync();
      window.dispatchEvent(new Event("cartUpdated"));
      toast({
        title: "Сагс цэвэрлэгдсэн",
        description: "Бүх зүйл сагснаас устгагдлаа",
      });
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Сагс цэвэрлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + parseFloat(item.product?.price || "0") * item.quantity,
    0
  );
  const totalSavings = cartItems.reduce(
    (sum, item) => {
      const price = parseFloat(item.product?.price || "0");
      const originalPrice = item.product?.originalPrice
        ? parseFloat(item.product.originalPrice)
        : 0;
      return sum + (originalPrice > price ? (originalPrice - price) * item.quantity : 0);
    },
    0
  );
  const totalItems = mounted ? cartItems.reduce((sum, item) => sum + item.quantity, 0) : 0;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Сагс хоосон",
        description: "Төлбөр төлөхөөс өмнө сагсанд зүйл нэмнэ үү",
      });
      return;
    }

    // Always redirect to checkout page
    router.push("/orders/create");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6  py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hidden sm:flex hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Буцах
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-linear-to-br from-primary/10 to-primary/5 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Сагс
                </h1>
                {mounted && totalItems > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {totalItems} {totalItems === 1 ? "зүйл" : "зүйл"} сагсанд байна
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {!mounted || loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : !cartResponse || cartItems.length === 0 || cartError || isAuthError ? (
          <div className="space-y-10">
            {/* Empty Cart Main Message */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-16 sm:py-20 px-6">
                <div className="relative mb-8">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 bg-linear-to-br from-primary/20 via-primary/10 to-primary/5 rounded-3xl flex items-center justify-center shadow-lg shadow-primary/10">
                    <ShoppingBag className="w-14 h-14 sm:w-18 sm:h-18 text-primary" />
                  </div>
                  <div className="absolute -top-3 -right-3 animate-bounce">
                    <div className="w-10 h-10 bg-linear-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4 text-center">
                  {cartError ? "Сагс ачаалахад алдаа гарлаа" : "Таны сагс хоосон байна"}
                </h2>
                <p className="text-gray-600 mb-2 text-center max-w-lg text-lg leading-5">
                  {cartError 
                    ? "Сагс ачаалахад алдаа гарлаа. Дахин оролдох эсвэл дэлгүүрт үргэлжлүүлэх боломжтой."
                    : "Сагсанд зүйл нэмэхийн тулд дэлгүүрт орно уу"
                  }
                </p>
                <p className="text-sm text-gray-500 mb-10 text-center">
                  Бид танд шилдэг бүтээгдэхүүн санал болгож байна
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {cartError && (
                    <Button 
                      onClick={() => refetchCart()}
                      variant="outline"
                      size="lg"
                      className="px-8 border-2 hover:bg-gray-50 transition-all"
                    >
                      Дахин оролдох
                    </Button>
                  )}
                  <Button 
                    onClick={() => router.push("/")}
                    size="lg"
                    className="px-10 py-6 text-base bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    Дэлгүүрт үргэлжлүүлэх
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Categories Section */}
            {categories.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-linear-to-br from-primary/10 to-primary/5 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Ангилалууд
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                  {categories.slice(0, 10).map((category) => (
                    <Link
                      key={category.id}
                      href={`/category?categoryId=${category.id}`}
                      className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 hover:border-primary/40 p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                    >
                      <div className="text-center space-y-3">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-linear-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                          🛍️
                        </div>
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                          {category.name}
                        </h4>
                      </div>
                      <div className="absolute inset-0 bg-linear-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-300 rounded-2xl" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Products Section */}
            {suggestedProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-linear-to-br from-primary/10 to-primary/5 rounded-lg">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Санал болгох бүтээгдэхүүн
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/products")}
                    className="text-primary hover:text-primary/80 hover:bg-primary/5 transition-colors"
                  >
                    Бүгдийг харах
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {suggestedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={parseFloat(product.price)}
                      original={product.originalPrice ? parseFloat(product.originalPrice) : undefined}
                      imageUrl={product.firstImage || product.images?.[0] || ""}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-5">
              {cartItems.map((item) => (
                <Card key={item.id} className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden bg-white">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-5">
                      {/* Product Image */}
                      <div className="shrink-0">
                        <div className="w-full sm:w-28 h-28 bg-linear-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                          {item.product?.firstImage || item.product?.images?.[0] ? (
                            <Image
                              src={item.product.firstImage || item.product.images[0]}
                              alt={item.product.name}
                              width={112}
                              height={112}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-5xl">📦</span>
                          )}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                            {item.product?.name || "Бүтээгдэхүүн"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="text-xl sm:text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                              {parseFloat(item.product?.price || "0").toLocaleString()}₮
                            </span>
                            {item.product?.originalPrice &&
                              parseFloat(item.product.originalPrice) > parseFloat(item.product.price || "0") && (
                                <>
                                  <span className="text-sm text-gray-400 line-through">
                                    {parseFloat(item.product.originalPrice).toLocaleString()}₮
                                  </span>
                                  <span className="text-xs sm:text-sm text-white bg-linear-to-r from-green-500 to-green-600 font-semibold px-2.5 py-1 rounded-full">
                                    {(
                                      (parseFloat(item.product.originalPrice) - parseFloat(item.product.price || "0")) *
                                      item.quantity
                                    ).toLocaleString()}₮ ХЭМНЭЛТ
                                  </span>
                                </>
                              )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="flex items-center gap-1 bg-gray-50 border-2 border-gray-200 rounded-xl p-1 shadow-inner">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                              onClick={() => handleQuantityChange(item.productId, -1)}
                              disabled={updateCartMutation.isPending}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-10 text-center font-bold text-gray-900 text-lg">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                              onClick={() => handleQuantityChange(item.productId, 1)}
                              disabled={updateCartMutation.isPending}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-10 w-10 transition-all"
                            onClick={() => handleRemoveItem(item.productId)}
                            disabled={removeCartMutation.isPending}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="mt-5 pt-5 border-t border-gray-100 flex justify-end">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Нийт дүн</p>
                        <p className="text-xl font-bold bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                          {(parseFloat(item.product?.price || "0") * item.quantity).toLocaleString()}₮
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-xl bg-linear-to-br from-white to-gray-50/50 backdrop-blur-sm border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-linear-to-br from-primary/10 to-primary/5 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Захиалгын хураангуй
                    </h2>
                  </div>

                  <div className="space-y-4 mb-6 bg-white/60 rounded-2xl p-5 border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Дэд дүн</span>
                      <span className="font-semibold text-gray-900">
                        {subtotal.toLocaleString()}₮
                      </span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Нийт хэмнэлт</span>
                        <span className="font-bold text-green-600 text-lg">
                          -{totalSavings.toLocaleString()}₮
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Хүргэлтийн төлбөр</span>
                      <span className="font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs">
                        ҮНЭГҮЙ
                      </span>
                    </div>
                    <div className="border-t-2 border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Нийт</span>
                        <span className="text-2xl font-bold bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                          {subtotal.toLocaleString()}₮
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full mb-3 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] text-base h-12 font-semibold"
                    size="lg"
                    disabled={createOrderMutation.isPending || cartItems.length === 0}
                  >
                    {createOrderMutation.isPending ? "Захиалга үүсгэж байна..." : "Төлбөр төлөх"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="w-full mb-3 border-2 hover:bg-gray-50 transition-all h-11"
                  >
                    Дэлгүүрт үргэлжлүүлэх
                  </Button>

                  {cartItems.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleClearCart}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all h-11"
                      disabled={clearCartMutation.isPending}
                    >
                      {clearCartMutation.isPending ? "Цэвэрлэж байна..." : "Сагс цэвэрлэх"}
                    </Button>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start gap-3 bg-linear-to-br from-green-50 to-green-50/50 rounded-lg p-4 border border-green-100">
                      <div className="p-1.5 bg-green-100 rounded-lg shrink-0">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-1">
                          Аюулгүй төлбөр
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          100% Жинхэнэ бүтээгдэхүүн
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
