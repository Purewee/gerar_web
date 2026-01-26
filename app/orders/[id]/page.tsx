'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, QrCode, CheckCircle2, Phone } from 'lucide-react';
import { useOrder, usePaymentStatus } from '@/lib/api';
import Image from 'next/image';
import { CardSkeleton } from '@/components/skeleton';
import { PaymentModal } from '@/components/payment-modal';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const { data: orderResponse, isLoading, error } = useOrder(
    isNaN(orderId) ? 0 : orderId,
  );
  const order = orderResponse?.data;

  const { data: paymentStatusResponse } = usePaymentStatus(orderId);
  const paymentStatus =
    paymentStatusResponse?.data?.paymentStatus || order?.paymentStatus;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-525px)] bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse mb-6" />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !order) {
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

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const formattedTime = orderDate.toLocaleTimeString('mn-MN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const isCancelled =
    order.status === 'CANCELLED' || paymentStatus === 'CANCELLED';
  const isPaid = paymentStatus === 'PAID' || order.status === 'PAID';
  const isPending = order.status === 'PENDING' && paymentStatus !== 'PAID';

  // Calculate totals
  const itemTotal = order.items?.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0,
  ) || 0;
  const deliveryFee = 0; // Assuming no delivery fee for now
  const totalAmount = parseFloat(order.totalAmount) || itemTotal + deliveryFee;

  return (
    <div className="min-h-[calc(100vh-525px)] bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => router.push('/profile/orders')}
          className="mb-6 p-2 h-auto hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-base font-medium">Миний захиалгууд</span>
        </Button>

        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Захиалгын мэдээлэл
            </h1>
            <p className="text-sm text-gray-500 sm:hidden">
              {formattedDate} {formattedTime}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700">
                {formattedDate}
              </p>
              <p className="text-xs text-gray-500">{formattedTime}</p>
            </div>
            {/* Payment Button - Only show if pending and not cancelled */}
            {isPending && !isCancelled && order.status !== 'CANCELLED' && paymentStatus !== 'CANCELLED' && (
              <Button
                onClick={() => setPaymentModalOpen(true)}
                size="lg"
                className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Төлбөр төлөх
              </Button>
            )}
            {isPaid && (
              <div className="px-5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl w-full sm:w-auto text-center sm:text-left shadow-sm">
                <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Төлөгдсөн
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Banner */}
        {isCancelled && (
          <div className="mb-6 p-5 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center mt-0.5">
                <span className="text-yellow-900 text-xs font-bold">!</span>
              </div>
              <div>
                <p className="font-bold text-yellow-900 mb-1 text-lg">
                  Захиалга хүчингүй болсон
                </p>
                <p className="text-sm text-yellow-800">
                  Төлбөр төлөгдөөгүй 60 минут өнгөрсөн тул захиалга цуцлагдсан.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary Card */}
        <Card className="mb-6 bg-white border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Захиалгын дүн
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Захиалгын дугаар</span>
                <span className="font-bold text-lg text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">
                  R{String(order.id).padStart(9, '0')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Захиалга хийсэн огноо</span>
                <span className="font-semibold text-gray-800">
                  {formattedDate} {formattedTime}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Барааны дүн</span>
                <span className="font-semibold text-gray-800">
                  {itemTotal.toLocaleString()} ¥
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Дотоодын хүргэлт</span>
                <span className="font-semibold text-gray-800">
                  {deliveryFee.toLocaleString()} ¥
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-gray-200">
                <span className="text-base font-bold text-gray-900">
                  Нийт төлсөн дүн
                </span>
                <span className="font-bold text-2xl text-primary bg-primary/10 px-4 py-2 rounded-lg">
                  {totalAmount.toLocaleString()} ¥
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Details Card */}
        {order.items && order.items.length > 0 && (
          <Card className="mb-6 bg-white border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Дижитал бүтээгдэхүүн
                </h2>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Цахим хаягаар хүргэгдэнэ
                </p>
              </div>

              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <Card
                    key={item.id}
                    className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                  >
                    <CardContent className="p-5">
                      <div className="flex gap-5">
                        {/* Product Image */}
                        {item.product?.firstImage || item.product?.images?.[0] ? (
                          <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden shrink-0 shadow-md ring-2 ring-gray-100">
                            <Image
                              src={
                                item.product.firstImage || item.product.images[0]
                              }
                              alt={item.product.name}
                              width={112}
                              height={112}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                            <span className="text-4xl">📦</span>
                          </div>
                        )}

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 mb-2">
                            {item.product?.name || 'Бүтээгдэхүүн'}
                          </h3>
                          {item.product?.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {item.product.description}
                            </p>
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Тоо ширхэг: {item.quantity}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                              <span className="text-sm text-gray-600">
                                {parseFloat(item.price).toLocaleString()} ¥ × {item.quantity}
                              </span>
                              <span className="font-bold text-xl text-primary">
                                {(parseFloat(item.price) * item.quantity).toLocaleString()} ¥
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
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
              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">7777-8985</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Information Card */}
        <Card className="mb-6 bg-white border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
              Захиалагчийн мэдээлэл
            </h2>
            <div className="flex flex-wrap gap-6 sm:gap-8 justify-between">
              {/* Овог */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Овог</span>
                <span className="text-sm text-gray-900">
                  {order.address?.fullName
                    ? order.address.fullName.split(' ')[0]
                    : '-'}
                </span>
              </div>
              
              {/* Нэр */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Нэр</span>
                <span className="text-sm text-gray-900">
                  {order.address?.fullName
                    ? order.address.fullName.split(' ').slice(1).join(' ') || '-'
                    : '-'}
                </span>
              </div>
              
              {/* Утас */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Утас</span>
                <span className="text-sm text-gray-900">
                  {order.address?.phoneNumber || 
                   (typeof window !== 'undefined' && localStorage.getItem('mobile')) || 
                   '-'}
                </span>
              </div>
              
              {/* Цахим хаяг */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Цахим хаяг</span>
                <span className="text-sm text-gray-900">
                  {typeof window !== 'undefined' && localStorage.getItem('user_email') || '-'}
                </span>
              </div>
              
              {/* Хувь хүн */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Хувь хүн</span>
                <span className="text-sm text-gray-900">-</span>
              </div>
            </div>
            
            {/* Address section - show below if address exists */}
            {order.address && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Хаяг</p>
                <p className="text-sm text-gray-900">
                  {order.address.provinceOrDistrict}, {order.address.khorooOrSoum}
                  {order.address.street && `, ${order.address.street}`}
                  {order.address.building && `, ${order.address.building}`}
                  {order.address.apartmentNumber &&
                    `, ${order.address.apartmentNumber}`}
                </p>
                {order.address.addressNote && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-1">Тэмдэглэл:</p>
                    <p className="text-sm text-blue-800">{order.address.addressNote}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        orderId={orderId}
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onPaymentSuccess={() => {
          // Refresh the page or refetch order data
          window.location.reload();
        }}
      />
    </div>
  );
}
