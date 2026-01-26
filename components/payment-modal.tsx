'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  QrCode,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  usePaymentInitiate,
  usePaymentStatus,
  usePaymentCancel,
  useOrder,
} from '@/lib/api';

interface PaymentModalProps {
  orderId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

export function PaymentModal({
  orderId,
  open,
  onOpenChange,
  onPaymentSuccess,
}: PaymentModalProps) {
  const { toast } = useToast();

  const { data: orderResponse, isLoading: orderLoading } = useOrder(
    isNaN(orderId) ? 0 : orderId,
  );
  const order = orderResponse?.data;

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentUrls, setPaymentUrls] = useState<{
    web: string;
    deeplink: string;
  } | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [hasInitiated, setHasInitiated] = useState(false);
  const [isWaitingForInitiation, setIsWaitingForInitiation] = useState(false);
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
    paymentStatusResponse?.data?.paymentStatus ||
    order?.paymentStatus ||
    'PENDING';
  const shouldStopPolling = paymentStatusResponse?.data?.shouldStopPolling || false;
  const isPaid = paymentStatus === 'PAID';
  const isCancelled = paymentStatus === 'CANCELLED';

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setQrCode(null);
      setPaymentUrls(null);
      setExpiryDate(null);
      setTimeRemaining(null);
      setHasInitiated(false);
      setIsWaitingForInitiation(false);
      initiationAttemptedRef.current = false;
    }
  }, [open]);

  // Reset initiation state when order loads with existing invoice but no QR code
  useEffect(() => {
    if (
      open &&
      order &&
      order.qpayInvoiceId &&
      !qrCode &&
      !isPaid &&
      !isCancelled
    ) {
      // Reset flags to allow fetching QR code for existing invoice
      initiationAttemptedRef.current = false;
      setHasInitiated(false);
    }
  }, [order?.qpayInvoiceId, qrCode, isPaid, isCancelled, open]);

  const handleInitiatePayment = useCallback(async () => {
    if (!orderId || isNaN(orderId)) {
      toast({
        title: 'Алдаа',
        description: 'Захиалгын ID олдсонгүй',
        variant: 'destructive',
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

          // Store payment URLs for mobile auto-open
          if (response.data.urls) {
            setPaymentUrls(response.data.urls);
          }

          // Store expiry date if provided
          if (response.data.expiryDate) {
            const expiry = new Date(response.data.expiryDate);
            setExpiryDate(expiry);
            const remaining = Math.max(0, expiry.getTime() - Date.now());
            setTimeRemaining(remaining);
          }

          // Check if already expired from backend
          if (response.data.isExpired) {
            setQrCode(null);
            setExpiryDate(null);
            setTimeRemaining(0);
            toast({
              title: 'QR код хүчингүй боллоо',
              description: 'QR код хүчингүй болсон. Захиалга цуцлагдсан байна.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Төлбөрийн нэхэмжлэх үүслээ',
              description: 'QR код амжилттай үүслээ. Төлбөр төлөхөөр QPAY апп ашиглана уу',
            });
          }
        } else {
          // Reset flags so auto-initiation can retry
          initiationAttemptedRef.current = false;
          setHasInitiated(false);
          toast({
            title: 'Алдаа гарлаа',
            description: 'QR код үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.',
            variant: 'destructive',
          });
        }

        // Store payment URLs even if no QR code (for fallback)
        if (response.data.urls && !response.data.qrCode) {
          setPaymentUrls(response.data.urls);
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

      toast({
        title: 'Алдаа гарлаа',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [orderId, toast, initiatePaymentMutation]);

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

      // If expired, clear QR code
      if (remaining === 0) {
        setQrCode(null);
        setExpiryDate(null);
        toast({
          title: 'QR код хүчингүй боллоо',
          description:
            'QR код 1 цагийн дараа хүчингүй болсон. Захиалга автоматаар цуцлагдсан байна.',
          variant: 'destructive',
        });
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiryDate, qrCode, toast]);

  // Auto-open QPAY app on mobile devices when QR code is available
  useEffect(() => {
    if (
      qrCode &&
      paymentUrls?.deeplink &&
      !isPaid &&
      !isCancelled &&
      timeRemaining !== null &&
      timeRemaining > 0
    ) {
      // Check if mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Small delay to ensure QR code is visible first
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
      toast({
        title: 'Төлбөр цуцлагдлаа',
        description: 'Төлбөрийн нэхэмжлэх амжилттай цуцлагдлаа',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Алдаа гарлаа',
        description: error.message || 'Төлбөр цуцлахдаа алдаа гарлаа',
        variant: 'destructive',
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
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  Захиалга #{order.id}
                </span>
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
            <Card className="mb-6 border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
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
                    <span className="text-sm font-medium text-green-800">
                      Хүлээж байна...
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Cancelled */}
          {isCancelled && (
            <Card className="mb-6 border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <XCircle className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-red-900 mb-3">
                    Төлбөр цуцлагдсан
                  </h3>
                  <p className="text-gray-700 text-lg mb-6">
                    Төлбөрийн нэхэмжлэх цуцлагдсан байна. Шинээр төлбөр төлөх бол
                    дахин оролдоно уу.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code Payment */}
          {!isPaid && !isCancelled && (
            <>
              <Card className="mb-6 border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-transparent border-b border-gray-200">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-primary" />
                    </div>
                    QR кодоор төлбөр төлөх
                  </CardTitle>
                </CardHeader>
              <CardContent>
                {(initiatePaymentMutation.isPending || isWaitingForInitiation) &&
                !qrCode ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-gray-600">
                      {isWaitingForInitiation
                        ? 'Төлбөрийн нэхэмжлэх үүсгэж байна. Хүлээж байна...'
                        : 'Төлбөрийн нэхэмжлэх үүсгэж байна...'}
                    </p>
                  </div>
                ) : qrCode && timeRemaining !== null && timeRemaining > 0 ? (
                  <div className="space-y-6">
                    {/* Expiry Countdown Timer */}
                    {timeRemaining !== null && (
                      <div
                        className={`text-center p-3 rounded-lg ${
                          timeRemaining < 5 * 60 * 1000
                            ? 'bg-red-50 border-2 border-red-200'
                            : timeRemaining < 15 * 60 * 1000
                            ? 'bg-yellow-50 border-2 border-yellow-200'
                            : 'bg-blue-50 border-2 border-blue-200'
                        }`}
                      >
                        <p
                          className={`text-sm font-semibold ${
                            timeRemaining < 5 * 60 * 1000
                              ? 'text-red-800'
                              : timeRemaining < 15 * 60 * 1000
                              ? 'text-yellow-800'
                              : 'text-blue-800'
                          }`}
                        >
                          {timeRemaining < 5 * 60 * 1000
                            ? '⚠️ QR код удах гэж байна!'
                            : 'QR код хүчинтэй хугацаа:'}
                        </p>
                        <p
                          className={`text-lg font-bold mt-1 ${
                            timeRemaining < 5 * 60 * 1000
                              ? 'text-red-600'
                              : timeRemaining < 15 * 60 * 1000
                              ? 'text-yellow-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {Math.floor(timeRemaining / 60000)}:
                          {String(Math.floor((timeRemaining % 60000) / 1000)).padStart(
                            2,
                            '0',
                          )}
                        </p>
                        {timeRemaining < 5 * 60 * 1000 && (
                          <p className="text-xs text-red-700 mt-1">
                            QR код хүчингүй болсны дараа захиалга автоматаар
                            цуцлагдана
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col items-center">
                      <div className="p-6 bg-white rounded-2xl border-4 border-gray-200 shadow-xl mb-6 flex items-center justify-center min-h-[320px] min-w-[320px] bg-gradient-to-br from-white to-gray-50">
                        <img
                          src={qrCode}
                          alt="QR Code"
                          className="w-full max-w-[280px] h-auto drop-shadow-lg"
                          style={{ maxWidth: '280px', height: 'auto', display: 'block' }}
                        />
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
                        <p className="text-sm text-blue-900 text-center font-medium">
                          📱 QPAY апп эсвэл банкны апп ашиглан QR кодыг уншуулна уу
                        </p>
                      </div>
                    </div>

                    {/* Refresh Status Button */}
                    {!shouldStopPolling &&
                      timeRemaining !== null &&
                      timeRemaining > 0 && (
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
                ) : qrCode && timeRemaining !== null && timeRemaining === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-900 mb-3">
                      QR код хүчингүй боллоо
                    </h3>
                    <p className="text-gray-700 mb-6 text-lg">
                      QR код 1 цагийн дараа хүчингүй болсон. Захиалга автоматаар
                      цуцлагдсан байна.
                    </p>
                    <Button
                      onClick={() => {
                        initiationAttemptedRef.current = false;
                        setHasInitiated(false);
                        setQrCode(null);
                        setExpiryDate(null);
                        setTimeRemaining(null);
                        handleInitiatePayment();
                      }}
                      size="lg"
                      className="shadow-lg"
                    >
                      Шинэ QR код үүсгэх
                    </Button>
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
                          Серверийн алдаа гарсан байна. Админтай холбогдох эсвэл
                          дахин оролдоно уу.
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
