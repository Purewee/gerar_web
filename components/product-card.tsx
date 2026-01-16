"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCartAdd, useFavoriteAdd, useFavoriteRemove, useFavoriteStatus } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart } from "lucide-react";
import { useState, useEffect } from "react";

export interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  original?: number;
  icon?: string;
  imageUrl?: string;
  featured?: boolean;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  original,
  icon,
  imageUrl,
  featured = false,
  className = "",
}: ProductCardProps) {
  const { toast } = useToast();
  const addToCartMutation = useCartAdd();
  const addFavoriteMutation = useFavoriteAdd();
  const removeFavoriteMutation = useFavoriteRemove();
  const { data: favoriteStatusResponse } = useFavoriteStatus(id);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessingCart, setIsProcessingCart] = useState(false);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);

  const displayImage = imageUrl || icon || "📦";
  const isImageUrl =
    imageUrl && (imageUrl.startsWith("http") || imageUrl.startsWith("/"));

  // Update favorite status from API response
  useEffect(() => {
    if (favoriteStatusResponse?.data?.isFavorited !== undefined) {
      setIsFavorited(favoriteStatusResponse.data.isFavorited);
    }
  }, [favoriteStatusResponse]);

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
      toast({
        title: "Амжилттай",
        description: `${name} сагсанд нэмэгдлээ`,
        variant: "default",
      });
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Сагсанд нэмэхэд алдаа гарлаа",
        variant: "destructive",
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
        toast({
          title: "Амжилттай",
          description: `${name} дурсамжаас хасагдлаа`,
          variant: "default",
        });
      } else {
        await addFavoriteMutation.mutateAsync(id);
        setIsFavorited(true);
        toast({
          title: "Амжилттай",
          description: `${name} дурсамжид нэмэгдлээ`,
          variant: "default",
        });
      }
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Дурсамж шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFavorite(false);
    }
  };

  const hasDiscount = original && original > price;
  const discountPercentage = hasDiscount
    ? Math.round(((original - price) / original) * 100)
    : 0;

  return (
    <div className={`shrink-0 w-44 sm:w-48 md:w-56 lg:w-64 ${className}`}>
      <Card
        className={`group cursor-pointer hover:shadow-xl transition-all duration-300 h-full border-gray-200 overflow-hidden ${
          featured ? "ring-2 ring-primary/20" : ""
        }`}
      >
        <Link href={`/product/${id}`} className="block h-full">
          <CardContent className="flex flex-col h-full p-0">
            {/* Image Section */}
            <div className="relative bg-gray-100 w-full overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {isImageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 176px, (max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl">
                  {displayImage}
                </div>
              )}
              
              {/* Favorite Button - Top Right */}
              <button
                onClick={handleToggleFavorite}
                disabled={isProcessingFavorite}
                className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
                aria-label={isFavorited ? "Дурсамжаас хасах" : "Дурсамжид нэмэх"}
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isFavorited
                      ? "fill-red-500 text-red-500"
                      : "text-gray-600 group-hover:text-red-500"
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
            <div className="flex flex-col flex-1 p-4">
              <h3 className="font-medium text-xs sm:text-sm md:text-base line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                {name}
              </h3>

              {/* Price Section */}
              <div className="flex flex-col gap-1 mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-base sm:text-lg md:text-xl font-bold text-primary">
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
                  className="flex-1 h-9 text-xs sm:text-sm font-medium"
                  size="sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Сагслах
                </Button>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}
