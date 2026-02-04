'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, QrCode, RefreshCw, X } from 'lucide-react';
import { usePaymentInitiate, usePaymentStatus, usePaymentCancel, useOrder } from '@/lib/api';
import Image from 'next/image';

interface PaymentModalProps {
  orderId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

export function PaymentModal({ orderId, open, onOpenChange, onPaymentSuccess }: PaymentModalProps) {
  const { data: orderResponse, isLoading: orderLoading } = useOrder(isNaN(orderId) ? 0 : orderId);
  const order = orderResponse?.data;

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [, setQrText] = useState<string | null>(null);
  const [paymentUrls, setPaymentUrls] = useState<
    Array<{
      name: string;
      description: string;
      logo: string;
      link: string;
    }>
  >([]);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [hasInitiated, setHasInitiated] = useState(false);
  const [isWaitingForInitiation, setIsWaitingForInitiation] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const initiationAttemptedRef = useRef(false);

  const initiatePaymentMutation = usePaymentInitiate();
  const {
    data: paymentStatusResponse,
    refetch: refetchPaymentStatus,
    isFetching: isFetchingPaymentStatus,
  } = usePaymentStatus(orderId, {
    stopPollingAfter: 60 * 60 * 1000, // Stop polling after 1 hour
  });
  const cancelPaymentMutation = usePaymentCancel();

  const paymentStatus =
    paymentStatusResponse?.data?.paymentStatus || order?.paymentStatus || 'PENDING';
  const shouldStopPolling = paymentStatusResponse?.data?.shouldStopPolling || false;
  const isPaid = paymentStatus === 'PAID';
  const isCancelled = paymentStatus === 'CANCELLED';

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setQrCode(null);
      setQrText(null);
      setPaymentUrls([]);
      setWebUrl(null);
      setHasInitiated(false);
      setIsWaitingForInitiation(false);
      initiationAttemptedRef.current = false;
    }
  }, [open]);

  // Reset initiation state when order loads with existing invoice but no QR code
  useEffect(() => {
    if (open && order && order.qpayInvoiceId && !qrCode && !isPaid && !isCancelled) {
      // Reset flags to allow fetching QR code for existing invoice
      initiationAttemptedRef.current = false;
      setHasInitiated(false);
    }
  }, [order?.qpayInvoiceId, qrCode, isPaid, isCancelled, open]);

  const handleInitiatePayment = useCallback(async () => {
    if (!orderId || isNaN(orderId)) {
      toast.error('Алдаа', {
        description: 'Захиалгын ID олдсонгүй',
      });
      return;
    }

    // Prevent multiple simultaneous calls
    if (initiationAttemptedRef.current || initiatePaymentMutation.isPending) {
      // If there's already a request in progress, don't show error
      // Just wait for it to complete
      return;
    }

    initiationAttemptedRef.current = true;
    setHasInitiated(true);

    try {
      const response = await initiatePaymentMutation.mutateAsync(orderId);
      if (response.data) {
        // Set QR code and related data
        if (response.data.qrCode) {
          setQrCode(response.data.qrCode);
          setIsWaitingForInitiation(false); // Clear waiting state

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

          toast.success('Төлбөрийн нэхэмжлэх үүслээ', {
            description: 'QR код амжилттай үүслээ. Төлбөр төлөхөөр Qpay апп ашиглана уу',
          });
        } else {
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
        // Check if error indicates payment already in progress
        if (
          error.message.includes('already in progress') ||
          error.message.includes('already initiated') ||
          error.message.includes('Payment initiation already') ||
          error.message.includes('уже начат') ||
          error.message.toLowerCase().includes('already')
        ) {
          // Payment initiation is already in progress - show waiting state
          setIsWaitingForInitiation(true);
          // Reset flags after a delay to allow retry if needed
          setTimeout(() => {
            initiationAttemptedRef.current = false;
            setHasInitiated(false);
            setIsWaitingForInitiation(false);
          }, 5000);
          // Don't show error toast for "already in progress" - it's not really an error
          return; // Exit early without showing error
        }
      } else if (error?.response?.status === 500) {
        errorMessage =
          'Серверийн алдаа. Төлбөрийн систем тохируулаагүй байна. Админтай холбогдоно уу.';
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

  // Auto-initiate payment when modal opens
  useEffect(() => {
    if (!open) return;
    // Don't do anything if order is not loaded yet
    if (!order || orderLoading) return;

    // Don't initiate if already paid or cancelled
    if (isPaid || isCancelled) return;

    // Don't initiate if already have QR code
    if (qrCode) return;

    // Don't initiate if already in progress
    if (initiatePaymentMutation.isPending) return;

    // Don't auto-retry on error (user must click retry button)
    // BUT: If there's already an invoice, we should still try to get QR code
    if (initiatePaymentMutation.isError && !order.qpayInvoiceId) return;

    // Don't initiate if already attempted (prevents multiple calls)
    // BUT: If there's an existing invoice, allow retry to get QR code
    if (hasInitiated && initiationAttemptedRef.current && !order.qpayInvoiceId) return;

    // If there's already an invoice ID, we should try to get the QR code
    // The backend should return the QR code for existing invoices
    // Otherwise initiate new payment
    handleInitiatePayment();
  }, [
    open,
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

  // Handle payment success
  useEffect(() => {
    if (isPaid && open) {
      const timer = setTimeout(() => {
        onPaymentSuccess?.();
        onOpenChange(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPaid, open, onPaymentSuccess, onOpenChange]);

  // Auto-open QPAY app on mobile devices when QR code is available
  useEffect(() => {
    if (qrCode && paymentUrls.length > 0 && !isPaid && !isCancelled) {
      // Check if mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Find qPay wallet deeplink
        const qpayWallet = paymentUrls.find(
          url =>
            url.name.toLowerCase().includes('qpay') || url.name.toLowerCase().includes('wallet'),
        );
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
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Төлбөр цуцлахдаа алдаа гарлаа',
      });
    }
  };

  if (orderLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Захиалга олдсонгүй</p>
            <Button onClick={() => onOpenChange(false)}>Хаах</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-gray-900">Захиалга #{order.id}</span>
                <p className="text-sm text-gray-600 mt-1">Төлбөр төлөх</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-full hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Payment Status */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <span className="text-lg font-semibold text-gray-700">Нийт төлөх дүн</span>
            <span className="text-3xl font-bold text-primary bg-primary/10 px-5 py-2 rounded-xl">
              {parseFloat(order.totalAmount).toLocaleString()}₮
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Payment Success */}
          {isPaid && (
            <Card className="mb-6 border-2 border-green-300 bg-linear-to-br from-green-50 to-emerald-50 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-green-900 mb-3">
                    Төлбөр амжилттай төлөгдлөө!
                  </h3>
                  <p className="text-gray-700 text-lg mb-6">
                    Таны захиалга амжилттай баталгаажлаа.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-800">Хүлээж байна...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Cancelled */}
          {isCancelled && (
            <Card className="mb-6 border-2 border-red-300 bg-linear-to-br from-red-50 to-rose-50 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <XCircle className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-red-900 mb-3">Төлбөр цуцлагдсан</h3>
                  <p className="text-gray-700 text-lg mb-6">
                    Төлбөрийн нэхэмжлэх цуцлагдсан байна. Шинээр төлбөр төлөх бол дахин оролдоно уу.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code Payment */}
          {!isPaid && !isCancelled && (
            <>
              <Card className="mb-6 border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-linear-to-r from-gray-50 to-transparent border-b border-gray-200">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-primary" />
                    </div>
                    QR кодоор төлбөр төлөх
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(initiatePaymentMutation.isPending || isWaitingForInitiation) && !qrCode ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                      <p className="text-gray-600">
                        {isWaitingForInitiation
                          ? 'Төлбөрийн нэхэмжлэх үүсгэж байна. Хүлээж байна...'
                          : 'Төлбөрийн нэхэмжлэх үүсгэж байна...'}
                      </p>
                    </div>
                  ) : qrCode ? (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center">
                        <div className="p-6 bg-white rounded-2xl border-4 border-gray-200 shadow-xl mb-6 flex items-center justify-center min-h-[320px] min-w-[320px] bg-linear-to-br from-white to-gray-50">
                          <Image
                            width={280}
                            height={280}
                            src={qrCode}
                            alt="QR Code"
                            className="w-full max-w-[280px] h-auto drop-shadow-lg"
                          />
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
                          <p className="text-sm text-blue-900 text-center font-medium">
                            📱 Qpay апп эсвэл банкны апп ашиглан QR кодыг уншуулна уу
                          </p>
                        </div>

                        {/* Bank/Wallet Buttons - Mobile Only */}
                        {isMobile && paymentUrls.length > 0 && (
                          <div className="w-full max-w-[340px] mt-2">
                            {/* Section Header */}
                            <div className="flex items-center gap-2 mb-4">
                              <div className="flex-1 h-px bg-linear-to-r from-transparent via-gray-300 to-transparent"></div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                                Банкны апп сонгох
                              </span>
                              <div className="flex-1 h-px bg-linear-to-r from-transparent via-gray-300 to-transparent"></div>
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
                                      <Image
                                        src={url.logo}
                                        alt={url.name}
                                        className="w-10 h-10 object-contain"
                                        width={40}
                                        height={40}
                                        onError={e => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = `<span class="text-lg font-bold text-gray-400">${url.name.charAt(
                                              0,
                                            )}</span>`;
                                          }
                                        }}
                                      />
                                    ) : (
                                      <span className="text-lg font-bold text-gray-400">
                                        {url.name.charAt(0)}
                                      </span>
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
                          <div className="w-full max-w-[280px] mt-2">
                            <Button
                              variant="outline"
                              className="w-full"
                              size="sm"
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
                            className="border-2 hover:bg-gray-50"
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
                        <div className="text-center py-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600 font-medium">
                            🔄 Төлбөрийн статус автоматаар шалгагдаж байна...
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      {initiatePaymentMutation.isPending ? (
                        <>
                          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
                          <p className="text-gray-700 mb-4 font-medium text-lg">
                            Төлбөрийн нэхэмжлэх үүсгэж байна...
                          </p>
                        </>
                      ) : initiatePaymentMutation.isError ? (
                        <>
                          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-600" />
                          </div>
                          <p className="text-gray-900 mb-2 font-bold text-lg">
                            Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа
                          </p>
                          <p className="text-sm text-gray-600 mb-6">
                            Серверийн алдаа гарсан байна. Админтай холбогдох эсвэл дахин оролдоно
                            уу.
                          </p>
                          <Button
                            onClick={() => {
                              initiationAttemptedRef.current = false;
                              setHasInitiated(false);
                              handleInitiatePayment();
                            }}
                            size="lg"
                            className="shadow-lg"
                          >
                            Дахин оролдох
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-700 mb-6 font-medium text-lg">
                            Төлбөрийн нэхэмжлэх үүсгэхэд алдаа гарлаа
                          </p>
                          <Button
                            onClick={() => {
                              initiationAttemptedRef.current = false;
                              setHasInitiated(false);
                              handleInitiatePayment();
                            }}
                            size="lg"
                            className="shadow-lg"
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
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4 font-medium">
                      Төлбөр төлөхгүй бол цуцлах боломжтой
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleCancelPayment}
                      disabled={cancelPaymentMutation.isPending}
                      className="text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all"
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
      </DialogContent>
    </Dialog>
  );
}
