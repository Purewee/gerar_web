"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  Check,
  Loader2,
  MapPin,
  User,
  CreditCard,
} from "lucide-react";
import { useOrder, useAddresses, useAddressUpdate } from "@/lib/api";
import Image from "next/image";

type Step = "location" | "profile" | "payment";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = parseInt(params.id as string);
  const [currentStep, setCurrentStep] = useState<Step>("location");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "">("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const {
    data: orderResponse,
    isLoading,
    error,
  } = useOrder(isNaN(orderId) ? 0 : orderId);
  const order = orderResponse?.data;

  const { data: addressesResponse } = useAddresses();
  const addresses = addressesResponse?.data || [];
  const updateAddressMutation = useAddressUpdate();

  useEffect(() => {
    if (order) {
      // Set initial address if order has one
      if (order.addressId && !selectedAddressId) {
        setSelectedAddressId(order.addressId);
      }
      // Load profile info from localStorage
      const storedName =
        localStorage.getItem("user_name") ||
        localStorage.getItem("profile_name") ||
        "";
      const storedPhone = localStorage.getItem("mobile") || "";
      setProfileName(storedName);
      setProfilePhone(storedPhone);
    }
  }, [order, selectedAddressId]);

  // Determine current step based on order status and completion
  useEffect(() => {
    if (!order) return;

    if (order.status !== "PENDING") {
      // Order is completed or cancelled, show details only
      return;
    }

    // Check what step we should be on
    if (!order.addressId) {
      setCurrentStep("location");
    } else if (!profileName || !profilePhone) {
      setCurrentStep("profile");
    } else {
      setCurrentStep("payment");
    }
  }, [order, profileName, profilePhone]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-525px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Захиалга ачаалж байна...</p>
        </div>
      </div>
    );
  }

  const handleLocationNext = () => {
    if (!selectedAddressId) {
      toast({
        title: "Хаяг сонгоно уу",
        description: "Хүргэлтийн хаяг сонгох шаардлагатай",
        variant: "destructive",
      });
      return;
    }

    // Update order address if different
    if (order && order.addressId !== selectedAddressId) {
      // In a real app, you'd update the order's address here
      // For now, we'll just proceed to next step
    }

    setCurrentStep("profile");
  };

  const handleProfileNext = () => {
    if (!profileName.trim() || !profilePhone.trim()) {
      toast({
        title: "Мэдээлэл дутуу",
        description: "Нэр болон утасны дугаар оруулах шаардлагатай",
        variant: "destructive",
      });
      return;
    }

    // Save profile info to localStorage
    localStorage.setItem("user_name", profileName);
    localStorage.setItem("profile_name", profileName);
    localStorage.setItem("mobile", profilePhone);

    setCurrentStep("payment");
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast({
        title: "Төлбөрийн арга сонгоно уу",
        description: "Төлбөрийн арга сонгох шаардлагатай",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      toast({
        title: "Төлбөр амжилттай",
        description: "Таны захиалга амжилттай баталгаажлаа",
      });
      // Route to order list
      router.push("/profile?tab=orders");
    }, 2000);
  };

  if (error || !order) {
    return (
      <div className="min-h-[calc(100vh-525px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Захиалга олдсонгүй</p>
          <Button onClick={() => router.push("/profile")}>
            Профайл руу буцах
          </Button>
        </div>
      </div>
    );
  }

  // If order is not pending, show read-only view
  if (order.status !== "PENDING") {
    return (
      <div className="h-full bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Буцах
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl sm:text-3xl">
                  Захиалга #{order.id}
                </CardTitle>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : order.status === "COMPLETED"
                      ? "bg-green-100 text-green-800"
                      : order.status === "CANCELLED"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Захиалгын огноо</p>
                  <p className="font-semibold">
                    {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {order.deliveryTimeSlot && (
                  <div>
                    <p className="text-sm text-gray-600">Хүргэлтийн цаг</p>
                    <p className="font-semibold">{order.deliveryTimeSlot}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {order.address && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Хүргэлтийн хаяг</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">{order.address.fullName}</p>
                  <p className="text-gray-600">{order.address.phoneNumber}</p>
                  <p className="text-gray-600">
                    {order.address.provinceOrDistrict},{" "}
                    {order.address.khorooOrSoum}
                    {order.address.street && `, ${order.address.street}`}
                    {order.address.building && `, ${order.address.building}`}
                    {order.address.apartmentNumber &&
                      `, ${order.address.apartmentNumber}`}
                  </p>
                  {order.address.addressNote && (
                    <p className="text-sm text-gray-500 mt-2">
                      Тэмдэглэл: {order.address.addressNote}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Захиалгын дэлгэрэнгүй</CardTitle>
            </CardHeader>
            <CardContent>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b border-gray-200 last:border-0"
                    >
                      {item.product?.firstImage || item.product?.images?.[0] ? (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={
                              item.product.firstImage || item.product.images[0]
                            }
                            alt={item.product.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-2xl">📦</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          {item.product?.name || "Бүтээгдэхүүн"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Тоо ширхэг: {item.quantity}
                        </p>
                        <p className="font-semibold text-lg">
                          {parseFloat(item.price).toLocaleString()}₮
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {(
                            parseFloat(item.price) * item.quantity
                          ).toLocaleString()}
                          ₮
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Дэлгэрэнгүй мэдээлэл байхгүй</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold">Нийт дүн</span>
                <span className="text-2xl font-bold text-primary">
                  {parseFloat(order.totalAmount).toLocaleString()}₮
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Multi-step flow for pending orders
  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Буцах
        </Button>

        {/* Order Status */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl sm:text-3xl">
                Захиалга #{order.id}
              </CardTitle>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                PENDING
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Step Indicator */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep === "location"
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep !== "location" && selectedAddressId ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">Хаяг</p>
                  <p className="text-xs text-gray-500">Хүргэлтийн хаяг</p>
                </div>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep === "profile"
                      ? "bg-primary text-white"
                      : currentStep === "payment"
                      ? "bg-gray-200 text-gray-600"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep === "payment" && profileName ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">Профайл</p>
                  <p className="text-xs text-gray-500">Хувийн мэдээлэл</p>
                </div>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep === "payment"
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Төлбөр</p>
                  <p className="text-xs text-gray-500">Төлбөр төлөх</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === "location" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Хүргэлтийн хаяг сонгох
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-600 mb-4">Хаяг байхгүй байна</p>
                  <Button onClick={() => router.push("/profile?tab=addresses")}>
                    Хаяг нэмэх
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold">
                                {address.fullName}
                              </p>
                              {address.isDefault && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  Үндсэн
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {address.phoneNumber}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.provinceOrDistrict},{" "}
                              {address.khorooOrSoum}
                              {address.street && `, ${address.street}`}
                              {address.building && `, ${address.building}`}
                              {address.apartmentNumber &&
                                `, ${address.apartmentNumber}`}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedAddressId === address.id
                                ? "border-primary bg-primary"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedAddressId === address.id && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/profile?tab=addresses")}
                    className="w-full"
                  >
                    Шинэ хаяг нэмэх
                  </Button>
                  <Button
                    onClick={handleLocationNext}
                    className="w-full"
                    size="lg"
                  >
                    Үргэлжлүүлэх
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === "profile" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Профайл мэдээлэл
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Нэр</label>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Таны нэр"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Утасны дугаар
                </label>
                <Input
                  value={profilePhone}
                  onChange={(e) =>
                    setProfilePhone(
                      e.target.value.replace(/\D/g, "").slice(0, 8)
                    )
                  }
                  placeholder="8 оронтой утасны дугаар"
                  maxLength={8}
                />
              </div>
              <Button onClick={handleProfileNext} className="w-full" size="lg">
                Үргэлжлүүлэх
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === "payment" && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Төлбөр төлөх
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CreditCard className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">Карт</p>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      paymentMethod === "cash"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl mb-2 block">💵</span>
                    <p className="font-semibold">Бэлэн мөнгө</p>
                  </button>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Нийт дүн</span>
                      <span className="text-2xl font-bold text-primary">
                        {parseFloat(order.totalAmount).toLocaleString()}₮
                      </span>
                    </div>
                    <Button
                      onClick={handlePayment}
                      disabled={!paymentMethod || isProcessingPayment}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Төлбөр боловсруулж байна...
                        </>
                      ) : (
                        "Төлбөр төлөх"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Захиалгын дэлгэрэнгүй</CardTitle>
              </CardHeader>
              <CardContent>
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 pb-4 border-b border-gray-200 last:border-0"
                      >
                        {item.product?.firstImage ||
                        item.product?.images?.[0] ? (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <Image
                              src={
                                item.product.firstImage ||
                                item.product.images[0]
                              }
                              alt={item.product.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-2xl">📦</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">
                            {item.product?.name || "Бүтээгдэхүүн"}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Тоо ширхэг: {item.quantity}
                          </p>
                          <p className="font-semibold text-lg">
                            {parseFloat(item.price).toLocaleString()}₮
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {(
                              parseFloat(item.price) * item.quantity
                            ).toLocaleString()}
                            ₮
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Дэлгэрэнгүй мэдээлэл байхгүй</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
