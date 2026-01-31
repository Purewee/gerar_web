'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCartAdd, useFavoriteAdd, useFavoriteRemove } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Product } from '@/lib/types';

export interface ProductCardProps {
  product: Product;
  icon?: string;
  featured?: boolean;
  className?: string;
  inGrid?: boolean; // If true, card will fill grid cell instead of using fixed width
  compact?: boolean; // Tighter layout for mobile grids (e.g. favorites)
}

export function ProductCard({
  product,
  icon,
  featured = false,
  className = '',
  inGrid = false,
  compact = false,
}: ProductCardProps) {
  const addToCartMutation = useCartAdd();
  const addFavoriteMutation = useFavoriteAdd();
  const removeFavoriteMutation = useFavoriteRemove();
  const [isFavorited, setIsFavorited] = useState(product?.isFavorite);
  const [isProcessingCart, setIsProcessingCart] = useState(false);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);

  const imageUrl = product?.firstImage || product?.images?.[0];

  const displayImage = imageUrl || icon || '📦';
  const isImageUrl = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'));

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product?.stock === 0) {
      toast.error('Бараа дууссан байна.');
      return;
    }

    if (isProcessingCart) return;
    setIsProcessingCart(true);

    try {
      await addToCartMutation.mutateAsync({
        productId: product?.id,
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
        await removeFavoriteMutation.mutateAsync(product?.id);
        setIsFavorited(false);
        toast.success('Амжилттай хасагдлаа');
      } else {
        await addFavoriteMutation.mutateAsync(product?.id);
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

  const priceNum = Number(product?.price) || 0;
  const originalNum = product?.originalPrice != null ? Number(product.originalPrice) : 0;
  const hasDiscount = originalNum > 0 && originalNum > priceNum;
  const discountPercentage = hasDiscount
    ? Math.round(((originalNum - priceNum) / originalNum) * 100)
    : 0;

  const wrapperClass = inGrid
    ? `w-full h-full ${className}`
    : `shrink-0 w-40 sm:w-44 md:w-48 lg:w-52 ${className}`;

  return (
    <div className={wrapperClass}>
      <Card
        className={`cursor-pointer hover:shadow-xl transition-all duration-300 h-full border-gray-200 overflow-hidden ${
          featured ? 'ring-2 ring-primary/20' : ''
        }`}
      >
        <Link
          href={`/product/${product?.id}`}
          className="block h-full"
          aria-label={`${
            product?.name
          } - ${priceNum.toLocaleString()}₮ - Дэлгэрэнгүй мэдээлэл харах`}
        >
          <CardContent className="flex flex-col h-full p-0">
            {/* Image Section - 1:1 square */}
            <div
              className="relative bg-gray-100 w-full overflow-hidden"
              style={{ aspectRatio: '1' }}
            >
              {isImageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product?.name ?? ''}
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  fill
                  priority
                  fetchPriority="high"
                />
              ) : (
                <div
                  className={`absolute inset-0 flex items-center justify-center ${
                    compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
                  }`}
                >
                  {displayImage}
                </div>
              )}

              {/* Favorite Button - Top Right */}
              <button
                onClick={handleToggleFavorite}
                disabled={isProcessingFavorite}
                className={`absolute cursor-pointer z-10 rounded-full bg-white/90 border border-gray-200 backdrop-blur-sm hover:bg-white transition-colors shadow-md hover:shadow-lg disabled:opacity-50 ${
                  compact ? 'top-1 right-1 p-1' : 'top-2 right-2 p-1.5'
                }`}
                aria-label={isFavorited ? 'Хадгалах' : 'Хасах'}
              >
                <Heart
                  className={`transition-colors ${compact ? 'size-5' : 'size-6'} ${
                    isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
                  }`}
                />
              </button>

              {/* Discount Badge */}
              {hasDiscount && discountPercentage > 0 && (
                <div
                  className={`absolute z-10 bg-red-500 text-white font-bold rounded-md shadow-md ${
                    compact
                      ? 'top-1 left-1 px-1.5 py-0.5 text-[10px]'
                      : 'top-2 left-2 px-2 py-1 text-xs'
                  }`}
                >
                  -{discountPercentage}%
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className={`flex flex-col justify-between flex-1 ${compact ? 'p-2' : 'p-3'}`}>
              <h3
                className={`font-medium line-clamp-2 hover:text-primary transition-colors ${
                  compact ? 'text-xs mb-1' : 'text-xs sm:text-sm mb-2'
                }`}
              >
                {product?.name}
              </h3>

              <div>
                {/* Price Section */}
                <div className={`flex flex-col gap-0.5 ${compact ? 'mb-1' : 'mb-2'}`}>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span
                      className={`font-bold text-primary ${
                        compact ? 'text-xs' : 'text-sm sm:text-base'
                      }`}
                    >
                      {priceNum.toLocaleString()}₮
                    </span>
                    {hasDiscount && (
                      <span
                        className={`text-gray-500 line-through ${
                          compact ? 'text-[10px]' : 'text-xs sm:text-sm'
                        }`}
                      >
                        {originalNum.toLocaleString()}₮
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={`flex gap-1.5 mt-auto ${compact ? 'gap-1' : ''}`}>
                  <Button
                    onClick={handleAddToCart}
                    loading={isProcessingCart}
                    disabled={isProcessingCart}
                    className={`flex-1 font-medium bg-primary-light text-primary-light-foreground ${
                      compact ? 'h-7 text-[10px] px-1.5' : 'h-8 text-xs sm:text-sm'
                    }`}
                    size="sm"
                    aria-label={`${product?.name} сагсанд нэмэх`}
                  >
                    <ShoppingCart
                      className={`mr-1 shrink-0 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`}
                      aria-hidden="true"
                    />
                    <span className={compact ? 'truncate' : ''}>Сагслах</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}
