'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, ArrowLeft, Plus, Minus, Heart, Loader2, Coins } from 'lucide-react';
import {
  usePointProduct,
  useCart,
  useCartAdd,
  useFavoriteAdd,
  useFavoriteRemove,
  useFavoriteStatus,
  getAuthToken,
} from '@/lib/api';
import Image from 'next/image';
import { toast } from 'sonner';

export default function GiftProductClient({ productId }: { productId: number }) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isBuyNowLoading, setIsBuyNowLoading] = useState(false);

  const {
    data: productResponse,
    isLoading: loading,
    error: productError,
  } = usePointProduct(isNaN(productId) ? 0 : productId);

  const product = productResponse?.data;

  const { data: cartResponse } = useCart();
  const cartItems = cartResponse?.data || [];
  // Important: check both productId AND isPointProduct: true
  const cartItem = product
    ? cartItems.find(item => item.productId === product.id && item.isPointProduct)
    : null;
  const isInCart = !!cartItem;
  const cartQuantity = cartItem?.quantity ?? 0;

  const { data: statusResponse } = useFavoriteStatus(productId, true);
  const isFavorite = statusResponse?.data?.isFavorited;

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

  if (productError || !product || product.isHidden === true) {
    return (
      <div className="bg-gray-50 flex items-center justify-center min-h-[calc(100vh-525px)]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Бүтээгдэхүүн олдсонгүй</p>
          <Button onClick={() => router.push('/loyalty-store')}>Онооны дэлгүүр лүү буцах</Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity,
        isPointProduct: true,
      });
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
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity,
        isPointProduct: true,
      });
      window.dispatchEvent(new Event('cartUpdated'));
      router.push('/cart'); // Lead to cart to see point total
    } catch (error: any) {
      toast.error('Алдаа гарлаа', {
        description: error.message || 'Сагсанд нэмэхэд алдаа гарлаа',
      });
    } finally {
      setIsBuyNowLoading(false);
    }
  };

  const handleToggleFavorite = async (): Promise<void> => {
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
        await addFavoriteMutation.mutateAsync({ productId: product.id, isPointProduct: true });
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
          className="mb-2 md:mb-6 rounded-lg hover:bg-yellow-50 hover:text-yellow-600 border border-transparent hover:border-yellow-200 transition-all font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Буцах</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="flex flex-col gap-4">
            <Card className=" border border-yellow-100 bg-yellow-50/10">
              <CardContent className="p-0">
                <div className="rounded-lg h-64 sm:h-80 lg:h-96 flex items-center justify-center overflow-hidden relative">
                  {product.images[selectedImage] &&
                  (product.images[selectedImage].startsWith('http') ||
                    product.images[selectedImage].startsWith('/')) ? (
                    <Image
                      src={product.images[selectedImage]}
                      alt={product.name}
                      width={800}
                      height={600}
                      className="w-full h-full object-contain"
                      priority
                    />
                  ) : (
                    <div className="text-8xl sm:text-9xl">
                      {product.images[selectedImage] || '📦'}
                    </div>
                  )}

                  {/* Points Badge Overlay */}
                  <div className="absolute top-4 left-4 bg-yellow-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transform -rotate-1">
                    <Coins className="w-6 h-6" />
                    <span className="text-xl">{product.pointsPrice.toLocaleString()} оноо</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <Button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    variant={selectedImage === idx ? 'default' : 'outline'}
                    size="icon"
                    className={`h-16 sm:h-20 w-16 sm:w-20 shrink-0 border-2 ${
                      selectedImage === idx ? 'border-yellow-500' : 'border-transparent'
                    }`}
                  >
                    {img.startsWith('http') || img.startsWith('/') ? (
                      <Image
                        src={img}
                        alt=""
                        width={80}
                        height={80}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <span className="text-3xl">{img}</span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-700 text-xs font-bold uppercase tracking-wider border border-yellow-500/20 mb-4">
                <Coins className="w-3.5 h-3.5" />
                Онооны бэлэг
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-yellow-600 flex items-baseline gap-1">
                {product.pointsPrice.toLocaleString()}
                <span className="text-lg font-bold uppercase text-yellow-700/60">оноо</span>
              </div>
            </div>

            {product.stock > 0 && (
              <div className="mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-600 font-semibold uppercase tracking-wide">
                  Боломжит үлдэгдэл: {product.stock}
                </span>
              </div>
            )}

            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">
                Бүтээгдэхүүний тайлбар
              </h2>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            <div className="mb-8 flex items-end gap-6 sm:gap-12">
              <div className="flex-1 max-w-[200px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Тоо ширхэг
                </label>
                <div className="flex items-center justify-between bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <Button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 hover:bg-white hover:shadow-sm rounded-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold w-12 text-center text-gray-900">
                    {quantity}
                  </span>
                  <Button
                    onClick={() => setQuantity(quantity + 1)}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 hover:bg-white hover:shadow-sm rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleToggleFavorite}
                variant="outline"
                size="icon"
                className={`h-12 w-12 rounded-xl border-2 transition-all duration-300 ${isFavorite ? 'border-red-200 bg-red-50 shadow-sm' : 'border-gray-200 hover:border-red-200 hover:bg-red-50'}`}
                disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
              >
                <Heart
                  fill={isFavorite ? '#ef4444' : 'none'}
                  className={`w-6 h-6 transition-colors duration-300 ${isFavorite ? 'text-red-500' : 'text-gray-400 group-hover:text-red-500'}`}
                />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full mt-auto">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                size="lg"
                className="flex-1 h-14 rounded-2xl border-2 border-yellow-500 text-yellow-600 font-bold hover:bg-yellow-50 transition-all text-lg"
                disabled={addToCartMutation.isPending || product.stock === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-3" />
                {addToCartMutation.isPending
                  ? 'Нэмж байна...'
                  : isInCart
                    ? `Сагсалсан (${cartQuantity})`
                    : 'Сагсанд нэмэх'}
              </Button>
              <Button
                onClick={handleBuyNow}
                size="lg"
                className="flex-1 h-14 rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-lg shadow-yellow-500/20 transition-all text-lg"
                disabled={product.stock === 0 || addToCartMutation.isPending || isBuyNowLoading}
              >
                {isBuyNowLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Оноогоор авах'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
