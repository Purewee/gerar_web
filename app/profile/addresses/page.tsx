'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { User, MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import {
  useAddresses,
  useAddressCreate,
  useAddressUpdate,
  useAddressDelete,
  useAddressSetDefault,
  useDistricts,
  useKhoroo,
  type CreateAddressRequest,
} from '@/lib/api';
import { AddressCardSkeleton } from '@/components/skeleton';

export default function ProfileAddressesPage() {
  const { toast } = useToast();
  const { data: addressesResponse, isLoading, error } = useAddresses();
  const addresses = addressesResponse?.data || [];
  const createAddressMutation = useAddressCreate();
  const updateAddressMutation = useAddressUpdate();
  const deleteAddressMutation = useAddressDelete();
  const setDefaultAddressMutation = useAddressSetDefault();

  const { data: districtsResponse } = useDistricts();
  const districts = Array.isArray(districtsResponse?.data) ? districtsResponse.data : [];
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const { data: khorooResponse, isLoading: khorooLoading } = useKhoroo(selectedDistrict || null);
  const khorooOptions =
    khorooResponse?.data &&
    typeof khorooResponse.data === 'object' &&
    'khorooOptions' in khorooResponse.data &&
    Array.isArray(khorooResponse.data.khorooOptions)
      ? khorooResponse.data.khorooOptions
      : Array.isArray(khorooResponse?.data)
        ? khorooResponse.data
        : [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateAddressRequest>({
    fullName: '',
    phoneNumber: '',
    provinceOrDistrict: '',
    khorooOrSoum: '',
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
      fullName: '',
      phoneNumber: '',
      provinceOrDistrict: '',
      khorooOrSoum: '',
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
    setSelectedDistrict('');
    setShowAddForm(false);
    setEditingId(null);
  };

  const openAddForm = () => {
    const savedName = typeof window !== 'undefined' ? localStorage.getItem('user_name') || '' : '';
    const savedMobile = typeof window !== 'undefined' ? localStorage.getItem('mobile') || '' : '';
    setFormData(prev => ({
      ...prev,
      fullName: savedName,
      phoneNumber: savedMobile.replace(/\D/g, '').slice(0, 8),
    }));
    setShowAddForm(true);
  };

  useEffect(() => {
    if (selectedDistrict) {
      setFormData(prev => ({ ...prev, khorooOrSoum: '' }));
    } else {
      setFormData(prev => ({ ...prev, provinceOrDistrict: '' }));
    }
  }, [selectedDistrict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAddressMutation.mutateAsync({ id: editingId, data: formData });
        toast({ title: 'Хаяг шинэчлэгдсэн', description: 'Хаяг амжилттай шинэчлэгдлээ' });
      } else {
        await createAddressMutation.mutateAsync(formData);
        toast({ title: 'Хаяг нэмэгдсэн', description: 'Хаяг амжилттай нэмэгдлээ' });
      }
      resetForm();
    } catch (err: any) {
      toast({
        title: 'Алдаа гарлаа',
        description: err.message || 'Хаяг хадгалахад алдаа гарлаа',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (address: any) => {
    setEditingId(address.id);
    setSelectedDistrict(address.provinceOrDistrict || '');
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
    if (!confirm('Энэ хаягийг устгахдаа итгэлтэй байна уу?')) return;
    try {
      await deleteAddressMutation.mutateAsync(id);
      toast({ title: 'Хаяг устгагдсан', description: 'Хаяг амжилттай устгагдлаа' });
    } catch (err: any) {
      toast({
        title: 'Алдаа гарлаа',
        description: err.message || 'Хаяг устгахад алдаа гарлаа',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddressMutation.mutateAsync(id);
      toast({ title: 'Үндсэн хаяг шинэчлэгдсэн', description: 'Үндсэн хаяг амжилттай шинэчлэгдлээ' });
    } catch (err: any) {
      toast({
        title: 'Алдаа гарлаа',
        description: err.message || 'Үндсэн хаяг шинэчлэхэд алдаа гарлаа',
        variant: 'destructive',
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
            <p className="text-muted-foreground mb-4">Алдаа гарлаа. Дахин оролдоно уу.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Хаягууд ({addresses.length})
            </CardTitle>
            <CardDescription className="mt-2">Хүргэлтийн хаягуудаа удирдах</CardDescription>
          </div>
          {!showAddForm && (
            <Button
              onClick={openAddForm}
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
          <Card className="mb-8 border-2 border-primary/20 shadow-lg bg-linear-to-br from-white to-primary/5">
            <CardHeader className="bg-linear-to-r from-primary/10 to-transparent border-b border-primary/10">
              <CardTitle className="text-xl font-bold">
                {editingId ? 'Хаяг засах' : 'Шинэ хаяг нэмэх'}
              </CardTitle>
              <CardDescription>
                {editingId ? 'Хаягийн мэдээллээ шинэчлэнэ үү' : 'Хүргэлт хийх хаягаа нэмнэ үү'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <select
                    id="label"
                    value={formData.label || ''}
                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Хаягийн шошго сонгох (заавал биш)</option>
                    <option value="Орон сууц">Орон сууц</option>
                    <option value="Оффис">Оффис</option>
                  </select>
                </div>
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
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        placeholder="Бүтэн нэр *"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                    <div>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                          })
                        }
                        required
                        placeholder="Утасны дугаар *"
                        maxLength={8}
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <select
                        id="provinceOrDistrict"
                        value={selectedDistrict}
                        onChange={e => {
                          const d = e.target.value;
                          setSelectedDistrict(d);
                          setFormData({ ...formData, provinceOrDistrict: d });
                        }}
                        required
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Аймаг/Дүүрэг сонгох *</option>
                        {districts.map(d => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        id="khorooOrSoum"
                        value={formData.khorooOrSoum}
                        onChange={e => setFormData({ ...formData, khorooOrSoum: e.target.value })}
                        required
                        disabled={
                          createAddressMutation.isPending ||
                          updateAddressMutation.isPending ||
                          !selectedDistrict ||
                          khorooLoading
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">
                          {khorooLoading
                            ? 'Ачаалж байна...'
                            : selectedDistrict
                              ? 'Хороо/Сум сонгох *'
                              : 'Эхлээд дүүрэг сонгоно уу'}
                        </option>
                        {Array.isArray(khorooOptions) &&
                          khorooOptions.map(k => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <Input
                        id="street"
                        value={formData.street || ''}
                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                        placeholder="Гудамж (заавал биш)"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                    <div>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood || ''}
                        onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                        placeholder="Хороолол (заавал биш)"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        id="residentialComplex"
                        value={formData.residentialComplex || ''}
                        onChange={e =>
                          setFormData({ ...formData, residentialComplex: e.target.value })
                        }
                        placeholder="Орон сууцны цогцолбор"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                    <div>
                      <Input
                        id="building"
                        value={formData.building || ''}
                        onChange={e => setFormData({ ...formData, building: e.target.value })}
                        placeholder="Барилга"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                    <div>
                      <Input
                        id="entrance"
                        value={formData.entrance || ''}
                        onChange={e => setFormData({ ...formData, entrance: e.target.value })}
                        placeholder="Орц"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                    <div>
                      <Input
                        id="apartmentNumber"
                        value={formData.apartmentNumber || ''}
                        onChange={e => setFormData({ ...formData, apartmentNumber: e.target.value })}
                        placeholder="Тоот оруулна уу"
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Textarea
                    id="addressNote"
                    value={formData.addressNote || ''}
                    onChange={e =>
                      setFormData({ ...formData, addressNote: e.target.value.slice(0, 500) })
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
                <div className="flex items-center gap-3 pt-2 pb-4 border-t border-gray-200">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault || false}
                    onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  />
                  <Label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                    Үндсэн хаяг болгох
                  </Label>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                    className="flex-1 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {editingId
                      ? updateAddressMutation.isPending
                        ? 'Хадгалж байна...'
                        : 'Хадгалах'
                      : createAddressMutation.isPending
                        ? 'Нэмж байна...'
                        : 'Нэмэх'}
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
            <Button
              onClick={openAddForm}
              className="shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Хаяг нэмэх
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card
                key={address.id}
                className={`transition-all duration-200 hover:shadow-lg ${
                  address.isDefault
                    ? 'border-2 border-primary/30 bg-linear-to-br from-primary/5 to-transparent'
                    : 'border border-gray-200'
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
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {address.provinceOrDistrict}, {address.khorooOrSoum}
                          {address.street && `, ${address.street}`}
                          {address.neighborhood && `, ${address.neighborhood}`}
                          {address.residentialComplex && `, ${address.residentialComplex}`}
                          {address.building && `, ${address.building}`}
                          {address.entrance && `, ${address.entrance}`}
                          {address.apartmentNumber && `, ${address.apartmentNumber}`}
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
                          disabled={updateAddressMutation.isPending}
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
