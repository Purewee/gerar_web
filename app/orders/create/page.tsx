"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useOrderCreate, useAddresses, useCart } from "@/lib/api";

export default function OrderCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const createOrderMutation = useOrderCreate();
  const { data: addressesResponse, isLoading: addressesLoading } = useAddresses();
  const { data: cartResponse } = useCart();
  const addresses = addressesResponse?.data || [];
  const cartItems = cartResponse?.data || [];

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<"10-14" | "14-18" | "18-21" | "21-00" | "">("");

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      toast({
        title: "Нэвтрэх шаардлагатай",
        description: "Захиалга үүсгэхийн тулд нэвтрэх шаардлагатай",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    // Set default address if available
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, router, toast, selectedAddressId]);

  const handleCreateOrder = async () => {
    if (!selectedAddressId) {
      toast({
        title: "Хаяг сонгоно уу",
        description: "Хүргэлтийн хаяг сонгох шаардлагатай",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Сагс хоосон",
        description: "Захиалга үүсгэхийн тулд сагсанд бүтээгдэхүүн байх ёстой",
        variant: "destructive",
      });
      router.push("/cart");
      return;
    }

    try {
      const response = await createOrderMutation.mutateAsync({
        addressId: selectedAddressId,
        deliveryTimeSlot: deliveryTimeSlot || undefined,
      });

      if (response.data) {
        toast({
          title: "Захиалга үүслээ",
          description: "Захиалга амжилттай үүслээ",
        });
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

  if (addressesLoading) {
    return (
      <div className="min-h-[calc(100vh-525px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Буцах
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Захиалга үүсгэх</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Address Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Хүргэлтийн хаяг сонгох</h3>
              {addresses.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-600 mb-4">Хаяг байхгүй байна</p>
                  <Button onClick={() => router.push("/profile?tab=addresses")}>
                    Хаяг нэмэх
                  </Button>
                </div>
              ) : (
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
                            <p className="font-semibold">{address.fullName}</p>
                            {address.isDefault && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                Үндсэн
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{address.phoneNumber}</p>
                          <p className="text-sm text-gray-600">
                            {address.provinceOrDistrict}, {address.khorooOrSoum}
                            {address.street && `, ${address.street}`}
                            {address.building && `, ${address.building}`}
                            {address.apartmentNumber && `, ${address.apartmentNumber}`}
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
                  <Button
                    variant="outline"
                    onClick={() => router.push("/profile?tab=addresses")}
                    className="w-full"
                  >
                    Шинэ хаяг нэмэх
                  </Button>
                </div>
              )}
            </div>

            {/* Delivery Time Slot */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Хүргэлтийн цаг сонгох</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["10-14", "14-18", "18-21", "21-00"] as const).map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setDeliveryTimeSlot(slot)}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      deliveryTimeSlot === slot
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Order Button */}
            <Button
              onClick={handleCreateOrder}
              disabled={!selectedAddressId || createOrderMutation.isPending}
              className="w-full"
              size="lg"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Захиалга үүсгэж байна...
                </>
              ) : (
                "Захиалга үүсгэх"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

