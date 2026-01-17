"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { X, MapPin, User } from "lucide-react";

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

  const handleClose = () => {
    if (!createAddressMutation.isPending) {
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-200">
                <User className="w-4 h-4" />
                Үндсэн мэдээлэл
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modal-fullName" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                    Бүтэн нэр *
                  </Label>
                  <Input
                    id="modal-fullName"
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
                  <Label htmlFor="modal-phoneNumber" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                    Утасны дугаар *
                  </Label>
                  <Input
                    id="modal-phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    required
                    placeholder="Утасны дугаар"
                    disabled={createAddressMutation.isPending}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="modal-label" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                    Хаягийн нэр <span className="text-gray-400 font-normal">(сонголттой)</span>
                  </Label>
                  <Input
                    id="modal-label"
                    value={formData.label || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    placeholder="Жишээ: Гэр, Ажлын байр"
                    disabled={createAddressMutation.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-200">
                <MapPin className="w-4 h-4" />
                Байршил
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modal-provinceOrDistrict" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                    Аймаг/Дүүрэг *
                  </Label>
                  <Input
                    id="modal-provinceOrDistrict"
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
                  <Label htmlFor="modal-khorooOrSoum" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                    Хороо/Сум *
                  </Label>
                  <Input
                    id="modal-khorooOrSoum"
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
                  <Label htmlFor="modal-street" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                    Гудамж <span className="text-gray-400 font-normal">(сонголттой)</span>
                  </Label>
                  <Input
                    id="modal-street"
                    value={formData.street || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, street: e.target.value })
                    }
                    placeholder="Гудамж"
                    disabled={createAddressMutation.isPending}
                  />
                </div>
                <div>
                  <Label htmlFor="modal-neighborhood" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                    Хороолол <span className="text-gray-400 font-normal">(сонголттой)</span>
                  </Label>
                  <Input
                    id="modal-neighborhood"
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
              </div>
            </div>

            {/* Building Details Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-200">
                Барилгын мэдээлэл <span className="text-gray-400 font-normal text-xs normal-case">(сонголттой)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modal-residentialComplex" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                    Орон сууцны цогцолбор
                  </Label>
                  <Input
                    id="modal-residentialComplex"
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
                  <Label htmlFor="modal-building" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                    Барилга
                  </Label>
                  <Input
                    id="modal-building"
                    value={formData.building || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, building: e.target.value })
                    }
                    placeholder="Барилга"
                    disabled={createAddressMutation.isPending}
                  />
                </div>
                <div>
                  <Label htmlFor="modal-entrance" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                    Орц
                  </Label>
                  <Input
                    id="modal-entrance"
                    value={formData.entrance || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, entrance: e.target.value })
                    }
                    placeholder="Орц"
                    disabled={createAddressMutation.isPending}
                  />
                </div>
                <div>
                  <Label htmlFor="modal-apartmentNumber" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                    Орон сууцны дугаар
                  </Label>
                  <Input
                    id="modal-apartmentNumber"
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
            </div>

            {/* Additional Notes */}
            <div className="pt-4">
              <Label htmlFor="modal-addressNote" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                Нэмэлт тэмдэглэл <span className="text-gray-400 font-normal">(сонголттой)</span>
              </Label>
              <Textarea
                id="modal-addressNote"
                value={formData.addressNote || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    addressNote: e.target.value.slice(0, 500),
                  })
                }
                maxLength={500}
                rows={3}
                placeholder="Нэмэлт тэмдэглэл (500 тэмдэгт хүртэл)"
                disabled={createAddressMutation.isPending}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.addressNote?.length || 0}/500 тэмдэгт
              </p>
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center gap-3 pt-2 pb-4 border-t border-gray-200">
              <Checkbox
                id="modal-isDefault"
                checked={formData.isDefault || false}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                disabled={createAddressMutation.isPending}
              />
              <Label htmlFor="modal-isDefault" className="text-sm font-medium cursor-pointer">
                Үндсэн хаяг болгох
              </Label>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                className="flex-1 shadow-md hover:shadow-lg transition-all duration-200"
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
                className="shadow-sm"
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
