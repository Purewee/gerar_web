"use client";

import { useState, useEffect } from "react";
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
  useOrderBuyNow,
  useAddresses,
  getAuthToken,
  queryKeys,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const productId = parseInt(params.id as string);
  const {
    data: productResponse,
    isLoading: loading,
    error: productError,
  } = useProduct(isNaN(productId) ? 0 : productId);
  const product = productResponse?.data;

  // Local state for favorite status to enable optimistic updates
  const [isFavorited, setIsFavorited] = useState(product?.isFavorite || false);

  // Sync local state with product data when it changes
  useEffect(() => {
    if (product?.isFavorite !== undefined) {
      setIsFavorited(product.isFavorite);
    }
  }, [product?.isFavorite]);

  const addToCartMutation = useCartAdd();
  const addFavoriteMutation = useFavoriteAdd();
  const removeFavoriteMutation = useFavoriteRemove();
  const buyNowMutation = useOrderBuyNow();

  // Fetch user addresses to check if we can do instant checkout
  const { data: addressesResponse } = useAddresses();
  const addresses = addressesResponse?.data || [];
  const defaultAddress =
    addresses.find((addr) => addr.isDefault) || addresses[0];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-525px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Бүтээгдэхүүн ачаалж байна...</p>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-[calc(100vh-525px)] bg-gray-50 flex items-center justify-center">
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

  const handleBuyNow = async () => {
    if (!product) return;

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

    // Store buyNow product info and redirect to order create page
    // User will choose address and delivery time, then confirm to call buyNow API
    sessionStorage.setItem(
      "buyNowProduct",
      JSON.stringify({
        productId: product.id,
        quantity: quantity,
        productName: product.name,
        productPrice: product.price,
      })
    );
    router.push("/orders/create");
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

    // Optimistically update UI immediately
    const newFavoriteStatus = !isFavorited;
    setIsFavorited(newFavoriteStatus);

    // Optimistically update query cache
    const queryKey = queryKeys.products.detail(productId);
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData?.data) return oldData;
      return {
        ...oldData,
        data: {
          ...oldData.data,
          isFavorite: newFavoriteStatus,
        },
      };
    });

    try {
      let response;
      if (isFavorited) {
        // Remove from favorites
        response = await removeFavoriteMutation.mutateAsync(product.id);
        toast({
          title: "Дуртай жагсаалтаас устгагдсан",
          description: `${product.name} дуртай жагсаалтаас устгагдлаа`,
        });
      } else {
        // Add to favorites
        response = await addFavoriteMutation.mutateAsync(product.id);
        toast({
          title: "Дуртай жагсаалтад нэмэгдсэн",
          description: `${product.name} дуртай жагсаалтад нэмэгдлээ`,
        });
      }

      // Update query cache with actual API response data
      if (response?.data) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: {
              ...response.data,
              isFavorite: newFavoriteStatus,
            },
          };
        });
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setIsFavorited(!newFavoriteStatus);
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            isFavorite: !newFavoriteStatus,
          },
        };
      });
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Button onClick={() => router.back()} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Буцах
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div>
            <Card className="mb-4 border-none">
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900">
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

            <div className="mb-4">
              <span
                className={`text-sm font-medium ${
                  product.stock > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                Барааны үлдэгдэл: {product.stock} ширхэг
                {product.stock === 0 && " (Дууссан)"}
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Тайлбар</h2>
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div className="mb-6">
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
                disabled={product.stock === 0 || buyNowMutation.isPending}
              >
                {buyNowMutation.isPending
                  ? "Бэлдэж байна..."
                  : "Одоо худалдаж авах"}
              </Button>
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
                  className={`w-5 h-5 ${
                    isFavorited ? "fill-red-600 text-red-600" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
