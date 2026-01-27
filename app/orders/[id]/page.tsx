'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    stopPollingAfter: 60 * 60 * 1000,
  });
  const paymentStatus =
    paymentStatusResponse?.data?.paymentStatus || order?.paymentStatus || 'PENDING';
  const shouldStopPolling = paymentStatusResponse?.data?.shouldStopPolling || false;

  // QR Code state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrText, setQrText] = useState<string | null>(null);
  const [paymentUrls, setPaymentUrls] = useState<Array<{
    name: string;
    description: string;
    logo: string;
    link: string;
  }>>([]);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [hasInitiated, setHasInitiated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const initiationAttemptedRef = useRef(false);
  

  const initiatePaymentMutation = usePaymentInitiate();
  const cancelPaymentMutation = usePaymentCancel();

  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if mobile device
  useEffect(() => {
    if (!mounted) return;
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mounted]);


  // Calculate derived values (safe even if order is undefined)
  const orderDate = order?.createdAt ? new Date(order.createdAt) : null;
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
          // QR code is valid, set it
          setQrCode(response.data.qrCode);
          
          // Store QR text (short URL) if available
          if (response.data.qrText) {
            setQrText(response.data.qrText);
          }
          
          if (response.data.urls) {
            console.log('Payment URLs received:', response.data.urls);
            setPaymentUrls(response.data.urls);
          } else {
            console.warn('No payment URLs in response:', response.data);
          }
          
          toast.success('Төлбөрийн нэхэмжлэх үүслээ', {
            description: 'QR код амжилттай үүслээ. Төлбөр төлөхөөр QPAY апп ашиглана уу',
          });
        } else {
          // If no QR code returned, check if it's because order is cancelled
          if (order?.status === 'CANCELLED' || paymentStatus === 'CANCELLED') {
            initiationAttemptedRef.current = true;
            setHasInitiated(true);
          } else {
            initiationAttemptedRef.current = false;
            setHasInitiated(false);
          }
          toast.error('Алдаа гарлаа', {
            description: 'QR код үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.',
          });
        }
        
        if (response.data.urls && Array.isArray(response.data.urls) && !response.data.qrCode) {
          setPaymentUrls(response.data.urls);
        }
        if (response.data.webUrl && !response.data.qrCode) {
          setWebUrl(response.data.webUrl);
        }
      }
    } catch (error: any) {
      // Check if error indicates order is cancelled/paid
      const isOrderInvalid = 
        error?.response?.status === 400 || 
        error?.message?.includes('cancelled') ||
        error?.message?.includes('paid') ||
        order?.status === 'CANCELLED' ||
        paymentStatus === 'CANCELLED';
      
      if (isOrderInvalid) {
        // Don't reset flags for invalid orders to prevent retry loop
        initiationAttemptedRef.current = true;
        setHasInitiated(true);
      } else {
        initiationAttemptedRef.current = false;
        setHasInitiated(false);
      }
      
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

  // Calculate totals
  const itemTotal = order?.items?.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0,
  ) || 0;
  const deliveryFee = 6000;
  const totalAmount = parseFloat(order?.totalAmount || '0') || itemTotal + deliveryFee;

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

  return (
    <div className="min-h-[calc(100vh-525px)] bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => router.push('/profile/orders')}
          className="group px-2 py-1 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Захиалгууд</span>
        </Button>

        {/* QR Code Payment Section - Show at top if pending */}
        {isPending && !isCancelled && order?.status !== 'CANCELLED' && paymentStatus !== 'CANCELLED' && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 via-white to-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <QrCode className="w-5 h-5 text-primary" />
                QR кодоор төлбөр төлөх
              </CardTitle>
              <CardDescription className="text-xs">
                60 минутын дотор төлбөрөө баталгаажуулна уу
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {initiatePaymentMutation.isPending && !qrCode ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                  <p className="text-xs text-gray-600">Төлбөрийн нэхэмжлэх үүсгэж байна...</p>
                </div>
              ) : qrCode ? (
                <div className="space-y-2">

                  <div className="flex flex-col items-center">
                    <div className="p-4 rounded-2xl bg-white shadow-inner border flex justify-center">
                      {/* Use regular img tag for base64 data URLs - Next.js Image doesn't handle them */}
                      <img
                        src={qrCode}
                        alt="QR Code"
                        className="w-60 h-60 object-contain"
                        onError={(e) => {
                          console.error('QR Code image failed to load');
                          console.error('QR Code value:', qrCode?.substring(0, 100));
                        }}
                        onLoad={() => {
                          console.log('QR Code image loaded successfully');
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 text-center my-2">
                      QPAY апп эсвэл банкны апп ашиглан QR кодыг уншуулна уу
                    </p>
                    {/* Bank/Wallet Buttons - Mobile Only */}
                    {isMobile && paymentUrls.length > 0 && (
                <div className="w-full max-w-xs mt-3 px-1">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      💳 Банкны апп
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  
                  {/* Bank Apps */}
                  <div className="grid grid-cols-3 gap-3">
                    {paymentUrls.map((url, index) => (
                      <button
                        key={index}
                        className="group flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-gray-200 shadow-sm active:scale-95 active:bg-primary/10 transition-all touch-manipulation"
                        onClick={() => {
                          console.log("Opening:", url.name, url.link);
                          window.location.href = url.link;
                        }}
                      >
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                          {url.logo ? (
                            <img
                              src={url.logo}
                              alt={url.name}
                              className="w-9 h-9 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <span class="text-base font-bold text-gray-400">
                                      ${url.name.charAt(0)}
                                    </span>
                                  `;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-base font-bold text-gray-400">
                              {url.name.charAt(0)}
                            </span>
                          )}
                        </div>

                        {/* Label */}
                        <span className="text-[10px] font-medium text-center leading-tight line-clamp-2 text-gray-700">
                          {url.description || url.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Web fallback */}
                  {webUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-4 text-gray-600 hover:text-gray-800"
                      onClick={() => {
                        console.log("Opening web:", webUrl);
                        window.open(webUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      🌐 <span className="ml-1 text-[11px]">Веб хуудсаар төлөх</span>
                    </Button>
                  )}
                </div>
              )}

                    {isMobile && !paymentUrls.length && webUrl && (
                      <div className="w-full max-w-[240px] mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            console.log('Opening web URL:', webUrl);
                            window.open(webUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          Веб хуудас нээх
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Refresh Status Button */}
                  {!shouldStopPolling && (
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
                        Төлбөрийн шалгах
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  {initiatePaymentMutation.isPending ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-xs text-gray-600">
                        Төлбөрийн нэхэмжлэх үүсгэж байна...
                      </p>
                    </>
                  ) : (
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
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Захиалгын мэдээлэл
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
          <div className="flex gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 font-bold">
              !
            </div>
            <div>
              <p className="text-sm font-bold text-yellow-900">
                Захиалга цуцлагдсан
              </p>
              <p className="text-xs text-yellow-800">
                60 минутын дотор төлбөр төлөгдөөгүй
              </p>
            </div>
          </div>
        )}

        {/* Order Summary Card */}
        <Card className="border border-dashed shadow-none bg-gray-50">
          <CardContent className="p-4 space-y-3">
            {/* Order Header Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Захиалгын дугаар</p>
                <p className="text-base font-bold text-gray-900">
                  {String(order?.id || 0).padStart(9, '0')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Захиалга хийсэн огноо</p>
                <p className="text-base font-bold text-gray-900">
                  {formattedDate} {formattedTime}
                </p>
              </div>
            </div>

            {/* Order Details Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Барааны дүн</span>
                <span className="text-sm font-semibold text-gray-900">
                  {itemTotal.toLocaleString()} ₮
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Дотоодын хүргэлт</span>
                <span className="text-sm font-semibold text-gray-900">
                  {deliveryFee.toLocaleString()} ₮
                </span>
              </div>
            </div>

            {/* Total Payment */}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Нийт</span>
              <span className="text-primary">{totalAmount.toLocaleString()} ₮</span>
            </div>
          </CardContent>
        </Card>

        {/* Product Details Card */}
        {order?.items && order.items.length > 0 && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-3">
              <div className="mb-2 pb-1.5 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-900 mb-1">
                  Бүтээгдэхүүн
                </h2>
              </div>

              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-gray-50 border">
                        {/* Product Image */}
                        {item.product?.firstImage || item.product?.images?.[0] ? (
                          <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden shrink-0">
                            <Image
                              src={
                                item.product.firstImage || item.product.images[0]
                              }
                              alt={item.product.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center shrink-0">
                            <span className="text-xl">📦</span>
                          </div>
                        )}

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold line-clamp-2">
                            {item.product?.name || 'Бүтээгдэхүүн'}
                          </h3>
                          <div className="flex justify-between items-center pt-0.5 border-t border-gray-200 mt-0.5">
                            <span className="text-xs text-gray-600">
                              {parseFloat(item.price).toLocaleString()} ₮ × {item.quantity}
                            </span>
                            <span className="font-bold text-sm text-primary">
                              {(parseFloat(item.price) * item.quantity).toLocaleString()} ₮
                            </span>
                          </div>
                        </div>
                      </div>
                ))}
              </div>

              {/* Contact Info */}
              <div className="flex items-center justify-end gap-1.5 mt-2 pt-1.5 border-t border-gray-200">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded">
                  <Phone className="w-3 h-3 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">7777-8985</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Information Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1.5 border-b border-gray-200">
              Захиалагчийн мэдээлэл
            </h2>
            <div className="space-y-2 text-sm">
              {/* Овог */}
              <div className="flex justify-between">
                <span className="text-gray-500">Овог</span>
                <span className="font-medium">
                  {order?.address?.fullName
                    ? order.address.fullName.split(' ')[0]
                    : '-'}
                </span>
              </div>
              
              {/* Нэр */}
              <div className="flex justify-between">
                <span className="text-gray-500">Нэр</span>
                <span className="font-medium">
                  {order?.address?.fullName
                    ? order.address.fullName.split(' ').slice(1).join(' ') || '-'
                    : '-'}
                </span>
              </div>
              
              {/* Утас */}
              <div className="flex justify-between">
                <span className="text-gray-500">Утас</span>
                <span className="font-medium">
                  {order?.address?.phoneNumber || 
                   (typeof window !== 'undefined' && localStorage.getItem('mobile')) || 
                   '-'}
                </span>
              </div>
              
              {/* Цахим хаяг */}
              <div className="flex justify-between">
                <span className="text-gray-500">Цахим хаяг</span>
                <span className="font-medium break-all text-right">
                  {typeof window !== 'undefined' && localStorage.getItem('user_email') || '-'}
                </span>
              </div>
              
              {/* Хувь хүн */}
              <div className="flex justify-between">
                <span className="text-gray-500">Хувь хүн</span>
                <span className="font-medium">-</span>
              </div>
            </div>
            
            {/* Address section - show below if address exists */}
            {order?.address && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Хаяг</p>
                <p className="text-xs text-gray-900">
                  {order.address.provinceOrDistrict}, {order.address.khorooOrSoum}
                  {order.address.street && `, ${order.address.street}`}
                  {order.address.building && `, ${order.address.building}`}
                  {order.address.apartmentNumber &&
                    `, ${order.address.apartmentNumber}`}
                </p>
                {order.address.addressNote && (
                  <div className="mt-1.5 p-1.5 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs font-medium text-blue-900 mb-0.5">Тэмдэглэл:</p>
                    <p className="text-xs text-blue-800">{order.address.addressNote}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancel Payment Button */}
        {isPending && !isCancelled && order?.status !== 'CANCELLED' && paymentStatus !== 'CANCELLED' && (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="text-center space-y-2">
              <p className="text-xs text-red-700">
                Төлбөр төлөхгүй бол захиалга цуцлагдана
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelPayment}
                disabled={cancelPaymentMutation.isPending}
                className="border-red-300 text-red-700 hover:bg-red-100"
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
