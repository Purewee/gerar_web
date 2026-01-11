"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  type CreateAddressRequest,
  type Address,
} from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import Link from "next/link";

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
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Ачааллаж байна...</p>
            </div>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">
            Миний захиалгууд
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground mb-4">
              Одоогоор захиалга байхгүй
            </p>
            <Button variant="link" asChild>
              <a href="/">Дэлгүүрт орох</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl">
          Миний захиалгууд ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          Захиалга #{order.id}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
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
                      <p className="text-sm text-gray-600 mb-1">
                        {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      {order.address && (
                        <p className="text-sm text-gray-500">
                          {[
                            order.address.provinceOrDistrict,
                            order.address.khorooOrSoum,
                            order.address.street,
                            order.address.neighborhood,
                            order.address.residentialComplex,
                            order.address.building,
                            order.address.entrance,
                            order.address.apartmentNumber,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {order.items && order.items.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {order.items.length} зүйл
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
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
  const [formData, setFormData] = useState<CreateAddressRequest>({
    label: null,
    provinceOrDistrict: "",
    khorooOrSoum: "",
    street: "",
    neighborhood: null,
    residentialComplex: null,
    building: null,
    entrance: null,
    apartmentNumber: null,
    addressNote: null,
  });

  const resetForm = () => {
    setFormData({
      label: null,
      provinceOrDistrict: "",
      khorooOrSoum: "",
      street: "",
      neighborhood: null,
      residentialComplex: null,
      building: null,
      entrance: null,
      apartmentNumber: null,
      addressNote: null,
    });
    setShowAddForm(false);
    setEditingId(null);
  };

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

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setFormData({
      label: address.label || null,
      provinceOrDistrict: address.provinceOrDistrict || "",
      khorooOrSoum: address.khorooOrSoum || "",
      street: address.street || "",
      neighborhood: address.neighborhood || null,
      residentialComplex: address.residentialComplex || null,
      building: address.building || null,
      entrance: address.entrance || null,
      apartmentNumber: address.apartmentNumber || null,
      addressNote: address.addressNote || null,
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
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Ачааллаж байна...</p>
            </div>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl sm:text-3xl">
            Хаягууд ({addresses.length})
          </CardTitle>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Хаяг нэмэх
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingId ? "Хаяг засах" : "Шинэ хаяг нэмэх"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Аймаг/Дүүрэг *
                    </label>
                    <Input
                      value={formData.provinceOrDistrict || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          provinceOrDistrict: e.target.value,
                        })
                      }
                      required
                      minLength={2}
                      placeholder="Аймаг эсвэл дүүрэг"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Хороо/Сум *
                    </label>
                    <Input
                      value={formData.khorooOrSoum || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          khorooOrSoum: e.target.value,
                        })
                      }
                      required
                      minLength={2}
                      placeholder="Хороо эсвэл сум"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Гудамж *
                    </label>
                    <Input
                      value={formData.street || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, street: e.target.value })
                      }
                      required
                      placeholder="Гудамж"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Хороолол
                    </label>
                    <Input
                      value={formData.neighborhood || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          neighborhood: e.target.value || null,
                        })
                      }
                      placeholder="Хороолол"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Орон сууцны цогцолбор
                    </label>
                    <Input
                      value={formData.residentialComplex || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          residentialComplex: e.target.value || null,
                        })
                      }
                      placeholder="Орон сууцны цогцолбор"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Барилга
                    </label>
                    <Input
                      value={formData.building || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          building: e.target.value || null,
                        })
                      }
                      placeholder="Барилга"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Орц
                    </label>
                    <Input
                      value={formData.entrance || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          entrance: e.target.value || null,
                        })
                      }
                      placeholder="Орц"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Хаалганы дугаар
                    </label>
                    <Input
                      value={formData.apartmentNumber || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          apartmentNumber: e.target.value || null,
                        })
                      }
                      placeholder="Хаалганы дугаар"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Хаягийн тэмдэглэл
                    </label>
                    <Input
                      value={formData.addressNote || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressNote: e.target.value || null,
                        })
                      }
                      placeholder="Хаягийн тэмдэглэл"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Хаягийн нэр (Label)
                    </label>
                    <Input
                      value={formData.label || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          label: e.target.value || null,
                        })
                      }
                      placeholder="Жишээ: Гэрийн хаяг, Ажлын хаяг"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault || false}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="isDefault" className="text-sm">
                    Үндсэн хаяг болгох
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={
                      createAddressMutation.isPending ||
                      updateAddressMutation.isPending
                    }
                  >
                    {editingId
                      ? updateAddressMutation.isPending
                        ? "Хадгалж байна..."
                        : "Хадгалах"
                      : createAddressMutation.isPending
                      ? "Нэмж байна..."
                      : "Нэмэх"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Цуцлах
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground mb-4">
              Одоогоор хаяг байхгүй байна
            </p>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Хаяг нэмэх
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card key={address.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {address.isDefault && (
                          <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm font-medium">
                            Үндсэн
                          </span>
                        )}
                      </div>
                      {address.label && (
                        <p className="font-semibold text-base mb-1">
                          {address.label}
                        </p>
                      )}
                      <p className="text-sm text-gray-700">
                        {[
                          address.provinceOrDistrict,
                          address.khorooOrSoum,
                          address.street,
                          address.neighborhood,
                          address.residentialComplex,
                          address.building,
                          address.entrance,
                          address.apartmentNumber,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {address.addressNote && (
                        <p className="text-xs text-gray-500 mt-1">
                          Тэмдэглэл: {address.addressNote}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!address.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                          disabled={setDefaultAddressMutation.isPending}
                        >
                          Үндсэн болгох
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(address)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        disabled={deleteAddressMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Ачааллаж байна...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Миний дуртай</CardTitle>
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

  if (favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Миний дуртай</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground mb-4">
              Одоогоор дуртай бараа байхгүй
            </p>
            <Button variant="link" asChild>
              <a href="/">Дэлгүүрт орох</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl">
          Миний дуртай ({favorites.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                  originalPrice={originalPrice}
                  imageUrl={imageUrl}
                  icon={!imageUrl ? "📦" : undefined}
                />
                <button
                  onClick={() => handleRemoveFavorite(product.id)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  disabled={removeFavoriteMutation.isPending}
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

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("mobile");
    localStorage.removeItem("profile_name");
    localStorage.removeItem("profile_email");
    localStorage.removeItem("profile_address");
    // Dispatch custom event for instant navigation update
    window.dispatchEvent(new CustomEvent("authStateChanged"));
    router.push("/");
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl sm:text-3xl">
                  Миний профайл
                </CardTitle>
                {!editMode ? (
                  <Button onClick={() => setEditMode(true)}>
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
                    >
                      Цуцлах
                    </Button>
                    <Button onClick={handleSave}>Хадгалах</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl">👤</span>
                  </div>
                  {editMode && (
                    <button className="text-primary hover:underline text-sm sm:text-base">
                      Зураг солих
                    </button>
                  )}
                </div>

                {/* Mobile Number (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Утасны дугаар
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">+976</span>
                    </div>
                    <Input
                      type="tel"
                      value={mobile}
                      disabled
                      className="pl-12"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Утасны дугаар өөрчлөх боломжгүй
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Бүтэн нэр
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!editMode}
                    placeholder="Бүтэн нэрээ оруулна уу"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имэйл хаяг
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!editMode}
                    placeholder="Имэйл хаягаа оруулна уу"
                  />
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
    <div className="h-full bg-gray-50">
      <div className="min-h-[calc(100vh-525px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar Menu */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activeMenu === item.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-red-50 text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Гарах</span>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
