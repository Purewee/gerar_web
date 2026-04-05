'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  useCartAdd,
  useFavoriteAdd,
  useFavoriteRemove,
  useFavoriteStatus,
  getAuthToken,
} from '@/lib/api';
import Image from 'next/image';
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

export function GiftProductCard({
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
        className={`cursor-pointer shadow-none transition-all bg-transparent/100 border-none duration-300 h-full border-gray-200 overflow-hidden ${
          featured ? 'ring-2 ring-primary/20 bg-primary/5' : ''
        }`}
      >
        <CardContent className="flex flex-col h-full p-0">
          {/* Image Section - 1:1 square */}
          <div
            className="relative rounded-4xl bg-gray-100 w-full overflow-hidden w-full"
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
                sizes="(max-width: 640px) 40vw, (max-width: 768px) 23vw, (max-width: 1024px) 15vw, 10vw"
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
          </div>

          {/* Content Section */}
          <div className={`flex flex-col justify-between flex-1 p-3'}`}>
            <h3
              className={`font-medium text-center mt-2 line-clamp-2 text-white transition-colors text-md mb-2'
              }`}
            >
              <span className="">🎁</span>
              {product?.name}
            </h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
