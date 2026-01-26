'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCartAdd, useFavoriteAdd, useFavoriteRemove, useFavoriteStatus } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  original?: number;
  icon?: string;
  imageUrl?: string;
  featured?: boolean;
  className?: string;
  inGrid?: boolean; // If true, card will fill grid cell instead of using fixed width
}

export function ProductCard({
  id,
  name,
  price,
  original,
  icon,
  imageUrl,
  featured = false,
  className = '',
  inGrid = false,
}: ProductCardProps) {
  const addToCartMutation = useCartAdd();
  const addFavoriteMutation = useFavoriteAdd();
  const removeFavoriteMutation = useFavoriteRemove();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessingCart, setIsProcessingCart] = useState(false);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);

  const displayImage = imageUrl || icon || '📦';
  const isImageUrl = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'));

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessingCart) return;
    setIsProcessingCart(true);

    try {
      await addToCartMutation.mutateAsync({
        productId: id,
        quantity: 1,
      });
      toast.success('Сагсанд нэмэгдсэн');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Сагсанд нэмэхэд алдаа гарлаа',
      });
    } finally {
      setIsProcessingCart(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessingFavorite) return;
    setIsProcessingFavorite(true);

    try {
      if (isFavorited) {
        await removeFavoriteMutation.mutateAsync(id);
        setIsFavorited(false);
        toast.success('Амжилттай хасагдлаа');
      } else {
        await addFavoriteMutation.mutateAsync(id);
        setIsFavorited(true);
        toast.success('Амжилттай нэмэгдлээ');
      }
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Шинэчлэхэд алдаа гарлаа',
      });
    } finally {
      setIsProcessingFavorite(false);
    }
  };

  const hasDiscount = original && original > price;
  const discountPercentage = hasDiscount ? Math.round(((original - price) / original) * 100) : 0;

  const wrapperClass = inGrid
    ? `w-full ${className}`
    : `shrink-0 w-40 sm:w-44 md:w-48 lg:w-52 ${className}`;

  return (
    <div className={wrapperClass}>
      <Card
        className={`group cursor-pointer hover:shadow-xl transition-all duration-300 h-full border-gray-200 overflow-hidden ${
          featured ? 'ring-2 ring-primary/20' : ''
        }`}
      >
        <Link
          href={`/product/${id}`}
          className="block h-full"
          aria-label={`${name} - ${price.toLocaleString()}₮ - Дэлгэрэнгүй мэдээлэл харах`}
        >
          <CardContent className="flex flex-col h-full p-0">
            {/* Image Section */}
            <div
              className="relative bg-gray-100 w-full overflow-hidden"
              style={{ aspectRatio: '4/3' }}
            >
              {isImageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  fill
                  priority
                  fetchPriority="high"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl">
                  {displayImage}
                </div>
              )}

              {/* Favorite Button - Top Right */}
              <button
                onClick={handleToggleFavorite}
                disabled={isProcessingFavorite}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
                aria-label={isFavorited ? 'Дурсамжаас хасах' : 'Дурсамжид нэмэх'}
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-colors ${
                    isFavorited
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-600 group-hover:text-red-500'
                  }`}
                />
              </button>

              {/* Discount Badge */}
              {hasDiscount && discountPercentage > 0 && (
                <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md shadow-md">
                  -{discountPercentage}%
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1 p-3">
              <h3 className="font-medium text-xs sm:text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {name}
              </h3>

              {/* Price Section */}
              <div className="flex flex-col gap-1 mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm sm:text-base font-bold text-primary">
                    {price.toLocaleString()}₮
                  </span>
                  {hasDiscount && (
                    <span className="text-xs sm:text-sm text-gray-500 line-through">
                      {original.toLocaleString()}₮
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-auto">
                <Button
                  onClick={handleAddToCart}
                  disabled={isProcessingCart}
                  className="flex-1 h-8 text-xs sm:text-sm font-medium bg-primary-light text-primary-light-foreground"
                  size="sm"
                  aria-label={`${name} сагсанд нэмэх`}
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  <span>Сагслах</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}
