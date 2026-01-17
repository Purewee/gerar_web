"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ShoppingCart, ArrowLeft, Plus, Minus, Heart } from "lucide-react";
import {
  useProduct,
  useCartAdd,
  useFavoriteAdd,
  useFavoriteRemove,
  useFavoriteStatus,
  getAuthToken,
} from "@/lib/api";
import Image from "next/image";
import { CardSkeleton, Spinner } from "@/components/skeleton";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const productId = parseInt(params.id as string);
  const {
    data: productResponse,
    isLoading: loading,
    error: productError,
  } = useProduct(isNaN(productId) ? 0 : productId);
  const product = productResponse?.data;

  const addToCartMutation = useCartAdd();
  const addFavoriteMutation = useFavoriteAdd();
  const removeFavoriteMutation = useFavoriteRemove()

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-525px)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6  py-4">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 w-20 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-1/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-1/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="bg-gray-50 flex items-center justify-center min-h-[calc(100vh-525px)]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Бүтээгдэхүүн олдсонгүй</p>
          <Button onClick={() => router.push("/")}>
            Нүүр хуудас руу буцах
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!product) return;

    const token = getAuthToken();
    if (!token) {
      toast({
        title: "Нэвтрэх шаардлагатай",
        description: "Сагсанд нэмэхийн тулд нэвтэрнэ үү",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    try {
      await addToCartMutation.mutateAsync({ productId: product.id, quantity });
      window.dispatchEvent(new Event("cartUpdated"));
      toast({
        title: "Сагсанд нэмэгдсэн",
        description: `${product.name} таны сагсанд нэмэгдлээ`,
      });
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Сагсанд нэмэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = () => {
    const token = getAuthToken();
    if (!token) {
      toast({
        title: "Нэвтрэх шаардлагатай",
        description: "Худалдаж авахын тулд нэвтэрнэ үү",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    toast({
      title: "Төлбөр төлөх рүү шилжиж байна",
      description: "Төлбөр төлөх хуудас руу шилжиж байна...",
    });
  };

  const handleToggleFavorite = async () => {
    if (!product) return;

    const token = getAuthToken();
    if (!token) {
      toast({
        title: "Нэвтрэх шаардлагатай",
        description: "Дуртай жагсаалтад нэмэхийн тулд нэвтэрнэ үү",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    try {
      // if (isFavorited) {
      //   await removeFavoriteMutation.mutateAsync(product.id);
      //   toast({
      //     title: "Дуртай жагсаалтаас устгагдсан",
      //     description: `${product.name} дуртай жагсаалтаас устгагдлаа`,
      //   });
      // } else {
      //   await addFavoriteMutation.mutateAsync(product.id);
      //   toast({
      //     title: "Дуртай жагсаалтад нэмэгдсэн",
      //     description: `${product.name} дуртай жагсаалтад нэмэгдлээ`,
      //   });
      // }
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Дуртай жагсаалт шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full bg-white pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <Button onClick={() => router.back()} variant="ghost" className="mb-2 md:mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Буцах
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div>
            <Card className=" border border-gray-200">
              <CardContent className="p-0">
                <div className="rounded-lg h-64 sm:h-80 lg:h-96 flex items-center justify-center overflow-hidden">
                  {product.images[selectedImage] &&
                    (product.images[selectedImage].startsWith("http") ||
                      product.images[selectedImage].startsWith("/")) ? (
                    <Image
                      src={product.images[selectedImage]}
                      alt={product.name}
                      width={800}
                      height={600}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-8xl sm:text-9xl">
                      {product.images[selectedImage] || "📦"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, idx) => (
                  <Button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    variant={selectedImage === idx ? "default" : "outline"}
                    size="icon"
                    className="h-16 sm:h-20 w-16 sm:w-20"
                  >
                    {img.startsWith("http") || img.startsWith("/") ? (
                      <Image
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">{img}</span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
              {product.name}
            </h1>
            <div className="flex flex-col-reverse items-start sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 md:mb-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                  {parseFloat(product.price).toLocaleString()}₮
                </div>
                {product.originalPrice &&
                  parseFloat(product.originalPrice) >
                  parseFloat(product.price) && (
                    <div className="text-xl text-gray-500 line-through">
                      {parseFloat(product.originalPrice).toLocaleString()}₮
                    </div>
                  )}
              </div>
              {product.discountPercentage && (
                <div className="bg-primary text-primary-foreground text-sm font-medium sm:font-semibold lg:font-bold px-3 py-1 rounded-full">
                  {product.discountPercentage}% ХЯМДРАЛТАЙ
                </div>
              )}
            </div>

            {product.stock > 0 && (
              <div className="mb-2 md:mb-4">
                <span className="text-sm text-green-600 font-medium">
                  Барааны үлдэгдэл: {product.stock} ширхэг
                </span>
              </div>
            )}

            <div className="mb-2 md:mb-6">
              <h2 className="text-lg font-semibold mb-2">Тайлбар</h2>
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div className="mb-2 md:mb-6 flex items-end gap-20">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Тоо ширхэг
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    variant="outline"
                    size="icon"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-semibold w-12 text-center">
                    {quantity}
                  </span>
                  <Button
                    onClick={() => setQuantity(quantity + 1)}
                    variant="outline"
                    size="icon"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleToggleFavorite}
                variant="outline"
                size="icon"
                disabled={
                  addFavoriteMutation.isPending ||
                  removeFavoriteMutation.isPending
                }
              >
                <Heart
                  className={`w-5 h-5 
                    }`}
                />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1"
                disabled={addToCartMutation.isPending || product.stock === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {addToCartMutation.isPending
                  ? "Нэмэж байна..."
                  : "Сагсанд нэмэх"}
              </Button>
              <Button
                onClick={handleBuyNow}
                className="flex-1"
                disabled={product.stock === 0}
              >
                Одоо худалдаж авах
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
