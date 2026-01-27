'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import {
  usePaymentInitiate,
  usePaymentStatus,
  usePaymentCancel,
  useOrder,
} from '@/lib/api';
import { CardSkeleton } from '@/components/skeleton';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);

  const { data: orderResponse, isLoading: orderLoading } = useOrder(
    isNaN(orderId) ? 0 : orderId,
  );
  const order = orderResponse?.data;

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
  const [mounted, setMounted] = useState(false);
  const initiationAttemptedRef = useRef(false);
  const pollingStartTimeRef = useRef<number | null>(null);
  

  const initiatePaymentMutation = usePaymentInitiate();
  const {
    data: paymentStatusResponse,
    refetch: refetchPaymentStatus,
    isFetching: isFetchingPaymentStatus,
  } = usePaymentStatus(orderId, {
    stopPollingAfter: 60 * 60 * 1000, // Stop polling after 1 hour
  });
  const cancelPaymentMutation = usePaymentCancel();

  const paymentStatus = paymentStatusResponse?.data?.paymentStatus || order?.paymentStatus || 'PENDING';
  const shouldStopPolling = paymentStatusResponse?.data?.shouldStopPolling || false;
  const isPaid = paymentStatus === 'PAID';
  const isCancelled = paymentStatus === 'CANCELLED';

  // Prevent hydration mismatch
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

  // Reset initiation state when order loads with existing invoice but no QR code
  useEffect(() => {
    if (order && order.qpayInvoiceId && !qrCode && !isPaid && !isCancelled) {
      // Reset flags to allow fetching QR code for existing invoice
      initiationAttemptedRef.current = false;
      setHasInitiated(false);
    }
  }, [order?.qpayInvoiceId, qrCode, isPaid, isCancelled]);

  // Track when polling starts
  useEffect(() => {
    if (paymentStatusResponse && pollingStartTimeRef.current === null && !isPaid && !isCancelled) {
      pollingStartTimeRef.current = Date.now();
    }
  }, [paymentStatusResponse, isPaid, isCancelled]);

  // Debug: Log QR code state changes
  useEffect(() => {
    console.log('QR Code state changed:', {
      hasQrCode: !!qrCode,
      qrCodePreview: qrCode?.substring(0, 50),
      qrCodeLength: qrCode?.length,
    });
  }, [qrCode]);

  const handleInitiatePayment = useCallback(async () => {
    if (!orderId || isNaN(orderId)) {
      toast.error('Алдаа', {
        description: 'Захиалгын ID олдсонгүй',
      });
      return;
    }

    // Prevent multiple simultaneous calls
    if (initiationAttemptedRef.current || initiatePaymentMutation.isPending) {
      return;
    }

    initiationAttemptedRef.current = true;
    setHasInitiated(true);

    try {
      const response = await initiatePaymentMutation.mutateAsync(orderId);
      if (response.data) {
        // Debug: Log response to see what we're getting
        console.log('Payment initiation response:', response.data);
        console.log('QR Code in response:', response.data.qrCode ? 'Present' : 'Missing', response.data.qrCode?.substring(0, 50));
        
        // Set QR code and related data FIRST before any other logic
        if (response.data.qrCode) {
          console.log('Setting QR code state...');
          setQrCode(response.data.qrCode);
          console.log('QR code state should be set now');
          
          // Store QR text (short URL) if available
          if (response.data.qrText) {
            setQrText(response.data.qrText);
          }
          
          // Store payment URLs (array of bank/wallet options)
          if (response.data.urls && Array.isArray(response.data.urls)) {
            console.log('Payment URLs received:', response.data.urls);
            setPaymentUrls(response.data.urls);
          } else {
            console.warn('No payment URLs in response:', response.data);
          }

          // Store web URL
          if (response.data.webUrl) {
            setWebUrl(response.data.webUrl);
          }
          
          // Show success toast
          toast.success('Төлбөрийн нэхэмжлэх үүслээ', {
            description: 'QR код амжилттай үүслээ. Төлбөр төлөхөөр QPAY апп ашиглана уу',
          });
        } else {
          console.warn('No QR code in response!', response.data);
          // Reset flags so auto-initiation can retry
          initiationAttemptedRef.current = false;
          setHasInitiated(false);
          toast.error('Алдаа гарлаа', {
            description: 'QR код үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.',
          });
        }
        
        // Store payment URLs even if no QR code (for fallback)
        if (response.data.urls && Array.isArray(response.data.urls) && !response.data.qrCode) {
          setPaymentUrls(response.data.urls);
        }
        if (response.data.webUrl && !response.data.qrCode) {
          setWebUrl(response.data.webUrl);
        }
      }
    } catch (error: any) {
      // Reset flag on error so user can retry manually
      initiationAttemptedRef.current = false;
      setHasInitiated(false);
      
      // Extract error message
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
    // Don't do anything if order is not loaded yet
    if (!order || orderLoading) return;
    
    // Don't initiate if already paid or cancelled
    if (isPaid || isCancelled) return;
    
    // Don't initiate if already have QR code
    if (qrCode) return;
    
    // Don't initiate if already in progress
    if (initiatePaymentMutation.isPending) return;
    
    // Don't auto-retry on error (user must click retry button)
    if (initiatePaymentMutation.isError) return;
    
    // Don't initiate if already attempted (prevents multiple calls)
    if (hasInitiated && initiationAttemptedRef.current) return;
    
    // Initiate payment (works for both new orders and existing invoices)
    handleInitiatePayment();
  }, [
    order?.id,
    order?.qpayInvoiceId,
    orderLoading,
    isPaid,
    isCancelled,
    qrCode,
    hasInitiated,
    initiatePaymentMutation.isPending,
    initiatePaymentMutation.isError,
    handleInitiatePayment,
  ]);

  // Redirect on successful payment
  useEffect(() => {
    if (isPaid) {
      const timer = setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPaid, orderId, router]);


  // Auto-open QPAY app on mobile devices when QR code is available
  useEffect(() => {
    if (
      qrCode &&
      paymentUrls.length > 0 &&
      !isPaid &&
      !isCancelled
    ) {
      // Check if mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Find qPay wallet deeplink
        const qpayWallet = paymentUrls.find(url => url.name.toLowerCase().includes('qpay') || url.name.toLowerCase().includes('wallet'));
        if (qpayWallet) {
          // Small delay to ensure QR code is visible first
          const timer = setTimeout(() => {
            window.location.href = qpayWallet.link;
          }, 500);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [qrCode, paymentUrls, isPaid, isCancelled]);

  const handleCancelPayment = async () => {
    if (!confirm('Та төлбөрийг цуцлахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      await cancelPaymentMutation.mutateAsync(orderId);
      toast.success('Төлбөр цуцлагдлаа', {
        description: 'Төлбөрийн нэхэмжлэх амжилттай цуцлагдлаа',
      });
      router.push(`/orders/${orderId}`);
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Төлбөр цуцлахдаа алдаа гарлаа',
      });
    }
  };

  // Show loading skeleton only after mount to prevent hydration mismatch
  if (!mounted || orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <CardSkeleton />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Захиалга олдсонгүй</p>
          <Button onClick={() => router.push('/profile/orders')}>
            Захиалгууд руу буцах
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/orders/${orderId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Буцах
        </Button>

        {/* Payment Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Захиалга #{order.id} - Төлбөр</CardTitle>
              <div className="flex items-center gap-2">
                {isPaid ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Төлбөр төлөгдсөн</span>
                  </div>
                ) : isCancelled ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="font-semibold">Цуцлагдсан</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-semibold">Төлбөр хүлээж байна</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Нийт төлөх дүн</span>
              <span className="text-2xl font-bold text-primary">
                {parseFloat(order.totalAmount).toLocaleString()}₮
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Success */}
        {isPaid && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-800 mb-2">
                  Төлбөр амжилттай төлөгдлөө!
                </h3>
                <p className="text-gray-700 mb-4">
                  Таны захиалга амжилттай баталгаажлаа. Захиалгын дэлгэрэнгүй мэдээлэл рүү
                  шилжиж байна...
                </p>
                <Button onClick={() => router.push(`/orders/${orderId}`)}>
                  Захиалгын дэлгэрэнгүй
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Cancelled */}
        {isCancelled && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-center">
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-red-800 mb-2">
                  Төлбөр цуцлагдсан
                </h3>
                <p className="text-gray-700 mb-4">
                  Төлбөрийн нэхэмжлэх цуцлагдсан байна. Шинээр төлбөр төлөх бол дахин оролдоно
                  уу.
                </p>
                <Button onClick={() => router.push(`/orders/${orderId}`)}>
                  Захиалгын дэлгэрэнгүй
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Code Payment */}
        {!isPaid && !isCancelled && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR кодоор төлбөр төлөх
                </CardTitle>
              </CardHeader>
              <CardContent>
                {initiatePaymentMutation.isPending && !qrCode ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-gray-600">Төлбөрийн нэхэмжлэх үүсгэж байна...</p>
                  </div>
                ) : qrCode ? (
                  <div className="space-y-6">

                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-white rounded-lg border-2 border-gray-200 mb-4 flex items-center justify-center min-h-[300px] min-w-[300px]">
                        {/* Use regular img tag for base64 data URLs - Next.js Image doesn't handle them */}
                        <img
                          src={qrCode}
                          alt="QR Code"
                          className="w-full max-w-[300px] h-auto"
                          style={{ maxWidth: '300px', height: 'auto', display: 'block' }}
                          onError={(e) => {
                            console.error('QR Code image failed to load');
                            console.error('QR Code value:', qrCode?.substring(0, 100));
                          }}
                          onLoad={() => {
                            console.log('QR Code image loaded successfully');
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 text-center mb-4">
                        QPAY апп эсвэл банкны апп ашиглан QR кодыг уншуулна уу
                      </p>
                      
                      {/* Bank/Wallet Buttons - Mobile Only */}
                      {isMobile && paymentUrls.length > 0 && (
                        <div className="w-full max-w-[340px] mt-2">
                          {/* Section Header */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                              Банкны апп сонгох
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                          </div>
                          
                          {/* Bank Apps Grid */}
                          <div className="grid grid-cols-4 gap-3">
                            {paymentUrls.map((url, index) => (
                              <button
                                key={index}
                                className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border-2 border-gray-100 hover:border-primary/30 hover:bg-primary/5 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
                                onClick={() => {
                                  console.log('Opening bank/wallet:', url.name, url.link);
                                  window.location.href = url.link;
                                }}
                              >
                                <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-white flex items-center justify-center overflow-hidden transition-colors shadow-inner">
                                  {url.logo ? (
                                    <img
                                      src={url.logo}
                                      alt={url.name}
                                      className="w-10 h-10 object-contain"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `<span class="text-lg font-bold text-gray-400">${url.name.charAt(0)}</span>`;
                                        }
                                      }}
                                    />
                                  ) : (
                                    <span className="text-lg font-bold text-gray-400">{url.name.charAt(0)}</span>
                                  )}
                                </div>
                                <span className="text-[10px] font-medium text-gray-600 text-center leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                  {url.name}
                                </span>
                              </button>
                            ))}
                          </div>

                          {/* Web URL Button */}
                          {webUrl && (
                            <Button
                              variant="ghost"
                              className="w-full mt-4 text-gray-500 hover:text-gray-700"
                              size="sm"
                              onClick={() => {
                                console.log('Opening web URL:', webUrl);
                                window.open(webUrl, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              <span className="text-xs">Веб хуудсаар төлөх →</span>
                            </Button>
                          )}
                        </div>
                      )}
                      {isMobile && !paymentUrls.length && webUrl && (
                        <div className="w-full max-w-[300px] mt-2">
                          <Button
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
                          onClick={() => refetchPaymentStatus()}
                          disabled={isFetchingPaymentStatus}
                        >
                          <RefreshCw
                            className={`w-4 h-4 mr-2 ${
                              isFetchingPaymentStatus ? 'animate-spin' : ''
                            }`}
                          />
                          Төлбөрийн статус шалгах
                        </Button>
                      </div>
                    )}
                    {shouldStopPolling && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500">
                          Төлбөрийн статус автоматаар шалгагдаж байна...
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    {initiatePaymentMutation.isPending ? (
                      <>
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                          Төлбөрийн нэхэмжлэх үүсгэж байна...
                        </p>
                      </>
                    ) : initiatePaymentMutation.isError ? (
                      <>
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2 font-semibold">
                          Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          Серверийн алдаа гарсан байна. Админтай холбогдох эсвэл дахин оролдоно уу.
                        </p>
                        <Button
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
                        <p className="text-gray-600 mb-4">
                          Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа
                        </p>
                        <Button
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

            {/* Cancel Payment */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Төлбөр төлөхгүй бол цуцлах боломжтой
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleCancelPayment}
                    disabled={cancelPaymentMutation.isPending}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {cancelPaymentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Цуцлаж байна...
                      </>
                    ) : (
                      'Төлбөр цуцлах'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
