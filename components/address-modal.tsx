"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useAddressCreate, type CreateAddressRequest } from "@/lib/api";
import { X, MapPin } from "lucide-react";

interface AddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddressCreated?: () => void;
}

export function AddressModal({ open, onOpenChange, onAddressCreated }: AddressModalProps) {
  const { toast } = useToast();
  const createAddressMutation = useAddressCreate();
  const [formData, setFormData] = useState<CreateAddressRequest>({
    fullName: "",
    phoneNumber: "",
    provinceOrDistrict: "",
    khorooOrSoum: "",
  });

  const handleClose = () => {
    if (!createAddressMutation.isPending) {
      setFormData({
        fullName: "",
        phoneNumber: "",
        provinceOrDistrict: "",
        khorooOrSoum: "",
      });
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAddressMutation.mutateAsync(formData);
      toast({
        title: "Хаяг нэмэгдсэн",
        description: "Хаяг амжилттай нэмэгдлээ",
      });
      handleClose();
      if (onAddressCreated) {
        onAddressCreated();
      }
    } catch (error: any) {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Хаяг хадгалахад алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-3xl p-0">
        <div className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/90 px-6 pt-8 pb-6">
          <div className="absolute top-4 right-4">
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors rounded-full p-1.5 hover:bg-white/20"
              disabled={createAddressMutation.isPending}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-2">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-white">
                Хаяг нэмэх
              </DialogTitle>
              <DialogDescription className="text-white/90 text-sm">
                Захиалга үүсгэхийн тулд хаяг шаардлагатай
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Бүтэн нэр *
                </label>
                <Input
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  placeholder="Бүтэн нэр"
                  disabled={createAddressMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Утасны дугаар *
                </label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  required
                  placeholder="Утасны дугаар"
                  disabled={createAddressMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Хаягийн нэр (сонголттой)
                </label>
                <Input
                  value={formData.label || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  placeholder="Жишээ: Гэр, Ажлын байр"
                  disabled={createAddressMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Аймаг/Дүүрэг *
                </label>
                <Input
                  value={formData.provinceOrDistrict}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      provinceOrDistrict: e.target.value,
                    })
                  }
                  required
                  placeholder="Аймаг эсвэл дүүрэг"
                  disabled={createAddressMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Хороо/Сум *
                </label>
                <Input
                  value={formData.khorooOrSoum}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      khorooOrSoum: e.target.value,
                    })
                  }
                  required
                  placeholder="Хороо эсвэл сум"
                  disabled={createAddressMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Гудамж (сонголттой)
                </label>
                <Input
                  value={formData.street || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  placeholder="Гудамж"
                  disabled={createAddressMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Хороолол (сонголттой)
                </label>
                <Input
                  value={formData.neighborhood || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      neighborhood: e.target.value,
                    })
                  }
                  placeholder="Хороолол"
                  disabled={createAddressMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Орон сууцны цогцолбор (сонголттой)
                </label>
                <Input
                  value={formData.residentialComplex || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      residentialComplex: e.target.value,
                    })
                  }
                  placeholder="Орон сууцны цогцолбор"
                  disabled={createAddressMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Барилга (сонголттой)
                </label>
                <Input
                  value={formData.building || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, building: e.target.value })
                  }
                  placeholder="Барилга"
                  disabled={createAddressMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Орц (сонголттой)
                </label>
                <Input
                  value={formData.entrance || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, entrance: e.target.value })
                  }
                  placeholder="Орц"
                  disabled={createAddressMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Орон сууцны дугаар (сонголттой)
                </label>
                <Input
                  value={formData.apartmentNumber || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      apartmentNumber: e.target.value,
                    })
                  }
                  placeholder="Орон сууцны дугаар"
                  disabled={createAddressMutation.isPending}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Нэмэлт тэмдэглэл (сонголттой)
              </label>
              <textarea
                value={formData.addressNote || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    addressNote: e.target.value.slice(0, 500),
                  })
                }
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Нэмэлт тэмдэглэл (500 тэмдэгт хүртэл)"
                disabled={createAddressMutation.isPending}
              />
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
                disabled={createAddressMutation.isPending}
              />
              <label htmlFor="isDefault" className="text-sm">
                Үндсэн хаяг болгох
              </label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createAddressMutation.isPending}
              >
                {createAddressMutation.isPending
                  ? "Нэмж байна..."
                  : "Хаяг нэмэх"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createAddressMutation.isPending}
              >
                Цуцлах
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
