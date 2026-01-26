'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, QrCode, CheckCircle2, Phone, Loader2, XCircle, RefreshCw } from 'lucide-react';
import { useOrder, usePaymentStatus, usePaymentInitiate, usePaymentCancel } from '@/lib/api';
import { toast } from 'sonner';
import Image from 'next/image';
import { CardSkeleton } from '@/components/skeleton';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);

  const { data: orderResponse, isLoading, error } = useOrder(
    isNaN(orderId) ? 0 : orderId,
  );
  const order = orderResponse?.data;

  const { data: paymentStatusResponse, refetch: refetchPaymentStatus, isFetching: isFetchingPaymentStatus } = usePaymentStatus(orderId, {
    stopPollingAfter: 60 * 60 * 1000, // Stop polling after 1 hour
  });
  const paymentStatus =
    paymentStatusResponse?.data?.paymentStatus || order?.paymentStatus || 'PENDING';
  const shouldStopPolling = paymentStatusResponse?.data?.shouldStopPolling || false;

  // QR Code state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentUrls, setPaymentUrls] = useState<{
    web: string;
    deeplink: string;
  } | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [hasInitiated, setHasInitiated] = useState(false);
  const initiationAttemptedRef = useRef(false);

  const initiatePaymentMutation = usePaymentInitiate();
  const cancelPaymentMutation = usePaymentCancel();

  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate derived values (safe even if order is undefined)
  const orderDate = order ? new Date(order.createdAt) : null;
  const formattedDate = orderDate
    ? orderDate.toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '';
  const formattedTime = orderDate
    ? orderDate.toLocaleTimeString('mn-MN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '';

  const isCancelled =
    order?.status === 'CANCELLED' || paymentStatus === 'CANCELLED';
  const isPaid = paymentStatus === 'PAID' || order?.status === 'PAID';
  const isPending = order?.status === 'PENDING' && paymentStatus !== 'PAID';

  // Handle payment initiation
  const handleInitiatePayment = useCallback(async () => {
    if (!orderId || isNaN(orderId)) {
      toast.error('Алдаа', {
        description: 'Захиалгын ID олдсонгүй',
      });
      return;
    }

    if (initiationAttemptedRef.current || initiatePaymentMutation.isPending) {
      return;
    }

    initiationAttemptedRef.current = true;
    setHasInitiated(true);

    try {
      const response = await initiatePaymentMutation.mutateAsync(orderId);
      if (response.data) {
        if (response.data.qrCode) {
          setQrCode(response.data.qrCode);
          
          if (response.data.urls) {
            setPaymentUrls(response.data.urls);
          }
          
          if (response.data.expiryDate) {
            const expiry = new Date(response.data.expiryDate);
            setExpiryDate(expiry);
            const remaining = Math.max(0, expiry.getTime() - Date.now());
            setTimeRemaining(remaining);
          }
          
          if (response.data.isExpired) {
            setQrCode(null);
            setExpiryDate(null);
            setTimeRemaining(0);
            toast.error('QR код хүчингүй боллоо', {
              description: 'QR код хүчингүй болсон. Захиалга цуцлагдсан байна.',
            });
          } else {
            toast.success('Төлбөрийн нэхэмжлэх үүслээ', {
              description: 'QR код амжилттай үүслээ. Төлбөр төлөхөөр QPAY апп ашиглана уу',
            });
          }
        } else {
          initiationAttemptedRef.current = false;
          setHasInitiated(false);
          toast.error('Алдаа гарлаа', {
            description: 'QR код үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.',
          });
        }
        
        if (response.data.urls && !response.data.qrCode) {
          setPaymentUrls(response.data.urls);
        }
      }
    } catch (error: any) {
      initiationAttemptedRef.current = false;
      setHasInitiated(false);
      
      let errorMessage = 'Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа';
      if (error.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 500) {
        errorMessage = 'Серверийн алдаа. Төлбөрийн систем тохируулаагүй байна. Админтай холбогдоно уу.';
      } else if (error?.response?.status === 400) {
        errorMessage = 'Захиалга аль хэдийн төлөгдсөн эсвэл цуцлагдсан байна.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Захиалга олдсонгүй.';
      }
      
      toast.error('Алдаа гарлаа', {
        description: errorMessage,
      });
    }
  }, [orderId, initiatePaymentMutation]);

  // Auto-initiate payment when component mounts
  useEffect(() => {
    if (!order || isLoading) return;
    if (isPaid || isCancelled) return;
    if (qrCode) return;
    if (initiatePaymentMutation.isPending) return;
    if (initiatePaymentMutation.isError) return;
    if (hasInitiated && initiationAttemptedRef.current) return;
    
    handleInitiatePayment();
  }, [
    order?.id,
    order?.qpayInvoiceId,
    isLoading,
    isPaid,
    isCancelled,
    qrCode,
    hasInitiated,
    initiatePaymentMutation.isPending,
    initiatePaymentMutation.isError,
    handleInitiatePayment,
  ]);

  // Reset initiation state when order loads with existing invoice but no QR code
  useEffect(() => {
    if (order && order.qpayInvoiceId && !qrCode && !isPaid && !isCancelled) {
      initiationAttemptedRef.current = false;
      setHasInitiated(false);
    }
  }, [order?.qpayInvoiceId, qrCode, isPaid, isCancelled]);

  // Countdown timer for QR code expiry
  useEffect(() => {
    if (!expiryDate || !qrCode) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const expiry = expiryDate.getTime();
      const remaining = Math.max(0, expiry - now);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setQrCode(null);
        setExpiryDate(null);
        toast.error('QR код хүчингүй боллоо', {
          description: 'QR код 1 цагийн дараа хүчингүй болсон. Захиалга автоматаар цуцлагдсан байна.',
        });
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiryDate, qrCode, router]);

  // Auto-open QPAY app on mobile devices
  useEffect(() => {
    if (qrCode && paymentUrls?.deeplink && !isPaid && !isCancelled && timeRemaining !== null && timeRemaining > 0) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const timer = setTimeout(() => {
          window.location.href = paymentUrls.deeplink!;
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [qrCode, paymentUrls?.deeplink, isPaid, isCancelled, timeRemaining]);

  const handleCancelPayment = async () => {
    if (!confirm('Та төлбөрийг цуцлахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      await cancelPaymentMutation.mutateAsync(orderId);
      toast.success('Төлбөр цуцлагдлаа', {
        description: 'Төлбөрийн нэхэмжлэх амжилттай цуцлагдлаа',
      });
      router.refresh();
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Төлбөр цуцлахдаа алдаа гарлаа',
      });
    }
  };

  // Show loading state until mounted and data is loaded
  if (!mounted || isLoading) {
    return (
      <div className="min-h-[calc(100vh-525px)] bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse mb-6" />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // Only show error state after mount to prevent hydration mismatch
  if (mounted && (error || !order)) {
    return (
      <div className="min-h-[calc(100vh-525px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Захиалга олдсонгүй</p>
          <Button onClick={() => router.push('/profile/orders')}>
            Миний захиалгууд руу буцах
          </Button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const itemTotal = order.items?.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0,
  ) || 0;
  const deliveryFee = 0; // Assuming no delivery fee for now
  const totalAmount = parseFloat(order.totalAmount) || itemTotal + deliveryFee;

  return (
    <div className="min-h-[calc(100vh-525px)] bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => router.push('/profile/orders')}
          className="mb-3 p-1.5 h-auto hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Миний захиалгууд</span>
        </Button>

        {/* QR Code Payment Section - Show at top if pending */}
        {isPending && !isCancelled && order.status !== 'CANCELLED' && paymentStatus !== 'CANCELLED' && (
          <Card className="mb-4 bg-white border-2 border-primary/20 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="w-4 h-4" />
                QR кодоор төлбөр төлөх
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {initiatePaymentMutation.isPending && !qrCode ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-gray-600">Төлбөрийн нэхэмжлэх үүсгэж байна...</p>
                </div>
              ) : qrCode && timeRemaining !== null && timeRemaining > 0 ? (
                <div className="space-y-3">
                  {/* Expiry Countdown Timer */}
                  {timeRemaining !== null && (
                    <div className={`text-center p-2 rounded-lg ${
                      timeRemaining < 5 * 60 * 1000 
                        ? 'bg-red-50 border border-red-200' 
                        : timeRemaining < 15 * 60 * 1000
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <p className={`text-xs font-semibold ${
                        timeRemaining < 5 * 60 * 1000 
                          ? 'text-red-800' 
                          : timeRemaining < 15 * 60 * 1000
                          ? 'text-yellow-800'
                          : 'text-blue-800'
                      }`}>
                        {timeRemaining < 5 * 60 * 1000 
                          ? '⚠️ QR код удах гэж байна!'
                          : 'QR код хүчинтэй хугацаа:'}
                      </p>
                      <p className={`text-base font-bold mt-0.5 ${
                        timeRemaining < 5 * 60 * 1000 
                          ? 'text-red-600' 
                          : timeRemaining < 15 * 60 * 1000
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                      }`}>
                        {Math.floor(timeRemaining / 60000)}:{String(Math.floor((timeRemaining % 60000) / 1000)).padStart(2, '0')}
                      </p>
                      {timeRemaining < 5 * 60 * 1000 && (
                        <p className="text-xs text-red-700 mt-1">
                          QR код хүчингүй болсны дараа захиалга автоматаар цуцлагдана
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col items-center">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 mb-2 flex items-center justify-center">
                      <img
                        src={qrCode}
                        alt="QR Code"
                        className="w-full max-w-[200px] h-auto"
                        style={{ maxWidth: '200px', height: 'auto', display: 'block' }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 text-center mb-2">
                      QPAY апп эсвэл банкны апп ашиглан QR кодыг уншуулна уу
                    </p>
                  </div>

                  {/* Refresh Status Button */}
                  {!shouldStopPolling && timeRemaining !== null && timeRemaining > 0 && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchPaymentStatus()}
                        disabled={isFetchingPaymentStatus}
                        className="text-xs"
                      >
                        <RefreshCw
                          className={`w-3 h-3 mr-1.5 ${
                            isFetchingPaymentStatus ? 'animate-spin' : ''
                          }`}
                        />
                        Төлбөрийн статус шалгах
                      </Button>
                    </div>
                  )}
                </div>
              ) : qrCode && timeRemaining !== null && timeRemaining === 0 ? (
                <div className="text-center py-6">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-red-800 mb-1">
                    QR код хүчингүй боллоо
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    QR код 1 цагийн дараа хүчингүй болсон. Захиалга автоматаар цуцлагдсан байна.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      initiationAttemptedRef.current = false;
                      setHasInitiated(false);
                      setQrCode(null);
                      setExpiryDate(null);
                      setTimeRemaining(null);
                      handleInitiatePayment();
                    }}
                  >
                    Шинэ QR код үүсгэх
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  {initiatePaymentMutation.isPending ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Төлбөрийн нэхэмжлэх үүсгэж байна...
                      </p>
                    </>
                  ) : initiatePaymentMutation.isError ? (
                    <>
                      <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1 font-semibold">
                        Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Серверийн алдаа гарсан байна. Админтай холбогдох эсвэл дахин оролдоно уу.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          initiationAttemptedRef.current = false;
                          setHasInitiated(false);
                          handleInitiatePayment();
                        }}
                      >
                        Дахин оролдох
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          initiationAttemptedRef.current = false;
                          setHasInitiated(false);
                          handleInitiatePayment();
                        }}
                      >
                        Дахин оролдох
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Захиалгын мэдээлэл
            </h1>
            <p className="text-xs text-gray-500 sm:hidden">
              {formattedDate} {formattedTime}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-gray-700">
                {formattedDate}
              </p>
              <p className="text-xs text-gray-500">{formattedTime}</p>
            </div>
            {isPaid && (
              <div className="px-3 py-1.5 bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg w-full sm:w-auto text-center sm:text-left">
                <p className="text-xs text-green-800 font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Төлөгдсөн
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Banner */}
        {isCancelled && (
          <div className="mb-3 p-3 bg-linear-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="shrink-0 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center mt-0.5">
                <span className="text-yellow-900 text-xs font-bold">!</span>
              </div>
              <div>
                <p className="font-bold text-yellow-900 mb-0.5 text-sm">
                  Захиалга хүчингүй болсон
                </p>
                <p className="text-xs text-yellow-800">
                  Төлбөр төлөгдөөгүй 60 минут өнгөрсөн тул захиалга цуцлагдсан.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary Card */}
        <Card className="mb-3 bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <h2 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Захиалгын дүн
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-gray-600">Захиалгын дугаар</span>
                <span className="font-bold text-sm text-gray-900 bg-gray-50 px-2 py-0.5 rounded">
                  R{String(order.id).padStart(9, '0')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-gray-600">Захиалга хийсэн огноо</span>
                <span className="font-semibold text-xs text-gray-800">
                  {formattedDate} {formattedTime}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-gray-600">Барааны дүн</span>
                <span className="font-semibold text-xs text-gray-800">
                  {itemTotal.toLocaleString()} ¥
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-gray-600">Дотоодын хүргэлт</span>
                <span className="font-semibold text-xs text-gray-800">
                  {deliveryFee.toLocaleString()} ¥
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                <span className="text-sm font-bold text-gray-900">
                  Нийт төлсөн дүн
                </span>
                <span className="font-bold text-lg text-primary bg-primary/10 px-3 py-1 rounded">
                  {totalAmount.toLocaleString()} ¥
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Details Card */}
        {order.items && order.items.length > 0 && (
          <Card className="mb-3 bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 pb-2 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-900 mb-1">
                  Дижитал бүтээгдэхүүн
                </h2>
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Цахим хаягаар хүргэгдэнэ
                </p>
              </div>

              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <Card
                    key={item.id}
                    className="bg-gray-50 border border-gray-200"
                  >
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        {/* Product Image */}
                        {item.product?.firstImage || item.product?.images?.[0] ? (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <Image
                              src={
                                item.product.firstImage || item.product.images[0]
                              }
                              alt={item.product.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-2xl">📦</span>
                          </div>
                        )}

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-gray-900 mb-1">
                            {item.product?.name || 'Бүтээгдэхүүн'}
                          </h3>
                          {item.product?.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                              {item.product.description}
                            </p>
                          )}
                          <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                            <span className="text-xs text-gray-600">
                              {parseFloat(item.price).toLocaleString()} ¥ × {item.quantity}
                            </span>
                            <span className="font-bold text-base text-primary">
                              {(parseFloat(item.price) * item.quantity).toLocaleString()} ¥
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500 bg-blue-50 px-2 py-0.5 rounded w-fit">
                            <span>📧</span>
                            <span className="font-medium">Цахимаар хүргэнэ</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Contact Info */}
              <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded">
                  <Phone className="w-3 h-3 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">7777-8985</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Information Card */}
        <Card className="mb-3 bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <h2 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Захиалагчийн мэдээлэл
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Овог */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-0.5">Овог</span>
                <span className="text-xs text-gray-900">
                  {order.address?.fullName
                    ? order.address.fullName.split(' ')[0]
                    : '-'}
                </span>
              </div>
              
              {/* Нэр */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-0.5">Нэр</span>
                <span className="text-xs text-gray-900">
                  {order.address?.fullName
                    ? order.address.fullName.split(' ').slice(1).join(' ') || '-'
                    : '-'}
                </span>
              </div>
              
              {/* Утас */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-0.5">Утас</span>
                <span className="text-xs text-gray-900">
                  {order.address?.phoneNumber || 
                   (typeof window !== 'undefined' && localStorage.getItem('mobile')) || 
                   '-'}
                </span>
              </div>
              
              {/* Цахим хаяг */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-0.5">Цахим хаяг</span>
                <span className="text-xs text-gray-900 break-all">
                  {typeof window !== 'undefined' && localStorage.getItem('user_email') || '-'}
                </span>
              </div>
              
              {/* Хувь хүн */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-0.5">Хувь хүн</span>
                <span className="text-xs text-gray-900">-</span>
              </div>
            </div>
            
            {/* Address section - show below if address exists */}
            {order.address && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Хаяг</p>
                <p className="text-xs text-gray-900">
                  {order.address.provinceOrDistrict}, {order.address.khorooOrSoum}
                  {order.address.street && `, ${order.address.street}`}
                  {order.address.building && `, ${order.address.building}`}
                  {order.address.apartmentNumber &&
                    `, ${order.address.apartmentNumber}`}
                </p>
                {order.address.addressNote && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs font-medium text-blue-900 mb-0.5">Тэмдэглэл:</p>
                    <p className="text-xs text-blue-800">{order.address.addressNote}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancel Payment Button */}
        {isPending && !isCancelled && order.status !== 'CANCELLED' && paymentStatus !== 'CANCELLED' && (
          <Card className="mb-3">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-2">
                  Төлбөр төлөхгүй бол цуцлах боломжтой
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelPayment}
                  disabled={cancelPaymentMutation.isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {cancelPaymentMutation.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Цуцлаж байна...
                    </>
                  ) : (
                    'Төлбөр цуцлах'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
