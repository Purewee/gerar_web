'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFavorites } from '@/lib/api';
import { ProductCard } from '@/components/product-card';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { CardSkeleton } from '@/components/skeleton';

export default function ProfileFavoritesPage() {
  const { data: favoritesResponse, isLoading, error } = useFavorites();
  const favorites = (favoritesResponse?.data || []).filter(p => p.isHidden !== true);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Миний хадгалсан</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-6'>
          <CardSkeleton />
          <CardSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Миний хадгалсан
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Алдаа гарлаа</h3>
            <p className="text-muted-foreground mb-6">Дахин оролдоно уу</p>
            <Button variant="outline" asChild className="shadow-sm">
              <Link href="/">Дэлгүүрт орох</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Миний хадгалсан
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Одоогоор хадгалсан бараа байхгүй
            </h3>
            <p className="text-muted-foreground mb-6">Дуртай бараануудаа энд хадгална уу</p>
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
          Миний хадгалсан ({favorites.length})
        </CardTitle>
        <CardDescription className="mt-2">Хадгалсан бараануудаа харах</CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
          {favorites.map(product => {
            return <ProductCard key={product.id} product={product} inGrid compact />;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
