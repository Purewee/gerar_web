"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  User,
  ShoppingBag,
  Heart,
  LogOut,
  MapPin,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import {
  useFavorites,
  useFavoriteRemove,
  useOrders,
  useAddresses,
  useAddressCreate,
  useAddressUpdate,
  useAddressDelete,
  useAddressSetDefault,
  useDistricts,
  useKhoroo,
  authApi,
  type CreateAddressRequest,
} from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import Link from "next/link";
import { OrderCardSkeleton, AddressCardSkeleton, ProductGridSkeleton, Spinner } from "@/components/skeleton";

type MenuItem = "profile" | "orders" | "favorites" | "addresses";

function OrdersContent() {
  const { data: ordersResponse, isLoading, error } = useOrders();
  const orders = ordersResponse?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">
            Миний захиалгууд
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">
            Миний захиалгууд
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-muted-foreground mb-4">
              Алдаа гарлаа. Дахин оролдоно уу.
            </p>
            <Button variant="link" asChild>
              <a href="/">Дэлгүүрт орох</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Миний захиалгууд
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Одоогоор захиалга байхгүй
            </h3>
            <p className="text-muted-foreground mb-6">
              Анхны захиалгаа үүсгэх үү?
            </p>
            <Button variant="outline" asChild className="shadow-sm">
              <a href="/">Дэлгүүрт орох</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
        <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Миний захиалгууд ({orders.length})
        </CardTitle>
        <CardDescription className="mt-2">
          Захиалгын түүхээ харах
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 lg:p-8">
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-primary/30">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Захиалга #{order.id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : order.status === "COMPLETED"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : order.status === "CANCELLED"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <span>📅</span>
                        {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      {order.address && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.address.provinceOrDistrict},{" "}
                          {order.address.khorooOrSoum}
                        </p>
                      )}
                      {order.items && order.items.length > 0 && (
                        <p className="text-sm text-gray-500">
                          {order.items.length} зүйл
                        </p>
                      )}
                    </div>
                    <div className="text-right sm:text-left sm:min-w-[120px]">
                      <p className="text-2xl font-bold text-primary">
                        {parseFloat(order.totalAmount).toLocaleString()}₮
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AddressesContent() {
  const { toast } = useToast();
  const { data: addressesResponse, isLoading, error } = useAddresses();
  const addresses = addressesResponse?.data || [];
  const createAddressMutation = useAddressCreate();
  const updateAddressMutation = useAddressUpdate();
  const deleteAddressMutation = useAddressDelete();
  const setDefaultAddressMutation = useAddressSetDefault();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Districts and khoroo
  const { data: districtsResponse } = useDistricts();
  const districts = Array.isArray(districtsResponse?.data) ? districtsResponse.data : [];
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const { data: khorooResponse, isLoading: khorooLoading } = useKhoroo(selectedDistrict || null);
  const khorooOptions = (khorooResponse?.data && typeof khorooResponse.data === 'object' && 'khorooOptions' in khorooResponse.data && Array.isArray(khorooResponse.data.khorooOptions))
    ? khorooResponse.data.khorooOptions 
    : (Array.isArray(khorooResponse?.data) ? khorooResponse.data : []);
  
  const [formData, setFormData] = useState<CreateAddressRequest>({
    fullName: "",
    phoneNumber: "",
    provinceOrDistrict: "",
    khorooOrSoum: "",
    label: undefined,
    street: undefined,
    neighborhood: undefined,
    residentialComplex: undefined,
    building: undefined,
    entrance: undefined,
    apartmentNumber: undefined,
    addressNote: undefined,
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      phoneNumber: "",
      provinceOrDistrict: "",
      khorooOrSoum: "",
      label: undefined,
      street: undefined,
      neighborhood: undefined,
      residentialComplex: undefined,
      building: undefined,
      entrance: undefined,
      apartmentNumber: undefined,
      addressNote: undefined,
      isDefault: false,
    });
    setSelectedDistrict("");
    setShowAddForm(false);
    setEditingId(null);
  };

  // Reset khoroo when district changes
  useEffect(() => {
    if (selectedDistrict) {
      setFormData(prev => ({ ...prev, khorooOrSoum: "" }));
    } else {
      setFormData(prev => ({ ...prev, provinceOrDistrict: "" }));
    }
  }, [selectedDistrict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAddressMutation.mutateAsync({
          id: editingId,
          data: formData,
        });
        toast({
          title: "Хаяг шинэчлэгдсэн",
          description: "Хаяг амжилттай шинэчлэгдлээ",
        });
      } else {
        await createAddressMutation.mutateAsync(formData);
        toast({
          title: "Хаяг нэмэгдсэн",
          description: "Хаяг амжилттай нэмэгдлээ",
        });
      }
      resetForm();
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Хаяг хадгалахад алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (address: any) => {
    setEditingId(address.id);
    setSelectedDistrict(address.provinceOrDistrict || "");
    setFormData({
      label: address.label || undefined,
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
      provinceOrDistrict: address.provinceOrDistrict,
      khorooOrSoum: address.khorooOrSoum,
      street: address.street || undefined,
      neighborhood: address.neighborhood || undefined,
      residentialComplex: address.residentialComplex || undefined,
      building: address.building || undefined,
      entrance: address.entrance || undefined,
      apartmentNumber: address.apartmentNumber || undefined,
      addressNote: address.addressNote || undefined,
      isDefault: address.isDefault,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Энэ хаягийг устгахдаа итгэлтэй байна уу?")) return;

    try {
      await deleteAddressMutation.mutateAsync(id);
      toast({
        title: "Хаяг устгагдсан",
        description: "Хаяг амжилттай устгагдлаа",
      });
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Хаяг устгахад алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddressMutation.mutateAsync(id);
      toast({
        title: "Үндсэн хаяг шинэчлэгдсэн",
        description: "Үндсэн хаяг амжилттай шинэчлэгдлээ",
      });
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Үндсэн хаяг шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Хаягууд</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <AddressCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Хаягууд</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-muted-foreground mb-4">
              Алдаа гарлаа. Дахин оролдоно уу.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Хаягууд ({addresses.length})
            </CardTitle>
            <CardDescription className="mt-2">
              Хүргэлтийн хаягуудаа удирдах
            </CardDescription>
          </div>
          {!showAddForm && (
            <Button 
              onClick={() => setShowAddForm(true)}
              className="shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Хаяг нэмэх
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 lg:p-8">
        {showAddForm && (
          <Card className="mb-8 border-2 border-primary/20 shadow-lg bg-gradient-to-br from-white to-primary/5">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/10">
              <CardTitle className="text-xl font-bold">
                {editingId ? "Хаяг засах" : "Шинэ хаяг нэмэх"}
              </CardTitle>
              <CardDescription>
                {editingId ? "Хаягийн мэдээллээ шинэчлэнэ үү" : "Хүргэлт хийх хаягаа нэмнэ үү"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Label dropdown at the top */}
                <div>
                  <select
                    id="label"
                    value={formData.label || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Хаягийн шошго сонгох (заавал биш)</option>
                    <option value="Орон сууц">Орон сууц</option>
                    <option value="Оффис">Оффис</option>
                  </select>
                </div>

                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-200">
                    <User className="w-4 h-4" />
                    Хэрэглэгчийн мэдээлэл
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        required
                        placeholder="Бүтэн нэр *"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                    <div>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 8) })
                        }
                        required
                        placeholder="Утасны дугаар *"
                        maxLength={8}
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <select
                        id="provinceOrDistrict"
                        value={selectedDistrict}
                        onChange={(e) => {
                          const district = e.target.value;
                          setSelectedDistrict(district);
                          setFormData({
                            ...formData,
                            provinceOrDistrict: district,
                          });
                        }}
                        required
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Аймаг/Дүүрэг сонгох *</option>
                        {districts.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        id="khorooOrSoum"
                        value={formData.khorooOrSoum}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            khorooOrSoum: e.target.value,
                          })
                        }
                        required
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending || !selectedDistrict || khorooLoading}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">
                          {khorooLoading ? "Ачаалж байна..." : selectedDistrict ? "Хороо/Сум сонгох *" : "Эхлээд дүүрэг сонгоно уу"}
                        </option>
                        {Array.isArray(khorooOptions) && khorooOptions.length > 0 && khorooOptions.map((khoroo) => (
                          <option key={khoroo} value={khoroo}>
                            {khoroo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Input
                        id="street"
                        value={formData.street || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, street: e.target.value })
                        }
                        placeholder="Гудамж (заавал биш)"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                    <div>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            neighborhood: e.target.value,
                          })
                        }
                        placeholder="Хороолол (заавал биш)"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                  </div>
                </div>

                {/* Building Details Section */}
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        id="residentialComplex"
                        value={formData.residentialComplex || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            residentialComplex: e.target.value,
                          })
                        }
                        placeholder="Орон сууцны цогцолбор"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                    <div>
                      <Input
                        id="building"
                        value={formData.building || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, building: e.target.value })
                        }
                        placeholder="Барилга"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                    <div>
                      <Input
                        id="entrance"
                        value={formData.entrance || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, entrance: e.target.value })
                        }
                        placeholder="Орц"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                    <div>
                      <Input
                        id="apartmentNumber"
                        value={formData.apartmentNumber || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            apartmentNumber: e.target.value,
                          })
                        }
                        placeholder="Тоот оруулна уу"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="pt-4">
                  <Textarea
                    id="addressNote"
                    value={formData.addressNote || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        addressNote: e.target.value.slice(0, 500),
                      })
                    }
                    maxLength={500}
                    rows={3}
                    placeholder="Хүргэлттэй холбоотой нэмэлт мэдээлэл. (Жишээ: их дэлгүүрийн хажуу байр, орцны код...)"
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.addressNote?.length || 0}/500 тэмдэгт
                  </p>
                </div>

                {/* Default Address Checkbox */}
                <div className="flex items-center gap-3 pt-2 pb-4 border-t border-gray-200">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault || false}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  />
                  <Label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                    Үндсэн хаяг болгох
                  </Label>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={
                      createAddressMutation.isPending ||
                      updateAddressMutation.isPending
                    }
                    className="flex-1 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {editingId
                      ? updateAddressMutation.isPending
                        ? "Хадгалж байна..."
                        : "Хадгалах"
                      : createAddressMutation.isPending
                      ? "Нэмж байна..."
                      : "Нэмэх"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                    className="shadow-sm"
                  >
                    Цуцлах
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {addresses.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Одоогоор хаяг байхгүй байна
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Захиалга үүсгэхийн тулд хаяг нэмэх шаардлагатай
            </p>
            {!showAddForm && (
              <Button 
                onClick={() => setShowAddForm(true)}
                className="shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Хаяг нэмэх
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card 
                key={address.id}
                className={`transition-all duration-200 hover:shadow-lg ${
                  address.isDefault ? "border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent" : "border border-gray-200"
                }`}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {address.label && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            {address.label}
                          </span>
                        )}
                        {address.isDefault && (
                          <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold shadow-sm">
                            ⭐ Үндсэн
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1 text-lg">{address.fullName}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <span>📞</span>
                          {address.phoneNumber}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {address.provinceOrDistrict}, {address.khorooOrSoum}
                          {address.street && `, ${address.street}`}
                          {address.neighborhood && `, ${address.neighborhood}`}
                          {address.residentialComplex &&
                            `, ${address.residentialComplex}`}
                          {address.building && `, ${address.building}`}
                          {address.entrance && `, ${address.entrance}`}
                          {address.apartmentNumber &&
                            `, ${address.apartmentNumber}`}
                        </p>
                      </div>
                      {address.addressNote && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Тэмдэглэл:</span> {address.addressNote}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                      {!address.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                          disabled={setDefaultAddressMutation.isPending}
                          className="shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          Үндсэн болгох
                        </Button>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(address)}
                          className="shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(address.id)}
                          disabled={deleteAddressMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FavoritesContent() {
  const { toast } = useToast();
  const { data: favoritesResponse, isLoading, error } = useFavorites();
  const favorites = favoritesResponse?.data || [];
  const removeFavoriteMutation = useFavoriteRemove();

  const handleRemoveFavorite = async (productId: number) => {
    try {
      await removeFavoriteMutation.mutateAsync(productId);
      toast({
        title: "Дуртай жагсаалтаас устгагдсан",
        description: "Бараа дуртай жагсаалтаас устгагдлаа",
      });
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Устгахад алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Миний дуртай</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductGridSkeleton count={8} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Миний дуртай
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Алдаа гарлаа
            </h3>
            <p className="text-muted-foreground mb-6">
              Дахин оролдоно уу
            </p>
            <Button variant="outline" asChild className="shadow-sm">
              <a href="/">Дэлгүүрт орох</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Миний дуртай
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Одоогоор дуртай бараа байхгүй
            </h3>
            <p className="text-muted-foreground mb-6">
              Дуртай бараануудаа энд хадгална уу
            </p>
            <Button variant="outline" asChild className="shadow-sm">
              <a href="/">Дэлгүүрт орох</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
        <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Миний дуртай ({favorites.length})
        </CardTitle>
        <CardDescription className="mt-2">
          Дуртай бараануудаа харах
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {favorites.map((product) => {
            const price = parseFloat(product.price);
            const originalPrice = product.originalPrice
              ? parseFloat(product.originalPrice)
              : undefined;
            const imageUrl = product.firstImage || product.images?.[0];

            return (
              <div key={product.id} className="relative group">
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={price}
                  original={originalPrice}
                  imageUrl={imageUrl}
                  icon={!imageUrl ? "📦" : undefined}
                />
                <button
                  onClick={() => handleRemoveFavorite(product.id)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:scale-110 z-10 border border-red-100"
                  disabled={removeFavoriteMutation.isPending}
                  title="Дуртай жагсаалтаас устгах"
                >
                  <Heart className="w-5 h-5 text-red-600 fill-red-600" />
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const [mobile, setMobile] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuItem>("profile");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    const storedMobile = localStorage.getItem("mobile");

    if (auth === "true" && storedMobile) {
      setIsAuthenticated(true);
      setMobile(storedMobile);
      // Load saved profile data
      const savedName = localStorage.getItem("profile_name");
      const savedEmail = localStorage.getItem("profile_email");
      const savedAddress = localStorage.getItem("profile_address");
      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
      if (savedAddress) setAddress(savedAddress);
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  // Handle tab query parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["profile", "orders", "favorites", "addresses"].includes(tab)) {
      setActiveMenu(tab as MenuItem);
    }
  }, [searchParams]);

  const handleSave = () => {
    localStorage.setItem("profile_name", name);
    localStorage.setItem("profile_email", email);
    localStorage.setItem("profile_address", address);
    setEditMode(false);
    toast({
      title: "Профайл шинэчлэгдсэн",
      description: "Таны профайл амжилттай шинэчлэгдлээ!",
    });
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still proceed with logout even if API call fails
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("mobile");
      localStorage.removeItem("profile_name");
      localStorage.removeItem("profile_email");
      localStorage.removeItem("profile_address");
      window.dispatchEvent(new CustomEvent("authStateChanged"));
      router.push("/");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    { id: "profile" as MenuItem, label: "Миний профайл", icon: User },
    { id: "orders" as MenuItem, label: "Миний захиалгууд", icon: ShoppingBag },
    { id: "favorites" as MenuItem, label: "Миний дуртай", icon: Heart },
    { id: "addresses" as MenuItem, label: "Хаягууд", icon: MapPin },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case "profile":
        return (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Миний профайл
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Профайлын мэдээллээ засах
                  </CardDescription>
                </div>
                {!editMode ? (
                  <Button 
                    onClick={() => setEditMode(true)}
                    className="shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Профайл засах
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setEditMode(false);
                        // Reset to saved values
                        const savedName =
                          localStorage.getItem("profile_name") || "";
                        const savedEmail =
                          localStorage.getItem("profile_email") || "";
                        const savedAddress =
                          localStorage.getItem("profile_address") || "";
                        setName(savedName);
                        setEmail(savedEmail);
                        setAddress(savedAddress);
                      }}
                      variant="outline"
                      className="shadow-sm"
                    >
                      Цуцлах
                    </Button>
                    <Button 
                      onClick={handleSave}
                      className="shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Хадгалах
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 lg:p-8">
              <div className="space-y-8">
                {/* Profile Picture */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-100">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                      {name ? (
                        <span className="text-2xl sm:text-3xl font-bold text-primary">
                          {name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      ) : (
                        <span className="text-4xl sm:text-5xl">👤</span>
                      )}
                    </div>
                    {editMode && (
                      <button className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                        Зураг солих
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                      {name || "Хэрэглэгч"}
                    </h3>
                    <p className="text-sm text-gray-600">{email || "Имэйл оруулаагүй"}</p>
                    <p className="text-sm text-gray-500 mt-1">+976 {mobile}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mobile Number (Read-only) */}
                  <div className="md:col-span-2">
                    <Label htmlFor="mobile" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                      Утасны дугаар
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm font-medium">+976</span>
                      </div>
                      <Input
                        id="mobile"
                        type="tel"
                        value={mobile}
                        disabled
                        className="pl-16 bg-gray-50 border-gray-200"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <span>ℹ️</span>
                      Утасны дугаар өөрчлөх боломжгүй
                    </p>
                  </div>

                  {/* Name */}
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                      Бүтэн нэр
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!editMode}
                      placeholder="Бүтэн нэрээ оруулна уу"
                      className={!editMode ? "bg-gray-50" : ""}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                      Имэйл хаяг
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!editMode}
                      placeholder="Имэйл хаягаа оруулна уу"
                      className={!editMode ? "bg-gray-50" : ""}
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <Label htmlFor="address" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                      Хаяг
                    </Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={!editMode}
                      placeholder="Хаягаа оруулна уу"
                      rows={4}
                      className={!editMode ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "orders":
        return <OrdersContent />;

      case "favorites":
        return <FavoritesContent />;

      case "addresses":
        return <AddressesContent />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Left Sidebar Menu */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 lg:p-6">
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
                          activeMenu === item.id
                            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                            : "hover:bg-gray-100/80 text-gray-700 hover:scale-[1.01] hover:shadow-sm"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${activeMenu === item.id ? "text-primary-foreground" : ""}`} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 hover:bg-red-50/80 text-red-600 hover:scale-[1.01] hover:shadow-sm"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Гарах</span>
                    </button>
                  </div>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
