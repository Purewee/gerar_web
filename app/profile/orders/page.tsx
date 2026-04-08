'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrders } from '@/lib/api';
import { MapPin, ShoppingBag, CheckCircle2, XCircle, Clock, Coins } from 'lucide-react';
import { OrderCardSkeleton } from '@/components/skeleton';

// Mongolian month names
const MONTHS_MN = [
  '1 сарын',
  '2 сарын',
  '3 сарын',
  '4 сарын',
  '5 сарын',
  '6 сарын',
  '7 сарын',
  '8 сарын',
  '9 сарын',
  '10 сарын',
  '11 сарын',
  '12 сарын',
];

// Format date in Mongolian
function formatDateMongolian(date: Date): string {
  const day = date.getDate();
  const month = MONTHS_MN[date.getMonth()];
  const year = date.getFullYear();
  return `${year} оны ${month} ${day}`;
}

const ORDER_STATUS: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  PENDING: {
    label: 'Хүлээгдэж байна',
    icon: Clock,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  PAID: {
    label: 'Төлөгдсөн',
    icon: CheckCircle2,
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  CANCELLED: {
    label: 'Цуцлагдсан',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

export default function ProfileOrdersPage() {
  const { data: ordersResponse, isLoading, error } = useOrders();
  const orders = ordersResponse?.data || [];

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Миний захиалгууд</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Миний захиалгууд</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-muted-foreground mb-4">Алдаа гарлаа. Дахин оролдоно уу.</p>
            <Button variant="link" asChild>
              <Link href="/">Дэлгүүрт орох</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Миний захиалгууд
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Одоогоор захиалга байхгүй байна
            </h3>
            <p className="text-muted-foreground mb-6">Анхны захиалгаа үүсгэх үү?</p>
            <Button variant="outline" asChild className="shadow-sm">
              <Link href="/">Дэлгүүрт орох</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
        <CardTitle className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Миний захиалгууд ({orders.length})
        </CardTitle>
        <CardDescription className="mt-2">Захиалгын түүхээ харах</CardDescription>
      </CardHeader>
      <CardContent className="p-6 lg:p-8">
        <div className="flex flex-col space-y-4">
          {orders.map(order => (
            <Link key={order.id} href={`/orders/${order.id}`} className="group">
              <Card className="relative overflow-hidden transition-all duration-300 border border-gray-200 hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5">
                {/* hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-linear-to-r from-primary/5 to-transparent" />

                <CardContent className="relative p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* LEFT */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Захиалга #{order.id}
                        </h3>

                        {(() => {
                          const status = ORDER_STATUS[order.status];
                          const IconComponent = status?.icon;
                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${status?.className || 'bg-gray-50 text-gray-700 border-gray-200'}`}
                            >
                              {IconComponent && <IconComponent className="w-3 h-3" />}
                              {status?.label ?? order.status}
                            </span>
                          );
                        })()}
                      </div>

                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        📅 {formatDateMongolian(new Date(order.createdAt))}
                      </p>

                      {order.address && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {order.address.provinceOrDistrict}, {order.address.khorooOrSoum}
                        </p>
                      )}

                      {order.items && order.items.length > 0 && (
                        <p className="text-xs text-gray-400">
                          {order.items?.length ?? 0} бүтээгдэхүүн
                        </p>
                      )}

                      {order.usedPoints > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="px-2 py-0.5 rounded bg-yellow-100 border border-yellow-200">
                            <span className="text-[10px] font-bold text-yellow-700 flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              {order.usedPoints.toLocaleString()} оноо ашигласан
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="sm:text-right flex flex-col sm:items-end justify-center">
                      <p className="text-2xl font-bold text-primary">
                        {Number(order.totalAmount).toLocaleString()}₮
                      </p>
                      {order.earnedPoints > 0 && (
                        <p className="text-[11px] font-bold text-blue-600 mt-1 uppercase tracking-tight">
                          +{order.earnedPoints.toLocaleString()} оноо цуглуулсан
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Дэлгэрэнгүй харах →</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
