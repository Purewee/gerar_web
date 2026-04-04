'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useCartAdd,
  useFavoriteAdd,
  useFavoriteRemove,
  useFavoriteStatus,
  getAuthToken,
} from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Coins } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PointProduct } from '@/lib/api';

export interface PointProductCardProps {
  product: PointProduct;
  featured?: boolean;
  className?: string;
  inGrid?: boolean;
  compact?: boolean;
}

export function PointProductCard({
  product,
  featured = false,
  className = '',
  inGrid = false,
  compact = false,
}: PointProductCardProps) {
  const addToCartMutation = useCartAdd();
  const addFavoriteMutation = useFavoriteAdd();
  const removeFavoriteMutation = useFavoriteRemove();

  // Use hook for status if authenticated
  const { data: statusResponse } = useFavoriteStatus(product.id, true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessingCart, setIsProcessingCart] = useState(false);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);

  useEffect(() => {
    if (statusResponse?.data) {
      setIsFavorited(statusResponse.data.isFavorited);
    }
  }, [statusResponse]);

  const imageUrl = product?.firstImage || product?.images?.[0];
  const displayImage = imageUrl || '📦';
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
        productId: product.id,
        quantity: 1,
        isPointProduct: true,
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

    if (!getAuthToken()) {
      toast.info('Та нэвтрээгүй байна. Нэвтэрч орно уу!');
      window.dispatchEvent(new CustomEvent('openLoginModal'));
      return;
    }

    if (isProcessingFavorite) return;
    setIsProcessingFavorite(true);

    try {
      if (isFavorited) {
        await removeFavoriteMutation.mutateAsync(product.id);
        setIsFavorited(false);
        toast.success('Амжилттай хасагдлаа');
      } else {
        await addFavoriteMutation.mutateAsync({ productId: product.id, isPointProduct: true });
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

  const wrapperClass = inGrid
    ? `w-full h-full ${className}`
    : `shrink-0 w-40 sm:w-44 md:w-48 lg:w-52 ${className}`;

  return (
    <div className={wrapperClass}>
      <Card
        className={`cursor-pointer hover:shadow-xl transition-all duration-300 h-full border-gray-200 overflow-hidden ${
          featured ? 'ring-2 ring-primary/20 bg-primary/5' : ''
        }`}
      >
        <Link
          href={`/loyalty-store/${product?.id}`}
          className="block h-full"
          aria-label={`${
            product?.name
          } - ${product?.pointsPrice} оноо - Дэлгэрэнгүй мэдээлэл харах`}
        >
          <CardContent className="flex flex-col h-full p-0">
            {/* Image Section - 1:1 square */}
            <div
              className="relative bg-gray-100 w-full overflow-hidden"
              style={{ aspectRatio: '1' }}
            >
              {product?.stock === 0 && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
                  <span className="text-white font-bold text-lg sm:text-xl uppercase tracking-wider">
                    Дууссан
                  </span>
                </div>
              )}
              {isImageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product?.name ?? ''}
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  fill
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

              {/* Point Badge */}
              {/* <div className="absolute top-2 left-2 z-10 bg-white font-bold px-2 py-1 rounded-md text-xs shadow-lg border border-gray-100 flex items-center gap-1">
                <div className="bg-yellow-500 p-1 rounded-full shadow-md">
                  <Coins className="w-3 h-3 text-white" />
                </div>
                <span className={`font-bold text-yellow-600 ${compact ? 'text-xs' : 'text-sm '}`}>
                  {product?.pointsPrice.toLocaleString()} оноо
                </span>
              </div> */}

              {/* Favorite Button - Top Right */}
              {/* <button
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
              </button> */}
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
                {/* <div className={`flex flex-col gap-0.5 ${compact ? 'mb-1' : 'mb-2'}`}>
                  <div className="flex items-baseline gap-1.5 flex-wrap items-center">
                    <div className="bg-yellow-500 p-1 rounded-full shadow-md">
                      <Coins className="w-3 h-3 text-white" />
                    </div>
                    <span
                      className={`font-bold text-yellow-600 ${
                        compact ? 'text-xs' : 'text-sm sm:text-base'
                      }`}
                    >
                      {product?.pointsPrice.toLocaleString()} оноо
                    </span>
                  </div>
                </div> */}

                {/* Action Buttons */}
                <div className={`flex gap-1.5 mt-auto ${compact ? 'gap-1' : ''}`}>
                  <Button
                    onClick={handleAddToCart}
                    loading={isProcessingCart}
                    disabled={isProcessingCart}
                    className={`flex-1 font-medium bg-yellow-500 hover:bg-yellow-600 text-white border border-1 gap-1 border-yellow-600 transition-all duration-200 rounded-lg shadow-sm ${
                      compact ? 'h-7 text-[10px] px-1.5' : 'h-8 text-xs sm:text-sm'
                    }`}
                    size="sm"
                  >
                    {/* <ShoppingCart
                      className={`mr-1 shrink-0 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`}
                      aria-hidden="true"
                    /> */}
                    <div className="bg-yellow-400 p-1 rounded-full shadow-md">
                      <Coins className="w-3 h-3 text-white" />
                    </div>
                    <span className={compact ? 'truncate' : ''}>
                      {product?.pointsPrice.toLocaleString()}
                    </span>
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
