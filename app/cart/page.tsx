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

import { useOTPSendForSimpleOrder, useSimpleOrderCreate } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';

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
  // --- Resend OTP Timer State ---
  const [otpResendTimer, setOtpResendTimer] = useState(60);
  const [otpResendActive, setOtpResendActive] = useState(false);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>({});
  const [isProceeding, setIsProceeding] = useState(false);
  const isAuthenticated = useIsAuthenticated();

  // --- Simple Order (OTP-based) Modal State and Logic ---
  const [simpleOrderOpen, setSimpleOrderOpen] = useState(false);
  const [simpleOrderStep, setSimpleOrderStep] = useState<'form' | 'otp'>('form');
  const [simpleOrderPhone, setSimpleOrderPhone] = useState('');
  const [simpleOrderAddress, setSimpleOrderAddress] = useState('');
  const [simpleOrderNote, setSimpleOrderNote] = useState('');
  const [simpleOrderOtp, setSimpleOrderOtp] = useState('');
  const [simpleOrderLoading, setSimpleOrderLoading] = useState(false);
  const [simpleOrderError, setSimpleOrderError] = useState('');
  const [simpleOrderSuccess, setSimpleOrderSuccess] = useState(false);

  // Open modal handler
  const handleOpenSimpleOrder = () => {
    if (cartItems.length === 0) {
      setSimpleOrderLoading(true);
      toast.error('Сагс хоосон байна', { duration: 2500 });
      setTimeout(() => setSimpleOrderLoading(false), 1000);
      return;
    }
    if (totalCash > 150000) {
      setSimpleOrderLoading(true);
      toast.error('Нийт дүн 150,000₮-өөс их үед хялбар захиалга хийх боломжгүй!', {
        duration: 4000,
      });
      setTimeout(() => setSimpleOrderLoading(false), 1000);
      return;
    }
    setSimpleOrderOpen(true);
    setSimpleOrderStep('form');
    setSimpleOrderPhone('');
    setSimpleOrderAddress('');
    setSimpleOrderNote('');
    setSimpleOrderOtp('');
    setSimpleOrderError('');
    setSimpleOrderSuccess(false);
  };

  // Simple order OTP mutation
  const otpSendMutation = useOTPSendForSimpleOrder();

  // Send OTP handler
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSimpleOrderError('');
    if (!simpleOrderPhone || simpleOrderPhone.length !== 8) {
      setSimpleOrderError('Утасны дугаар 8 оронтой байх ёстой.');
      return;
    }
    if (!simpleOrderAddress) {
      setSimpleOrderError('Хаяг заавал бөглөнө үү.');
      return;
    }
    if (!simpleOrderNote) {
      setSimpleOrderError('Дэлгэрэнгүй хаяг заавал бөглөнө үү.');
      return;
    }
    setSimpleOrderLoading(true);
    otpSendMutation.mutate(
      { phoneNumber: simpleOrderPhone },
      {
        onSuccess: data => {
          setSimpleOrderStep('otp');
          setOtpResendTimer(60);
          setOtpResendActive(true);
          toast.success('OTP илгээгдлээ', { duration: 2000 });
        },
        onError: (err: any) => {
          setSimpleOrderError('OTP илгээхэд алдаа гарлаа');
        },
        onSettled: () => {
          setSimpleOrderLoading(false);
        },
      },
    );
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (otpResendActive || simpleOrderLoading) return;
    setSimpleOrderError('');
    setSimpleOrderLoading(true);
    otpSendMutation.mutate(
      { phoneNumber: simpleOrderPhone },
      {
        onSuccess: data => {
          setOtpResendTimer(60);
          setOtpResendActive(true);
          toast.success('OTP дахин илгээгдлээ', { duration: 2000 });
        },
        onError: (err: any) => {
          setSimpleOrderError('OTP илгээхэд алдаа гарлаа');
        },
        onSettled: () => {
          setSimpleOrderLoading(false);
        },
      },
    );
  };

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (simpleOrderStep === 'otp' && otpResendActive && otpResendTimer > 0) {
      timer = setTimeout(() => {
        setOtpResendTimer(t => t - 1);
      }, 1000);
    } else if (otpResendTimer === 0) {
      setOtpResendActive(false);
    }
    return () => clearTimeout(timer);
  }, [simpleOrderStep, otpResendActive, otpResendTimer]);

  const simpleOrderCreateMutation = useSimpleOrderCreate();

  // Confirm OTP and create order handler
  const handleConfirmOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSimpleOrderError('');
    if (!simpleOrderOtp || simpleOrderOtp.length !== 4) {
      setSimpleOrderError('4 оронтой OTP код оруулна уу.');
      return;
    }
    setSimpleOrderLoading(true);
    let sessionToken = null;
    if (typeof window !== 'undefined') {
      sessionToken = localStorage.getItem('sessionToken');
    }
    simpleOrderCreateMutation.mutate(
      {
        phoneNumber: simpleOrderPhone,
        otpCode: simpleOrderOtp,
        address: simpleOrderAddress,
        addressNote: simpleOrderNote,
        ...(sessionToken ? { sessionToken } : {}),
      },
      {
        onSuccess: async data => {
          await clearCartMutation.mutateAsync();
          window.dispatchEvent(new Event('cartUpdated'));
          setSimpleOrderSuccess(true);
          // Success modal will stay open until user closes it manually
          // Removed setTimeout for auto-close
          toast.success('Захиалга амжилттай!', { duration: 2500 });
        },
        onError: (err: any) => {
          setSimpleOrderError(err.message || 'Захиалга үүсгэхэд алдаа гарлаа');
        },
        onSettled: () => {
          setSimpleOrderLoading(false);
        },
      },
    );
  };

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
    <>
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
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20 px-6">
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
                  <p className="text-md sm:text-xl lg:text-2xl px-8 sm:px-0 text-gray-500  text-center">
                    {cartError ? 'Сагс ачаалахад алдаа гарлаа' : 'Таны сагс одоогоор хоосон байна'}
                  </p>
                  <p className="text-gray-600 mb-2 text-center max-w-lg text-lg leading-5">
                    {cartError
                      ? 'Сагс ачаалахад алдаа гарлаа. Дахин оролдох эсвэл дэлгүүрт үргэлжлүүлэх боломжтой.'
                      : ''}
                  </p>
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
                      variant="link"
                      asChild
                      className="bg-white border border-2 border-gray-200 max-w-max text-gray-700 mx-auto"
                    >
                      <Link href="/">Дэлгүүрт орох</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
                                  onRemove={() =>
                                    handleRemoveItem(item.productId, !!_isPointProduct)
                                  }
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
                                  onRemove={() =>
                                    handleRemoveItem(item.productId, !!_isPointProduct)
                                  }
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
                        <span> </span> 0 – 50,000₮ захиалга = 5,000₮ <br /> 50,000 – 90,000₮
                        захиалга = 3,000₮ <br />
                        90,000₮ + захиалга = <span className="uppercase text-red-500">үнэгүй</span>
                      </span>
                    </div>
                    {!isAuthenticated && (
                      <p className="text-sm text-gray-600 mt-3">
                        Та зөвхөн нэвтэрсэн үед л оноогоо цуглуулах боломжтой.{' '}
                        <button
                          type="button"
                          // onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                          className="text-primary font-medium hover:underline"
                        >
                          {' '}
                          Нэвтрэх / Бүртгүүлэх
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

                {/* Checkout and Simple Order buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="w-full min-h-[48px] py-3 sm:py-2 px-4 sm:px-6 rounded-xl text-base font-semibold border-2 border-primary text-primary hover:bg-primary/10 transition-all hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                    // onClick={handleOpenSimpleOrder}
                    disabled={simpleOrderLoading}
                  >
                    {simpleOrderLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Түр хүлээнэ үү...
                      </>
                    ) : (
                      'Хялбар захиалга'
                    )}
                  </Button>
                  {isAuthenticated && (
                    <Button
                      onClick={handleCheckout}
                      className="w-full min-h-[48px] py-3 sm:py-2 px-4 sm:px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-base font-semibold"
                      size="lg"
                      disabled={
                        createOrderMutation.isPending || isProceeding || cartItems.length === 0
                      }
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
                  )}

                  {!isAuthenticated && (
                    <Button
                      type="button"
                      className="w-full min-h-[48px] py-3 sm:py-2 px-4 sm:px-6 rounded-xl text-base font-semibold border border-primary text-white hover:bg-primary/90 bg-primary"
                      // onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                    >
                      Нэвтрэх / Бүртгүүлэх
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Dialog
        open={simpleOrderOpen}
        onOpenChange={open => {
          if (!open) setSimpleOrderOpen(false);
        }}
      >
        <DialogContent
          className="p-4 border-none rounded-lg sm:max-w-md w-full"
          onInteractOutside={e => e.preventDefault()}
          tabIndex={-1}
        >
          <DialogClose asChild>
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setSimpleOrderOpen(false)}
              disabled={simpleOrderLoading}
              aria-label="Хаах"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
          <DialogTitle asChild>
            <div>
              <h3 className="text-xl font-bold mb-2 text-center text-gray-800">Хялбар захиалга</h3>
              <h4 className=" mb-2 text-sm text-center text-gray-600">
                Та захиалгаа хүлээж авах үедээ төлбөрөө төлнө
              </h4>
            </div>
          </DialogTitle>
          {/* ...existing modal content... */}
          {simpleOrderSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Sparkles className="w-10 h-10 text-green-500 mb-2" />
              <div className="text-lg font-semibold text-green-700 mb-2">Захиалга амжилттай!</div>
              <div className="text-gray-600 text-center mb-4">Таны захиалгыг хүлээн авлаа.</div>
              <Button className="mt-2" onClick={() => setSimpleOrderOpen(false)} variant="outline">
                Хаах
              </Button>
            </div>
          ) : simpleOrderStep === 'form' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Утасны дугаар<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-300 autofill:!bg-white"
                  placeholder="xxxx-xxxx"
                  value={simpleOrderPhone}
                  onChange={e => setSimpleOrderPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  maxLength={8}
                  disabled={simpleOrderLoading}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Хаяг<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-300 autofill:!bg-white"
                  placeholder="барилга, хороолол, оффис"
                  value={simpleOrderAddress}
                  onChange={e => setSimpleOrderAddress(e.target.value)}
                  disabled={simpleOrderLoading}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дэлгэрэнгүй хаяг<span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={simpleOrderNote}
                  onChange={e => setSimpleOrderNote(e.target.value)}
                  placeholder="давхар, тоот, орцны код гэх мэт"
                  maxLength={500}
                  rows={2}
                  disabled={simpleOrderLoading}
                />
              </div>
              <div className="p-2 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-3">
                <div className="text-sm text-blue-800">
                  <article className="text-sm  ">
                    Хялбар захиалга хийх үед: <br />
                    - Урамшууллын оноо, бэлэг, НӨАТ олгохгүй <br /> - Захиалгаа өөрчлөх боломжгүй{' '}
                    <br />- Хүргэлт 48 цагын дотор хийгдэнэ
                  </article>
                </div>
              </div>
              {simpleOrderError && (
                <div className="text-red-600 text-sm text-center">{simpleOrderError}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-2 font-semibold mt-2"
                disabled={simpleOrderLoading}
              >
                {simpleOrderLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                ) : null}
                Нэг удаагын код илгээх
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirmOtp} className="space-y-4">
              <div className="text-center text-gray-700 mb-2">
                <span className="font-medium">Утас:</span> {simpleOrderPhone}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP код</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full border border-input rounded-lg px-3 py-2 text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="____"
                  value={simpleOrderOtp}
                  onChange={e => setSimpleOrderOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  disabled={simpleOrderLoading}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {otpResendActive && otpResendTimer > 0
                      ? `Дахин илгээх (${otpResendTimer} сек)`
                      : ''}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 py-1"
                    onClick={handleResendOtp}
                    disabled={otpResendActive || simpleOrderLoading}
                  >
                    Дахин илгээх
                  </Button>
                </div>
              </div>
              {simpleOrderError && (
                <div className="text-red-600 text-sm text-center">{simpleOrderError}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-2 font-semibold mt-2"
                disabled={simpleOrderLoading}
              >
                {simpleOrderLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                ) : null}
                Захиалга баталгаажуулах
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
