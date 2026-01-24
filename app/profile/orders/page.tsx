'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrders } from '@/lib/api';
import { MapPin, ShoppingBag } from 'lucide-react';
import { OrderCardSkeleton } from '@/components/skeleton';

export default function ProfileOrdersPage() {
  const { data: ordersResponse, isLoading, error } = useOrders();
  const orders = ordersResponse?.data || [];

  if (isLoading) {
    return (
      <Card>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Одоогоор захиалга байхгүй</h3>
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
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-primary/30">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Захиалга #{order.id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : order.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <span>📅</span>
                        {new Date(order.createdAt).toLocaleDateString('mn-MN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      {order.address && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.address.provinceOrDistrict}, {order.address.khorooOrSoum}
                        </p>
                      )}
                      {order.items && order.items.length > 0 && (
                        <p className="text-sm text-gray-500">{order.items.length} зүйл</p>
                      )}
                    </div>
                    <div className="text-right sm:text-left sm:min-w-[120px]">
                      <p className="text-2xl font-bold text-primary">
                        {parseFloat(order.totalAmount).toLocaleString()}₮
                      </p>
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
