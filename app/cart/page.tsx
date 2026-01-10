"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart, useCartUpdate, useCartRemove, useCartClear, useOrderCreate, useAddresses, getAuthToken } from "@/lib/api";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CartPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Fetch cart using hook
  const {
    data: cartResponse,
    isLoading: loading,
    error: cartError,
  } = useCart();
  const cartItems = cartResponse?.data || [];

  const updateCartMutation = useCartUpdate();
  const removeCartMutation = useCartRemove();
  const clearCartMutation = useCartClear();
  const createOrderMutation = useOrderCreate();
  const { data: addressesResponse } = useAddresses();
  const addresses = addressesResponse?.data || [];

  const handleQuantityChange = async (productId: number, delta: number) => {
    const item = cartItems.find((item) => item.productId === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) return;

    try {
      await updateCartMutation.mutateAsync({ productId, quantity: newQuantity });
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Тоо ширхэг шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      await removeCartMutation.mutateAsync(productId);
      window.dispatchEvent(new Event("cartUpdated"));
      toast({
        title: "Зүйл устгагдсан",
        description: "Зүйл таны сагснаас устгагдлаа",
      });
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Зүйл устгахад алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCartMutation.mutateAsync();
      window.dispatchEvent(new Event("cartUpdated"));
      toast({
        title: "Сагс цэвэрлэгдсэн",
        description: "Бүх зүйл сагснаас устгагдлаа",
      });
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Сагс цэвэрлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + parseFloat(item.product?.price || "0") * item.quantity,
    0
  );
  const totalSavings = cartItems.reduce(
    (sum, item) => {
      const price = parseFloat(item.product?.price || "0");
      const originalPrice = item.product?.originalPrice
        ? parseFloat(item.product.originalPrice)
        : 0;
      return sum + (originalPrice > price ? (originalPrice - price) * item.quantity : 0);
    },
    0
  );
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Сагс хоосон",
        description: "Төлбөр төлөхөөс өмнө сагсанд зүйл нэмнэ үү",
      });
      return;
    }

    if (addresses.length === 0) {
      toast({
        title: "Хаяг шаардлагатай",
        description: "Захиалга үүсгэхийн тулд хаяг нэмнэ үү",
        variant: "destructive",
      });
      router.push("/profile");
      return;
    }

    // Use default address or first address
    const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];

    try {
      const response = await createOrderMutation.mutateAsync({
        addressId: defaultAddress.id,
      });
      
      if (response.data) {
        toast({
          title: "Захиалга амжилттай үүслээ",
          description: `Захиалга #${response.data.id} амжилттай үүслээ`,
        });
        window.dispatchEvent(new Event("cartUpdated"));
        router.push(`/orders/${response.data.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Захиалга үүсгэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hidden sm:flex"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Буцах
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">Сагс</h1>
            {totalItems > 0 && (
              <span className="text-sm text-gray-500">
                ({totalItems} {totalItems === 1 ? "зүйл" : "зүйл"})
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Сагс ачаалж байна...</p>
            </div>
          </div>
        ) : cartError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">
                Алдаа гарлаа
              </h2>
              <p className="text-gray-500 mb-6 text-center">
                Сагс ачаалахад алдаа гарлаа. Дахин оролдоно уу.
              </p>
              <Button onClick={() => router.push("/")}>
                Нүүр хуудас руу буцах
              </Button>
            </CardContent>
          </Card>
        ) : !getAuthToken() ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24">
              <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mb-4" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">
                Нэвтрэх шаардлагатай
              </h2>
              <p className="text-gray-500 mb-6 text-center">
                Сагс харахын тулд нэвтэрнэ үү
              </p>
              <Button onClick={() => router.push("/auth/login")}>
                Нэвтрэх
              </Button>
            </CardContent>
          </Card>
        ) : cartItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24">
              <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mb-4" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">
                Таны сагс хоосон байна
              </h2>
              <p className="text-gray-500 mb-6 text-center">
                Сагсанд зүйл нэмэхийн тулд дэлгүүрт орно уу
              </p>
              <Button onClick={() => router.push("/")}>
                Дэлгүүрт үргэлжлүүлэх
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div className="shrink-0">
                        <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.product?.firstImage || item.product?.images?.[0] ? (
                            <Image
                              src={item.product.firstImage || item.product.images[0]}
                              alt={item.product.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-4xl">📦</span>
                          )}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                            {item.product?.name || "Бүтээгдэхүүн"}
                          </h3>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg sm:text-xl font-bold text-gray-900">
                              {parseFloat(item.product?.price || "0").toLocaleString()}₮
                            </span>
                            {item.product?.originalPrice &&
                              parseFloat(item.product.originalPrice) > parseFloat(item.product.price || "0") && (
                                <>
                                  <span className="text-sm text-gray-500 line-through">
                                    {parseFloat(item.product.originalPrice).toLocaleString()}₮
                                  </span>
                                  <span className="text-sm text-green-600 font-semibold">
                                    {(
                                      (parseFloat(item.product.originalPrice) - parseFloat(item.product.price || "0")) *
                                      item.quantity
                                    ).toLocaleString()}
                                    ₮ ХЯМДРАЛТАЙ
                                  </span>
                                </>
                              )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="flex items-center gap-2 border border-gray-300 rounded">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.productId, -1)}
                              disabled={updateCartMutation.isPending}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.productId, 1)}
                              disabled={updateCartMutation.isPending}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveItem(item.productId)}
                            disabled={removeCartMutation.isPending}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Нийт дүн</p>
                        <p className="text-lg font-bold text-gray-900">
                          {(parseFloat(item.product?.price || "0") * item.quantity).toLocaleString()}₮
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Захиалгын хураангуй
                  </h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Дэд дүн</span>
                      <span className="font-semibold">
                        {subtotal.toLocaleString()}₮
                      </span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Нийт хэмнэлт</span>
                        <span className="font-semibold text-green-600">
                          -{totalSavings.toLocaleString()}₮
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Хүргэлтийн төлбөр</span>
                      <span className="font-semibold text-green-600">
                        ҮНЭГҮЙ
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">Нийт</span>
                        <span className="text-xl font-bold text-primary">
                          {subtotal.toLocaleString()}₮
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full mb-3"
                    size="lg"
                    disabled={createOrderMutation.isPending || cartItems.length === 0}
                  >
                    {createOrderMutation.isPending ? "Захиалга үүсгэж байна..." : "Төлбөр төлөх"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="w-full mb-3"
                  >
                    Дэлгүүрт үргэлжлүүлэх
                  </Button>

                  {cartItems.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleClearCart}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={clearCartMutation.isPending}
                    >
                      {clearCartMutation.isPending ? "Цэвэрлэж байна..." : "Сагс цэвэрлэх"}
                    </Button>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <svg
                        className="w-5 h-5 text-green-600 mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Аюулгүй төлбөр
                        </p>
                        <p className="text-xs mt-1">
                          Хялбар буцаах • 100% Жинхэнэ бүтээгдэхүүн
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
