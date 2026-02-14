'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, ArrowLeft, Plus, Minus, Heart, Loader2 } from 'lucide-react';
import {
  useProduct,
  useCart,
  useCartAdd,
  useFavoriteAdd,
  useFavoriteRemove,
  getAuthToken,
} from '@/lib/api';
import Image from 'next/image';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isBuyNowLoading, setIsBuyNowLoading] = useState(false);

  const productId = parseInt(params.id as string);
  const {
    data: productResponse,
    isLoading: loading,
    error: productError,
  } = useProduct(isNaN(productId) ? 0 : productId);

  const product = productResponse?.data;

  const { data: cartResponse } = useCart();
  const cartItems = cartResponse?.data || [];
  const cartItem = product ? cartItems.find(item => item.productId === product.id) : null;
  const isInCart = !!cartItem;
  const isFavorite = product?.isFavorite;
  const cartQuantity = cartItem?.quantity ?? 0;

  const addToCartMutation = useCartAdd();
  const addFavoriteMutation = useFavoriteAdd();
  const removeFavoriteMutation = useFavoriteRemove();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-525px)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
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

  // Don't show product if not found, error, or hidden (hidden = not loaded for catalog)
  if (productError || !product || product.isHidden === true) {
    return (
      <div className="bg-gray-50 flex items-center justify-center min-h-[calc(100vh-525px)]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Бүтээгдэхүүн олдсонгүй</p>
          <Button onClick={() => router.push('/')}>Нүүр хуудас руу буцах</Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCartMutation.mutateAsync({ productId: product.id, quantity });
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Сагсанд нэмэгдсэн');
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Сагсанд нэмэхэд алдаа гарлаа',
      });
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    setIsBuyNowLoading(true);
    try {
      await addToCartMutation.mutateAsync({ productId: product.id, quantity });
      window.dispatchEvent(new Event('cartUpdated'));
      router.push('/orders/create');
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Сагсанд нэмэхэд алдаа гарлаа',
      });
    } finally {
      setIsBuyNowLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;

    const token = getAuthToken();
    if (!token) {
      window.dispatchEvent(new CustomEvent('authRequired'));
      return;
    }

    try {
      if (isFavorite) {
        await removeFavoriteMutation.mutateAsync(product.id);
        toast.success(`Жагсаалтаас устгагдлаа`);
      } else {
        await addFavoriteMutation.mutateAsync(product.id);
        toast.success(`Жагсаалтад нэмэгдлээ`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Алдаа гарлаа');
    }
  };

  return (
    <div className="h-full bg-white pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-2 md:mb-6"
          aria-label="Өмнөх хуудас руу буцах"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          <span>Буцах</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="flex flex-col gap-4">
            <Card className=" border border-gray-200">
              <CardContent className="p-0">
                <div className="rounded-lg h-64 sm:h-80 lg:h-96 flex items-center justify-center overflow-hidden">
                  {product.images[selectedImage] &&
                  (product.images[selectedImage].startsWith('http') ||
                    product.images[selectedImage].startsWith('/')) ? (
                    <Image
                      src={product.images[selectedImage]}
                      alt={product.name}
                      width={800}
                      height={600}
                      className="w-full h-full object-contain"
                      priority={selectedImage === 0}
                      quality={90}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                      fetchPriority={selectedImage === 0 ? 'high' : 'auto'}
                    />
                  ) : (
                    <div className="text-8xl sm:text-9xl">
                      {product.images[selectedImage] || '📦'}
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
                    variant={selectedImage === idx ? 'default' : 'outline'}
                    size="icon"
                    className="h-16 sm:h-20 w-16 sm:w-20"
                    aria-label={`${product.name} - Зураг ${idx + 1} сонгох`}
                    aria-pressed={selectedImage === idx}
                  >
                    {img.startsWith('http') || img.startsWith('/') ? (
                      <Image
                        src={img}
                        alt=""
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        quality={75}
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="text-3xl" aria-hidden="true">
                        {img}
                      </span>
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
                  parseFloat(product.originalPrice) > parseFloat(product.price) && (
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

            <div className="mb-4 md:mb-6 flex items-end gap-20">
              <div>
                <label className="block text-sm font-medium mb-2">Тоо ширхэг</label>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    variant="outline"
                    size="icon"
                    aria-label="Тоо ширхэг багасгах"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <span
                    className="text-lg font-semibold w-12 text-center"
                    aria-label={`Тоо ширхэг: ${quantity}`}
                  >
                    {quantity}
                  </span>
                  <Button
                    onClick={() => setQuantity(quantity + 1)}
                    variant="outline"
                    size="icon"
                    aria-label="Тоо ширхэг нэмэх"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleToggleFavorite}
                variant="outline"
                size="icon"
                disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                aria-label={
                  addFavoriteMutation.isPending || removeFavoriteMutation.isPending
                    ? 'Хүлээж байна...'
                    : isFavorite
                    ? 'Дуртай жагсаалтаас устгах'
                    : 'Дуртай жагсаалтад нэмэх'
                }
              >
                <Heart
                  fill={isFavorite ? 'red' : 'none'}
                  className={`w-5 h-5 ${isFavorite ? 'text-red-500' : 'text-gray-500'}`}
                  aria-hidden="true"
                />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                size="lg"
                className="flex-1 min-h-[48px] py-3 sm:py-2 px-4 sm:px-6"
                disabled={addToCartMutation.isPending || product.stock === 0}
                aria-label={
                  isInCart
                    ? `${product.name} сагсанд байна`
                    : addToCartMutation.isPending
                    ? 'Сагсанд нэмэж байна...'
                    : `${product.name} сагсанд нэмэх`
                }
              >
                <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>
                  {addToCartMutation.isPending
                    ? 'Нэмэж байна...'
                    : isInCart
                    ? `Сагслагдсан${cartQuantity > 1 ? ` (${cartQuantity})` : ''}`
                    : 'Сагсанд нэмэх'}
                </span>
              </Button>
              <Button
                onClick={handleBuyNow}
                size="lg"
                className="flex-1 min-h-[48px] py-3 sm:py-2 px-4 sm:px-6 transition-transform active:scale-[0.98]"
                disabled={product.stock === 0 || addToCartMutation.isPending || isBuyNowLoading}
                aria-label={isBuyNowLoading ? 'Шилжиж байна' : `${product.name} одоо худалдаж авах`}
                aria-busy={isBuyNowLoading}
              >
                {isBuyNowLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    <span className="animate-pulse">Шилжиж байна...</span>
                  </>
                ) : (
                  'Одоо худалдаж авах'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
