'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, User, LogOut, MapPin, ChevronRight } from 'lucide-react';
import {
  useOrderCreate,
  useAddresses,
  useAddressCreate,
  useCart,
  getAuthToken,
  GuestAddress,
  useDistricts,
  useKhoroo,
  authApi,
  type CreateAddressRequest,
} from '@/lib/api';
import Image from 'next/image';
import { toast } from 'sonner';

export default function OrderCreatePage() {
  const router = useRouter();
  const createOrderMutation = useOrderCreate();
  const createAddressMutation = useAddressCreate();
  const {
    data: addressesResponse,
    isLoading: addressesLoading,
    refetch: refetchAddresses,
  } = useAddresses();
  const { data: cartResponse } = useCart();
  const addresses = addressesResponse?.data || [];
  const cartItems = cartResponse?.data || [];

  const isAuthenticated = !!getAuthToken();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<
    '10-14' | '14-18' | '18-21' | '21-00' | ''
  >('');
  const [receiveByOrganization, setReceiveByOrganization] = useState(false);
  const [promotionalInfo, setPromotionalInfo] = useState(false);

  // Districts and khoroo
  const { data: districtsResponse } = useDistricts();
  const districts = Array.isArray(districtsResponse?.data) ? districtsResponse.data : [];
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const {
    data: khorooResponse,
    isLoading: khorooLoading,
    error: khorooError,
  } = useKhoroo(selectedDistrict || null);
  // API returns { data: { district: string, khorooOptions: string[] } }
  const khorooOptions =
    khorooResponse?.data &&
    typeof khorooResponse.data === 'object' &&
    'khorooOptions' in khorooResponse.data &&
    Array.isArray(khorooResponse.data.khorooOptions)
      ? khorooResponse.data.khorooOptions
      : Array.isArray(khorooResponse?.data)
      ? khorooResponse.data
      : [];

  // Debug: Log khoroo response
  useEffect(() => {
    if (selectedDistrict) {
      console.log('Selected district:', selectedDistrict);
      console.log('Khoroo response:', khorooResponse);
      console.log('Khoroo options:', khorooOptions);
      console.log('Khoroo loading:', khorooLoading);
      console.log('Khoroo error:', khorooError);
      if (khorooError) {
        console.error('Khoroo API Error:', khorooError);
      }
    }
  }, [selectedDistrict, khorooResponse, khorooOptions, khorooLoading, khorooError]);

  // Address form state for authenticated users without addresses
  const [newAddress, setNewAddress] = useState<CreateAddressRequest>({
    fullName: '',
    phoneNumber: '',
    provinceOrDistrict: '',
    khorooOrSoum: '',
  });

  // Guest address form state
  const [guestAddress, setGuestAddress] = useState<GuestAddress>({
    fullName: '',
    phoneNumber: '',
    provinceOrDistrict: '',
    khorooOrSoum: '',
    street: '',
    neighborhood: '',
    residentialComplex: '',
    building: '',
    entrance: '',
    apartmentNumber: '',
    addressNote: '',
    label: '',
  });

  // Load user info from localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const name = localStorage.getItem('user_name') || localStorage.getItem('profile_name') || '';
      const email = localStorage.getItem('profile_email') || '';
      const phone = localStorage.getItem('mobile') || '';
      setUserName(name);
      setUserEmail(email);
      setUserPhone(phone);

      // Pre-fill address form with user info
      if (addresses.length === 0) {
        setNewAddress(prev => ({
          ...prev,
          fullName: name,
          phoneNumber: phone,
        }));
      }
    } else {
      // For guest users, try to get phone from localStorage if available
      const phone = localStorage.getItem('mobile') || '';
      setUserPhone(phone);
      if (phone) {
        setGuestAddress(prev => ({
          ...prev,
          phoneNumber: phone,
        }));
      }
    }
  }, [isAuthenticated, addresses.length]);

  // Reset khoroo when district changes
  useEffect(() => {
    if (selectedDistrict) {
      setNewAddress(prev => ({ ...prev, khorooOrSoum: '' }));
      setGuestAddress(prev => ({ ...prev, khorooOrSoum: '' }));
    } else {
      setNewAddress(prev => ({ ...prev, provinceOrDistrict: '' }));
      setGuestAddress(prev => ({ ...prev, provinceOrDistrict: '' }));
    }
  }, [selectedDistrict]);

  useEffect(() => {
    // Set default address if available (for authenticated users)
    if (isAuthenticated && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, router, selectedAddressId, isAuthenticated, cartItems.length]);

  const validateAddress = (address: {
    fullName: string;
    phoneNumber: string;
    provinceOrDistrict: string;
    khorooOrSoum: string;
  }): boolean => {
    if (!address.fullName.trim()) {
      toast.warning('Бүтэн нэр оруулна уу');
      return false;
    }
    if (!address.phoneNumber || address.phoneNumber.length !== 8) {
      toast.warning('8 оронтой утасны дугаар оруулна уу');
      return false;
    }
    if (!address.provinceOrDistrict.trim()) {
      toast.warning('Аймаг/Дүүрэг оруулна уу');
      return false;
    }
    if (!address.khorooOrSoum.trim()) {
      toast.warning('Хороо/Сум оруулна уу');
      return false;
    }
    return true;
  };

  const handleCreateOrder = async () => {
    if (cartItems.length === 0) {
      toast.warning('Сагс хоосон', {
        description: 'Захиалга үүсгэхийн тулд сагсанд бүтээгдэхүүн байх ёстой',
      });
      router.push('/cart');
      return;
    }

    if (isAuthenticated) {
      // Authenticated user flow
      let addressIdToUse = selectedAddressId;

      // If no address selected and user has no addresses, create one from form
      if (!selectedAddressId && addresses.length === 0) {
        if (!validateAddress(newAddress)) {
          return;
        }

        try {
          // Create address first
          const addressResponse = await createAddressMutation.mutateAsync(newAddress);
          if (addressResponse.data) {
            addressIdToUse = addressResponse.data.id;
            // Refetch addresses to update the list
            await refetchAddresses();
          }
        } catch (error: any) {
          toast.error(error.message || 'Хаяг үүсгэхэд алдаа гарлаа');
          return;
        }
      }

      if (!addressIdToUse) {
        toast.warning('Хүргэлтийн хаяг сонгоно уу');
        return;
      }

      try {
        const response = await createOrderMutation.mutateAsync({
          addressId: addressIdToUse,
          deliveryTimeSlot: deliveryTimeSlot || undefined,
        });

        if (response.data) {
          toast.success('Захиалга үүслээ');
          router.push(`/orders/${response.data.id}`);
        }
      } catch (error: any) {
        toast.error(error.message || 'Захиалга үүсгэхэд алдаа гарлаа');
      }
    } else {
      // Guest user flow
      if (!validateAddress(guestAddress)) {
        return;
      }

      try {
        const response = await createOrderMutation.mutateAsync({
          address: {
            fullName: guestAddress.fullName.trim(),
            phoneNumber: guestAddress.phoneNumber.trim(),
            provinceOrDistrict: guestAddress.provinceOrDistrict.trim(),
            khorooOrSoum: guestAddress.khorooOrSoum.trim(),
            street: guestAddress.street?.trim() || undefined,
            neighborhood: guestAddress.neighborhood?.trim() || undefined,
            residentialComplex: guestAddress.residentialComplex?.trim() || undefined,
            building: guestAddress.building?.trim() || undefined,
            entrance: guestAddress.entrance?.trim() || undefined,
            apartmentNumber: guestAddress.apartmentNumber?.trim() || undefined,
            addressNote: guestAddress.addressNote?.trim() || undefined,
            label: guestAddress.label?.trim() || undefined,
          },
          deliveryTimeSlot: deliveryTimeSlot || undefined,
        });

        if (response.data) {
          toast.success('Захиалга үүслээ');
          router.push(`/orders/${response.data.id}`);
        }
      } catch (error: any) {
        toast.error(error.message || 'Захиалга үүсгэхэд алдаа гарлаа');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Still proceed with logout even if API call fails
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('mobile');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_email');
      localStorage.removeItem('token');
      window.location.href = '/';
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product?.price || '0') * item.quantity,
    0,
  );
  const deliveryFee = 6000;
  const walletBalance = 0;
  const total = subtotal + deliveryFee - walletBalance;

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

  if (isAuthenticated && addressesLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6  py-6">
        {/* Breadcrumbs */}
        <div className="mb-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <a href="/" className="hover:text-primary">
              Нүүр хуудас
            </a>
            <ChevronRight className="w-4 h-4" />
            <a href="/cart" className="hover:text-primary">
              Сагс
            </a>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">Холбоо барих мэдээлэл</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact and Delivery Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information Section */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Холбоо барих мэдээлэл</h2>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{userName || 'Хэрэглэгч'}</p>
                      {userEmail && <p className="text-sm text-gray-600">{userEmail}</p>}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Гарах
                  </button>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="promotional"
                      checked={promotionalInfo}
                      onChange={e => setPromotionalInfo(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="promotional" className="text-sm text-gray-700">
                      Урамшууллын мэдээллийг цаг алдалгүй авах
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      value={guestAddress.fullName}
                      onChange={e => setGuestAddress({ ...guestAddress, fullName: e.target.value })}
                      placeholder="Нэр"
                      required
                    />
                    <Input
                      value={guestAddress.phoneNumber}
                      onChange={e =>
                        setGuestAddress({
                          ...guestAddress,
                          phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                        })
                      }
                      placeholder={userPhone || 'Утасны дугаар'}
                      maxLength={8}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="promotional"
                      checked={promotionalInfo}
                      onChange={e => setPromotionalInfo(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="promotional" className="text-sm text-gray-700">
                      Урамшууллын мэдээллийг цаг алдалгүй авах
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Address Information Section */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Хүргэлт хүлээн авах мэдээлэл</h2>

              {isAuthenticated ? (
                addresses.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <select
                        id="addressSelect"
                        value={selectedAddressId?.toString() || ''}
                        onChange={e =>
                          setSelectedAddressId(e.target.value ? parseInt(e.target.value) : null)
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Хаяг сонгох</option>
                        {addresses.map(address => (
                          <option key={address.id} value={address.id.toString()}>
                            {address.label ||
                              `${address.provinceOrDistrict}, ${address.khorooOrSoum}`}
                            {address.isDefault && ' (Үндсэн)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedAddress && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-medium mb-1">{selectedAddress.fullName}</p>
                        <p className="text-sm text-gray-600 mb-1">{selectedAddress.phoneNumber}</p>
                        <p className="text-sm text-gray-700">
                          {selectedAddress.provinceOrDistrict}, {selectedAddress.khorooOrSoum}
                          {selectedAddress.street && `, ${selectedAddress.street}`}
                          {selectedAddress.neighborhood && `, ${selectedAddress.neighborhood}`}
                          {selectedAddress.residentialComplex &&
                            `, ${selectedAddress.residentialComplex}`}
                          {selectedAddress.building && `, ${selectedAddress.building}`}
                          {selectedAddress.entrance && `, ${selectedAddress.entrance}`}
                          {selectedAddress.apartmentNumber &&
                            `, ${selectedAddress.apartmentNumber}`}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Label dropdown at the top */}
                    <div>
                      <select
                        value={newAddress.label || ''}
                        onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={createAddressMutation.isPending}
                      >
                        <option value="">Хаягийн шошго сонгох</option>
                        <option value="Орон сууц">Орон сууц</option>
                        <option value="Оффис">Оффис</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="organization"
                        checked={receiveByOrganization}
                        onChange={e => setReceiveByOrganization(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="organization" className="text-sm text-gray-700">
                        Байгууллагаар авах
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        value={newAddress.fullName}
                        onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        placeholder={userName || 'Нэр'}
                        required
                        disabled={createAddressMutation.isPending}
                      />
                      <Input
                        value={newAddress.phoneNumber}
                        onChange={e =>
                          setNewAddress({
                            ...newAddress,
                            phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                          })
                        }
                        placeholder={userPhone || 'Утасны дугаар'}
                        maxLength={8}
                        required
                        disabled={createAddressMutation.isPending}
                      />
                      <select
                        value={selectedDistrict}
                        onChange={e => {
                          setSelectedDistrict(e.target.value);
                          setNewAddress({ ...newAddress, provinceOrDistrict: e.target.value });
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                        disabled={createAddressMutation.isPending}
                      >
                        <option value="">Аймаг/Дүүрэг сонгох *</option>
                        {districts.map(district => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newAddress.khorooOrSoum}
                        onChange={e =>
                          setNewAddress({ ...newAddress, khorooOrSoum: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                        disabled={
                          createAddressMutation.isPending || !selectedDistrict || khorooLoading
                        }
                      >
                        <option value="">
                          {khorooLoading
                            ? 'Ачаалж байна...'
                            : selectedDistrict
                            ? 'Хороо сонгох*'
                            : 'Эхлээд дүүрэг сонгоно уу'}
                        </option>
                        {Array.isArray(khorooOptions) &&
                          khorooOptions.length > 0 &&
                          khorooOptions.map(khoroo => (
                            <option key={khoroo} value={khoroo}>
                              {khoroo}
                            </option>
                          ))}
                      </select>
                      <Input
                        value={newAddress.neighborhood || ''}
                        onChange={e =>
                          setNewAddress({ ...newAddress, neighborhood: e.target.value })
                        }
                        placeholder="Хороолол"
                        disabled={createAddressMutation.isPending}
                      />
                      <Input
                        value={newAddress.residentialComplex || ''}
                        onChange={e =>
                          setNewAddress({ ...newAddress, residentialComplex: e.target.value })
                        }
                        placeholder="Хотхон"
                        disabled={createAddressMutation.isPending}
                      />
                      <Input
                        value={newAddress.street || ''}
                        onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                        placeholder="Гудамж"
                        disabled={createAddressMutation.isPending}
                      />
                      <Input
                        value={newAddress.building || ''}
                        onChange={e => setNewAddress({ ...newAddress, building: e.target.value })}
                        placeholder="Барилга"
                        disabled={createAddressMutation.isPending}
                      />
                      <Input
                        value={newAddress.entrance || ''}
                        onChange={e => setNewAddress({ ...newAddress, entrance: e.target.value })}
                        placeholder="Орц"
                        disabled={createAddressMutation.isPending}
                      />
                      <Input
                        value={newAddress.apartmentNumber || ''}
                        onChange={e =>
                          setNewAddress({ ...newAddress, apartmentNumber: e.target.value })
                        }
                        placeholder="Тоот"
                        disabled={createAddressMutation.isPending}
                      />
                    </div>
                    <Textarea
                      value={newAddress.addressNote || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNewAddress({ ...newAddress, addressNote: e.target.value.slice(0, 500) })
                      }
                      placeholder="Нэмэлт тэмдэглэл (500 тэмдэгт хүртэл)"
                      maxLength={500}
                      rows={3}
                      disabled={createAddressMutation.isPending}
                    />
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="organization"
                      checked={receiveByOrganization}
                      onChange={e => setReceiveByOrganization(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="organization" className="text-sm text-gray-700">
                      Байгууллагаар авах
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      value={guestAddress.fullName}
                      onChange={e => setGuestAddress({ ...guestAddress, fullName: e.target.value })}
                      placeholder="Нэр"
                      required
                    />
                    <Input
                      value={guestAddress.phoneNumber}
                      onChange={e =>
                        setGuestAddress({
                          ...guestAddress,
                          phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                        })
                      }
                      placeholder={userPhone || 'Утасны дугаар'}
                      maxLength={8}
                      required
                    />
                    <select
                      value={selectedDistrict}
                      onChange={e => {
                        const district = e.target.value;
                        setSelectedDistrict(district);
                        setGuestAddress({ ...guestAddress, provinceOrDistrict: district });
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Аймаг/Дүүрэг сонгох *</option>
                      {districts.map(district => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                    <select
                      value={guestAddress.khorooOrSoum}
                      onChange={e =>
                        setGuestAddress({ ...guestAddress, khorooOrSoum: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                      disabled={!selectedDistrict || khorooLoading}
                    >
                      <option value="">
                        {khorooLoading
                          ? 'Ачаалж байна...'
                          : selectedDistrict
                          ? 'Хороо/Сум сонгох *'
                          : 'Эхлээд дүүрэг сонгоно уу'}
                      </option>
                      {Array.isArray(khorooOptions) &&
                        khorooOptions.length > 0 &&
                        khorooOptions.map(khoroo => (
                          <option key={khoroo} value={khoroo}>
                            {khoroo}
                          </option>
                        ))}
                    </select>
                    <Input
                      value={guestAddress.neighborhood}
                      onChange={e =>
                        setGuestAddress({ ...guestAddress, neighborhood: e.target.value })
                      }
                      placeholder="Хороолол"
                    />
                    <Input
                      value={guestAddress.residentialComplex}
                      onChange={e =>
                        setGuestAddress({ ...guestAddress, residentialComplex: e.target.value })
                      }
                      placeholder="Хотхон"
                    />
                    <Input
                      value={guestAddress.street}
                      onChange={e => setGuestAddress({ ...guestAddress, street: e.target.value })}
                      placeholder="Гудамж"
                    />
                    <Input
                      value={guestAddress.building}
                      onChange={e => setGuestAddress({ ...guestAddress, building: e.target.value })}
                      placeholder="Барилга"
                    />
                    <Input
                      value={guestAddress.entrance}
                      onChange={e => setGuestAddress({ ...guestAddress, entrance: e.target.value })}
                      placeholder="Орц"
                    />
                    <Input
                      value={guestAddress.apartmentNumber}
                      onChange={e =>
                        setGuestAddress({ ...guestAddress, apartmentNumber: e.target.value })
                      }
                      placeholder="Орон сууцны дугаар"
                    />
                  </div>
                  <Textarea
                    value={guestAddress.addressNote || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setGuestAddress({
                        ...guestAddress,
                        addressNote: e.target.value.slice(0, 500),
                      })
                    }
                    placeholder="Нэмэлт тэмдэглэл (500 тэмдэгт хүртэл)"
                    maxLength={500}
                    rows={3}
                  />
                </div>
              )}

              {/* Delivery Time Slot */}
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium">Хүргэлтийн цаг сонгох</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['10-14', '14-18', '18-21', '21-00'] as const).map(slot => {
                    const formatTimeSlot = (slot: string) => {
                      const [start, end] = slot.split('-');
                      const formatHour = (hour: string) => {
                        if (hour === '00') return '00:00';
                        return `${hour.padStart(2, '0')}:00`;
                      };
                      return `${formatHour(start)} - ${formatHour(end)}`;
                    };
                    return (
                      <button
                        key={slot}
                        onClick={() => setDeliveryTimeSlot(slot)}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                          deliveryTimeSlot === slot
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {formatTimeSlot(slot)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <a href="/cart" className="text-red-600 hover:text-red-700 text-sm font-medium">
                  &lt; Сагс руу буцах
                </a>
                <Button
                  onClick={handleCreateOrder}
                  disabled={
                    (isAuthenticated && addresses.length > 0 && !selectedAddressId) ||
                    (isAuthenticated &&
                      addresses.length === 0 &&
                      (!newAddress.fullName ||
                        !newAddress.phoneNumber ||
                        !newAddress.provinceOrDistrict ||
                        !newAddress.khorooOrSoum)) ||
                    (!isAuthenticated &&
                      (!guestAddress.fullName ||
                        !guestAddress.phoneNumber ||
                        !guestAddress.provinceOrDistrict ||
                        !guestAddress.khorooOrSoum)) ||
                    createOrderMutation.isPending ||
                    createAddressMutation.isPending
                  }
                  className="bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Захиалга үүсгэж байна...
                    </>
                  ) : (
                    'Хүргэлт үргэлжлүүлнэ'
                  )}
                </Button>
              </div>

              {/* Return Policy Link */}
              <div className="mt-4">
                <a href="#" className="text-red-600 hover:text-red-700 text-sm">
                  Солих буцаах журам
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Захиалгын хураангуй</h3>

              {/* Products */}
              <div className="space-y-4 mb-6">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.product?.firstImage || item.product?.images?.[0] ? (
                        <Image
                          src={item.product.firstImage || item.product.images[0]}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          quality={75}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          📦
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {item.product?.name || 'Бүтээгдэхүүн'}
                      </h4>
                      <p className="text-sm font-semibold text-gray-900">
                        {parseFloat(item.product?.price || '0').toLocaleString()}₮
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)} барааны дүн
                  </span>
                  <span className="font-semibold">{subtotal.toLocaleString()}₮</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Хүргэлт</span>
                  <span className="font-semibold">{deliveryFee.toLocaleString()}₮</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Хэтэвч</span>
                  <span className="font-semibold">{walletBalance.toLocaleString()}₮</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Нийт төлөх дүн</span>
                    <span className="text-xl font-bold text-primary">
                      {total.toLocaleString()}₮
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
