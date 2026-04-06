'use client';

import { useState, useEffect } from 'react';
import { useIsAuthenticated } from '@/components/use-is-authenticated';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Heart,
  X,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  useCart,
  useCartUpdate,
  useCartRemove,
  useCartClear,
  useOrderCreate,
  useFavoriteStatus,
  useFavoriteAdd,
  useFavoriteRemove,
} from '@/lib/api';
import Image from 'next/image';
import { CardSkeleton } from '@/components/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getDeliveryFee } from '@/lib/utils';
import { MobileHomeFooter } from '@/components/mobile-footer';

function CartItemFavoriteRemove({
  productId,
  isPointProduct = false,
  onRemove,
  removePending,
}: {
  productId: number;
  isPointProduct?: boolean;
  onRemove: () => void;
  removePending: boolean;
}) {
  const { data: statusRes } = useFavoriteStatus(productId, isPointProduct);
  const addFavoriteMutation = useFavoriteAdd();
  const removeFavoriteMutation = useFavoriteRemove();
  const isFavorited = statusRes?.data?.isFavorited ?? false;
  const isProcessingFavorite = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  const handleToggleFavorite = async () => {
    if (isProcessingFavorite) return;
    try {
      if (isFavorited) {
        await removeFavoriteMutation.mutateAsync(productId);
        toast.success('Барааг хассан', { duration: 1500 });
      } else {
        await addFavoriteMutation.mutateAsync({ productId, isPointProduct });
        toast.success('Барааг хадгалсан', { duration: 1500 });
      }
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Шинэчлэхэд алдаа гарлаа',
        duration: 1500,
      });
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-red-500 disabled:opacity-50"
        onClick={handleToggleFavorite}
        disabled={isProcessingFavorite}
        aria-label={isFavorited ? 'Хадгалах' : 'Хасах'}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : ''}`}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full bg-gray-100 hover:bg-primary/10 text-gray-500 hover:text-primary disabled:opacity-50"
        onClick={onRemove}
        disabled={removePending}
        aria-label="Устгах"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>({});
  const [isProceeding, setIsProceeding] = useState(false);
  const isAuthenticated = useIsAuthenticated();

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

  // Filter out invalid items but be forgiving about missing product objects
  // Robust detection of point products and filtering
  const cartItems = (cartResponse?.data || [])
    .map(item => ({
      ...item,
      // Infer isPointProduct if not explicitly provided but pointProduct data exists
      _computedIsPointProduct:
        item.isPointProduct ||
        (item as any).is_point_product ||
        !!(item.pointProduct || (item as any).point_product),
    }))
    .filter(item => (item.product || item.pointProduct || (item as any).point_product) != null);

  const isAuthError =
    cartError &&
    ((cartError as any)?.message?.includes('401') ||
      (cartError as any)?.message?.includes('403') ||
      (cartError as any)?.message?.includes('Authentication') ||
      (cartError as any)?.message?.includes('Unauthorized'));

  const updateCartMutation = useCartUpdate();
  const removeCartMutation = useCartRemove();
  const clearCartMutation = useCartClear();
  const createOrderMutation = useOrderCreate();

  const handleQuantityChange = async (
    productId: number,
    isPointProduct: boolean,
    delta: number,
  ) => {
    // Be flexible with item lookup
    const item = cartItems.find(
      item => item.productId === productId && item._computedIsPointProduct === isPointProduct,
    );
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) return;

    try {
      await updateCartMutation.mutateAsync({ productId, quantity: newQuantity, isPointProduct });
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Тоо ширхэг шинэчлэхэд алдаа гарлаа',
        duration: 1500,
      });
    }
  };

  const handleQuantityInputChange = (productId: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setQuantityInputs(prev => ({ ...prev, [productId]: digitsOnly }));
  };

  const handleQuantityCommit = async (
    productId: number,
    valueStr: string,
    currentQuantity: number,
  ) => {
    setQuantityInputs(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    const parsed = parseInt(valueStr, 10);
    const newQuantity = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
    if (newQuantity === currentQuantity) return;
    try {
      // Use normalized isPointProduct check
      const item = cartItems.find(i => i.productId === productId);
      const isPP = item?._computedIsPointProduct ?? false;

      await updateCartMutation.mutateAsync({
        productId,
        quantity: newQuantity,
        isPointProduct: isPP,
      });
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Тоо ширхэг шинэчлэхэд алдаа гарлаа',
        duration: 2500,
      });
    }
  };

  const handleRemoveItem = async (productId: number, isPointProduct: boolean = false) => {
    try {
      await removeCartMutation.mutateAsync({ productId, isPointProduct });
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Сагснаас хасагдсан', {
        description: 'Барааг таны сагснаас хассан.',
        duration: 1500,
      });
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Зүйл устгахад алдаа гарлаа',
        duration: 2500,
      });
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCartMutation.mutateAsync();
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Сагс цэвэрлэгдсэн', { duration: 2500 });
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Сагс цэвэрлэхэд алдаа гарлаа',
        duration: 2500,
      });
    }
  };

  const cashSubtotal = cartItems.reduce((sum, item) => {
    if (item._computedIsPointProduct) return sum;
    const productData = item.product || (item as any).product;
    return sum + parseFloat(productData?.price || '0') * item.quantity;
  }, 0);

  const pointsSubtotal = cartItems.reduce((sum, item) => {
    if (!item._computedIsPointProduct) return sum;
    const productData = item.pointProduct || (item as any).point_product || item.product;
    return sum + ((productData as any)?.pointsPrice || 0) * item.quantity;
  }, 0);
  const earnedPoints = Math.floor(cashSubtotal / 150);
  const deliveryFee = getDeliveryFee(cashSubtotal);
  const totalCash = cashSubtotal + deliveryFee;

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Сагс хоосон байна', { duration: 2500 });
      return;
    }
    setIsProceeding(true);
    if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
      (window as any).fbq('track', 'InitiateCheckout');
    }
    router.push('/orders/create');
  };

  // Helper: check if mobile (screen width <= 768px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="sm:min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 pt-4 sm:py-8">
        {/* Breadcrumbs */}
        <div className="mb-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-primary">
              Нүүр хуудас
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">Сагс</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="text-gray-400 cursor-default" aria-disabled="true">
              Захиалгын хаяг
            </span>
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
                <p className="text-md sm:text-xl lg:text-2xl px-8 sm:px-0 text-gray-500 mb-4 py-4 text-center">
                  {cartError ? 'Сагс ачаалахад алдаа гарлаа' : 'Таны сагс одоогоор хоосон байна'}
                </p>
                <p className="text-gray-600 mb-2 text-center max-w-lg text-lg leading-5">
                  {cartError
                    ? 'Сагс ачаалахад алдаа гарлаа. Дахин оролдох эсвэл дэлгүүрт үргэлжлүүлэх боломжтой.'
                    : ''}
                </p>
                {/* <p className="text-sm text-gray-500 mb-10 text-center">
                  Бид танд шилдэг бүтээгдэхүүн санал болгож байна
                </p> */}
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  {cartError && (
                    <Button
                      onClick={() => refetchCart()}
                      variant="outline"
                      size="lg"
                      className="flex-1 min-h-[48px] py-3 sm:py-2 px-4 sm:px-6 border-2 hover:bg-gray-50 transition-all"
                    >
                      Дахин оролдох
                    </Button>
                  )}
                  <Button
                    onClick={() => router.push('/')}
                    size="lg"
                    className="flex-1 max-w-max mx-auto min-h-[48px] py-1 sm:py-2 px-6 sm:px-6 text-sm sm:text-base bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    Дэлгүүрт үргэлжлүүлэх
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 mr-0" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Categories Section */}
            {/* {categories.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-linear-to-br from-primary/10 to-primary/5 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Ангилалууд</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                  {categories.slice(0, 10).map(category => (
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
            )} */}

            {/* Suggested Products Section */}
            {/* {suggestedProducts.length > 0 && ... */}
            {isMobile && <MobileHomeFooter />}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left: Таны сагс */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Таны сагс</h1>
                {mounted && cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    disabled={clearCartMutation.isPending}
                    className="
                    inline-flex items-center gap-2
                    rounded-xl px-4 py-2.5 text-sm font-medium
                    text-green-700
                    bg-green-50
                    border border-green-200
                    hover:text-red-600 hover:bg-red-50 hover:border-red-200
                    active:scale-[0.98]
                    transition-all duration-200
                    shadow-sm hover:shadow
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                    cursor-pointer
                  "
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    {clearCartMutation.isPending ? 'Цэвэрлэж байна...' : 'Сагс хоослох'}
                  </button>
                )}
              </div>

              {/* Cart item cards */}
              <div className="space-y-3">
                {cartItems.map(item => {
                  const _isPointProduct = item._computedIsPointProduct;
                  const productData = _isPointProduct
                    ? item.pointProduct || (item as any).point_product || item.product
                    : item.product;
                  const price = _isPointProduct
                    ? (productData as any)?.pointsPrice || 0
                    : parseFloat((productData as any)?.price || '0');
                  const originalPrice =
                    !_isPointProduct && (productData as any)?.originalPrice
                      ? parseFloat((productData as any).originalPrice)
                      : 0;
                  const hasDiscount = !_isPointProduct && originalPrice > price;
                  return (
                    <Card
                      key={`${item.id}-${_isPointProduct}`}
                      className={`bg-white border shadow-sm rounded-xl overflow-hidden ${_isPointProduct ? 'border-yellow-200 bg-yellow-50/5' : 'border-gray-200'}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex sm:flex-row flex-col gap-4">
                          <Link
                            href={
                              _isPointProduct
                                ? `/loyalty-store/${item.productId}`
                                : `/product/${item.productId}`
                            }
                            className="flex flex-1 items-center min-w-0 gap-4 cursor-pointer hover:opacity-90 transition-opacity"
                          >
                            <div className="shrink-0 sm:w-26 w-20 sm:h-26 h-20 rounded-lg bg-gray-100 overflow-hidden">
                              {productData?.firstImage || productData?.images?.[0] ? (
                                <Image
                                  src={productData.firstImage || productData.images[0]}
                                  alt={productData.name}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="w-full h-full flex items-center justify-center text-2xl">
                                  📦
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {item._computedIsPointProduct && (
                                  <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-[10px] font-bold text-yellow-900 uppercase">
                                    Онооны бараа
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                                {productData?.name || 'Бүтээгдэхүүн'}
                              </h3>
                              <p className="text-sm text-green-700 mb-1">
                                Үлдэгдэл: {productData?.stock ?? 0}
                              </p>
                            </div>
                          </Link>

                          <div className="flex sm:flex-col items-center sm:items-end gap-6 sm:gap-2 justify-center shrink-0">
                            <div className="hidden sm:flex items-center gap-2">
                              {hasDiscount && (
                                <span className="text-sm text-gray-400 line-through">
                                  {originalPrice.toLocaleString()}₮
                                </span>
                              )}
                              <span
                                className={`text-base font-bold ${
                                  _isPointProduct
                                    ? 'text-yellow-600'
                                    : hasDiscount
                                      ? 'text-primary'
                                      : 'text-gray-900'
                                }`}
                              >
                                {price.toLocaleString()}
                                {_isPointProduct ? ' оноо' : '₮'}
                              </span>
                            </div>
                            <div className="sm:hidden">
                              <CartItemFavoriteRemove
                                productId={item.productId}
                                isPointProduct={!!_isPointProduct}
                                onRemove={() => handleRemoveItem(item.productId, !!_isPointProduct)}
                                removePending={removeCartMutation.isPending}
                              />
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md hover:bg-white"
                                onClick={() =>
                                  handleQuantityChange(item.productId, !!_isPointProduct, -1)
                                }
                                disabled={updateCartMutation.isPending}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <Input
                                type="text"
                                inputMode="numeric"
                                className="w-10 h-8 p-0 text-center text-sm font-semibold border-0 bg-white rounded-md shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={
                                  quantityInputs[item.productId] !== undefined
                                    ? quantityInputs[item.productId]
                                    : String(item.quantity)
                                }
                                onFocus={() =>
                                  setQuantityInputs(prev => ({
                                    ...prev,
                                    [item.productId]: String(item.quantity),
                                  }))
                                }
                                onChange={e =>
                                  handleQuantityInputChange(item.productId, e.target.value)
                                }
                                onBlur={() =>
                                  handleQuantityCommit(
                                    item.productId,
                                    quantityInputs[item.productId] ?? String(item.quantity),
                                    item.quantity,
                                  )
                                }
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                disabled={updateCartMutation.isPending}
                                aria-label="Тоо ширхэг"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md hover:bg-white"
                                onClick={() =>
                                  handleQuantityChange(item.productId, !!_isPointProduct, 1)
                                }
                                disabled={updateCartMutation.isPending}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="sm:block hidden">
                              <CartItemFavoriteRemove
                                productId={item.productId}
                                isPointProduct={!!_isPointProduct}
                                onRemove={() => handleRemoveItem(item.productId, !!_isPointProduct)}
                                removePending={removeCartMutation.isPending}
                              />
                            </div>
                            <div className="text-sm text-center text-gray-900 sm:flex-row sm:gap-1 flex flex-col">
                              Нийт дүн:{' '}
                              <span
                                className={`font-bold ${_isPointProduct ? 'text-yellow-600' : ''}`}
                              >
                                {(price * item.quantity).toLocaleString()}
                                {_isPointProduct ? ' оноо' : '₮'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right: Төлбөрийн мэдээлэл */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Төлбөрийн мэдээлэл</h2>

              {/* Order summary card */}
              <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Бүтээгдэхүүний үнэ</span>
                    <span className="font-medium text-gray-900">
                      {cashSubtotal.toLocaleString()}₮
                    </span>
                  </div>
                  {pointsSubtotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-600 font-medium">Онооны дүн</span>
                      <span className="font-bold text-yellow-600">
                        {pointsSubtotal.toLocaleString()} оноо
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Хүргэлтийн үнэ</span>
                    <span className="font-medium text-gray-900">
                      {deliveryFee === 0 ? '\u00A0\u00A0\u00A0' : ''}
                      {deliveryFee.toLocaleString()}₮
                    </span>
                  </div>

                  <div className="flex justify-between text-sm w-full font-semibold">
                    <span className="text-gray-500 bg-orange-50 w-full border-orange-200 border rounded-md p-2">
                      <span> </span> 0 – 50,000₮ захиалга = 5,000₮ <br /> 50,000 – 90,000₮ захиалга
                      = 3,000₮ <br />
                      90,000₮ + захиалга = <span className="uppercase text-red-500">үнэгүй</span>
                    </span>
                  </div>
                  {!isAuthenticated && (
                    <p className="text-sm text-gray-600 mt-3">
                      Та зөвхөн нэвтэрсэн үед л оноогоо цуглуулах боломжтой.{' '}
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                        className="text-primary font-medium hover:underline"
                      >
                        {' '}
                        Нэвтрэх
                      </button>
                    </p>
                  )}
                  {isAuthenticated && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-semibold text-blue-700">
                            Цуглуулах оноо:
                          </span>
                        </div>
                        <span className="text-sm font-bold text-blue-800">
                          +{earnedPoints.toLocaleString()} оноо
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Нийт төлөх дүн</span>
                      <span className="text-lg font-bold text-primary">
                        {totalCash.toLocaleString()}₮
                      </span>
                    </div>
                    {pointsSubtotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-yellow-700">Нийт ашиглах оноо</span>
                        <span className="text-lg font-bold text-yellow-600">
                          {pointsSubtotal.toLocaleString()} оноо
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Continue button */}
              <Button
                onClick={handleCheckout}
                className="w-full min-h-[48px] py-3 sm:py-2 px-4 sm:px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-base font-semibold"
                size="lg"
                disabled={createOrderMutation.isPending || isProceeding || cartItems.length === 0}
              >
                {createOrderMutation.isPending || isProceeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Захиалга үүсгэж байна...
                  </>
                ) : (
                  'Үргэлжлүүлэх'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
