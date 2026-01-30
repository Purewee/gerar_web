'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, User, LogOut, MapPin, ChevronRight, ChevronLeft, Plus, Edit, Trash2, X } from 'lucide-react';
import { MongolianDatePicker } from '@/components/mongolian-date-picker';
import {
  useOrderCreate,
  useAddresses,
  useAddressCreate,
  useAddressUpdate,
  useAddressDelete,
  useCart,
  getAuthToken,
  GuestAddress,
  useDistricts,
  useKhoroo,
  authApi,
  type CreateAddressRequest,
  type Address,
} from '@/lib/api';
import Image from 'next/image';
import { toast } from 'sonner';

export default function OrderCreatePage() {
  const router = useRouter();
  const createOrderMutation = useOrderCreate();
  const createAddressMutation = useAddressCreate();
  const updateAddressMutation = useAddressUpdate();
  const deleteAddressMutation = useAddressDelete();
  const {
    data: addressesResponse,
    isLoading: addressesLoading,
    refetch: refetchAddresses,
  } = useAddresses();
  const { data: cartResponse } = useCart();
  const addresses = addressesResponse?.data || [];
  const cartItems = cartResponse?.data || [];

  // Use state to avoid hydration mismatch - localStorage is only available on client
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [savedEmailPlaceholder, setSavedEmailPlaceholder] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Set authentication state after mount to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
    setIsAuthenticated(!!getAuthToken());
  }, []);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<
    '10-14' | '14-18' | '18-21' | '21-00' | ''
  >('');
  const [receiveByOrganization, setReceiveByOrganization] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

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
  // fullName and phoneNumber come from contact section (userName, userPhone)
  const [newAddress, setNewAddress] = useState<Omit<CreateAddressRequest, 'fullName' | 'phoneNumber'>>({
    provinceOrDistrict: '',
    khorooOrSoum: '',
  });

  // Guest address form state
  const [guestAddress, setGuestAddress] = useState<GuestAddress & { email?: string }>({
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
    email: '',
  });

  // Load user info from localStorage
  useEffect(() => {
    const email = localStorage.getItem('profile_email') || localStorage.getItem('user_email') || '';
    setSavedEmailPlaceholder(email);

    if (isAuthenticated) {
      const name = localStorage.getItem('user_name') || localStorage.getItem('profile_name') || '';
      const phone = localStorage.getItem('mobile') || '';
      setUserName(name);
      setUserEmail(email);
      setUserPhone(phone);

      // User info is now in contact section, no need to pre-fill address form
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

  // Reset khoroo when district changes (but not when editing an address)
  useEffect(() => {
    // Don't reset if we're currently editing an address
    if (editingAddressId) {
      return;
    }
    
    if (selectedDistrict) {
      setNewAddress(prev => ({ ...prev, khorooOrSoum: '' }));
      setGuestAddress(prev => ({ ...prev, khorooOrSoum: '' }));
    } else {
      setNewAddress(prev => ({ ...prev, provinceOrDistrict: '' }));
      setGuestAddress(prev => ({ ...prev, provinceOrDistrict: '' }));
    }
  }, [selectedDistrict, editingAddressId]);

  useEffect(() => {
    // Set default address if available (for authenticated users)
    if (isAuthenticated && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, router, selectedAddressId, isAuthenticated, cartItems.length]);

  // Clear time slot if it becomes unavailable when date changes
  useEffect(() => {
    if (!deliveryDate || !deliveryTimeSlot) return;

    const today = new Date();
    const todayDateStr = getTodayDateString();

    // If delivery date is today, check if selected slot is still available
    if (deliveryDate === todayDateStr) {
      const [startHour, endHour] = deliveryTimeSlot.split('-');
      const slotStartHour = parseInt(startHour === '00' ? '24' : startHour);
      const slotEndHour = parseInt(endHour === '00' ? '24' : endHour);
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      const currentTimeInHours = currentHour + (currentMinute / 60);
      
      // Check if slot has already ended
      if (slotEndHour === 24) {
        if (currentTimeInHours >= 24) {
          setDeliveryTimeSlot('');
          return;
        }
      } else if (currentTimeInHours >= slotEndHour) {
        setDeliveryTimeSlot('');
        return;
      }
      
      // Calculate hours until slot starts
      let hoursUntilSlot;
      if (slotStartHour === 24) {
        hoursUntilSlot = 24 - currentTimeInHours;
      } else {
        hoursUntilSlot = slotStartHour - currentTimeInHours;
      }
      
      // Clear slot if it has already started (current slot)
      if (hoursUntilSlot <= 0) {
        setDeliveryTimeSlot('');
      }
    }
  }, [deliveryDate, deliveryTimeSlot]);

  const validateAddress = (address: {
    provinceOrDistrict: string;
    khorooOrSoum: string;
  }): boolean => {
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

  const validateContactInfo = (): boolean => {
    if (isAuthenticated) {
      if (!userName.trim()) {
        toast.warning('Нэр оруулна уу');
        return false;
      }
      if (!userPhone || userPhone.length !== 8) {
        toast.warning('8 оронтой утасны дугаар оруулна уу');
        return false;
      }
      if (!userEmail.trim() || !userEmail.includes('@')) {
        toast.warning('Зөв имэйл хаяг оруулна уу');
        return false;
      }
    } else {
      if (!guestAddress.fullName.trim()) {
        toast.warning('Нэр оруулна уу');
        return false;
      }
      if (!guestAddress.phoneNumber || guestAddress.phoneNumber.length !== 8) {
        toast.warning('8 оронтой утасны дугаар оруулна уу');
        return false;
      }
      if (!guestAddress.email?.trim() || !guestAddress.email.includes('@')) {
        toast.warning('Зөв имэйл хаяг оруулна уу');
        return false;
      }
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

    if (!deliveryDate) {
      toast.warning('Хүргэлтийн огноо сонгоно уу');
      return;
    }

    if (!deliveryTimeSlot) {
      toast.warning('Хүргэлтийн цаг сонгоно уу');
      return;
    }

    if (!validateContactInfo()) {
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

        // Include user's name and phone from contact section
        const addressData: CreateAddressRequest = {
          ...newAddress,
          fullName: userName,
          phoneNumber: userPhone,
        };

        try {
          // Create address first
          const addressResponse = await createAddressMutation.mutateAsync(addressData);
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
          deliveryTimeSlot: deliveryTimeSlot as '10-14' | '14-18' | '18-21' | '21-00',
          deliveryDate: deliveryDate,
        });

        if (response.data && response.data.id) {
          // Save email and name to user's profile
          if (userEmail && userEmail.trim()) {
            localStorage.setItem('user_email', userEmail.trim());
            localStorage.setItem('profile_email', userEmail.trim());
          }
          if (userName && userName.trim()) {
            localStorage.setItem('user_name', userName.trim());
            localStorage.setItem('profile_name', userName.trim());
          }
          toast.success('Захиалга үүслээ');
          router.push(`/orders/${response.data.id}`);
        } else {
          toast.error('Захиалгын ID олдсонгүй');
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
          deliveryTimeSlot: deliveryTimeSlot as '10-14' | '14-18' | '18-21' | '21-00',
          deliveryDate: deliveryDate,
        });

        if (response.data && response.data.id) {
          // Save email to localStorage for guest users (in case they register later)
          if (guestAddress.email && guestAddress.email.trim()) {
            localStorage.setItem('user_email', guestAddress.email.trim());
            localStorage.setItem('profile_email', guestAddress.email.trim());
          }
          toast.success('Захиалга үүслээ');
          router.push(`/orders/${response.data.id}`);
        } else {
          toast.error('Захиалгын ID олдсонгүй');
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

  const formatAddressString = (address: Address): string => {
    const parts = [
      address.provinceOrDistrict,
      address.khorooOrSoum,
      address.street,
      address.neighborhood,
      address.residentialComplex,
      address.building,
      address.entrance,
      address.apartmentNumber,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleEditAddress = (address: Address) => {
    // Set editing state first to prevent useEffect from clearing khorooOrSoum
    setEditingAddressId(address.id);
    // Set address data before setting district to preserve khorooOrSoum
    setNewAddress({
      label: address.label || undefined,
      provinceOrDistrict: address.provinceOrDistrict,
      khorooOrSoum: address.khorooOrSoum,
      street: address.street || undefined,
      neighborhood: address.neighborhood || undefined,
      residentialComplex: address.residentialComplex || undefined,
      building: address.building || undefined,
      entrance: address.entrance || undefined,
      apartmentNumber: address.apartmentNumber || undefined,
      addressNote: address.addressNote || undefined,
    } as Omit<CreateAddressRequest, 'fullName' | 'phoneNumber'>);
    // Set district last - the useEffect will now skip resetting because editingAddressId is set
    setSelectedDistrict(address.provinceOrDistrict);
    setShowAddAddressForm(true);
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Энэ хаягийг устгахдаа итгэлтэй байна уу?')) return;
    try {
      await deleteAddressMutation.mutateAsync(id);
      toast.success('Хаяг амжилттай устгагдлаа');
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
      await refetchAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Хаяг устгахад алдаа гарлаа');
    }
  };

  const handleSaveAddress = async () => {
    if (!validateAddress(newAddress)) {
      return;
    }

    // Include user's name and phone from contact section
    const addressData: CreateAddressRequest = {
      ...newAddress,
      fullName: userName,
      phoneNumber: userPhone,
    };

    try {
      if (editingAddressId) {
        await updateAddressMutation.mutateAsync({
          id: editingAddressId,
          data: addressData,
        });
        toast.success('Хаяг амжилттай шинэчлэгдлээ');
      } else {
        const addressResponse = await createAddressMutation.mutateAsync(addressData);
        if (addressResponse.data) {
          setSelectedAddressId(addressResponse.data.id);
          toast.success('Хаяг амжилттай нэмэгдлээ');
        }
      }
      // Reset form
      setNewAddress({
        provinceOrDistrict: '',
        khorooOrSoum: '',
      } as Omit<CreateAddressRequest, 'fullName' | 'phoneNumber'>);
      setSelectedDistrict('');
      setEditingAddressId(null);
      setShowAddAddressForm(false);
      await refetchAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Хаяг хадгалахад алдаа гарлаа');
    }
  };

  const handleCancelAddressForm = () => {
    setNewAddress({
      provinceOrDistrict: '',
      khorooOrSoum: '',
    } as Omit<CreateAddressRequest, 'fullName' | 'phoneNumber'>);
    setSelectedDistrict('');
    setEditingAddressId(null);
    setShowAddAddressForm(false);
  };

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product?.price || '0') * item.quantity,
    0,
  );
  const deliveryFee = 0; // Set to 0 for testing (e.g. 6000 for production)
  const walletBalance = 0;
  const total = subtotal + deliveryFee - walletBalance;

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

  // Helper function to get today's date string in local time
  const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Show loading only after mount to avoid hydration mismatch
  if (!isMounted || (isAuthenticated && addressesLoading)) {
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
            <span className="text-gray-900">Захиалгын хаяг</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Нэр <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        placeholder="Нэр"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Утасны дугаар <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={userPhone}
                        onChange={e =>
                          setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 8))
                        }
                        placeholder="Утасны дугаар"
                        maxLength={8}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      И-мэйл хаяг <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={userEmail}
                      onChange={e => setUserEmail(e.target.value)}
                      placeholder={savedEmailPlaceholder || 'Имэйл'}
                      required
                    />
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
                  <Input
                    type="email"
                    value={guestAddress.email || ''}
                    onChange={e =>
                      setGuestAddress({ ...guestAddress, email: e.target.value })
                    }
                    placeholder={savedEmailPlaceholder || 'Имэйл'}
                    required
                  />
                </div>
              )}
            </div>

            {/* Delivery Address Information Section */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Хүргэлт хүлээн авах мэдээлэл</h2>

              {isAuthenticated ? (
                addresses.length > 0 && !showAddAddressForm ? (
                  <div className="space-y-4">
                    {/* Address Cards with Radio Buttons */}
                    {addresses.map(address => (
                      <div
                        key={address.id}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          selectedAddressId === address.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Radio Button */}
                          <input
                            type="radio"
                            id={`address-${address.id}`}
                            name="deliveryAddress"
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                            className="mt-1 w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          {/* Address Content */}
                          <label
                            htmlFor={`address-${address.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {address.label && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  {address.label}
                                </span>
                              )}
                              {!address.label && (
                                <span className="font-semibold text-gray-900">Хаяг</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatAddressString(address)}
                            </div>
                          </label>
                          {/* Edit/Delete Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="text-sm text-gray-600 hover:text-primary px-2 py-1 rounded transition-colors"
                              type="button"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="text-gray-600 hover:text-red-600 px-2 py-1 rounded transition-colors"
                              type="button"
                              disabled={deleteAddressMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Address Button */}
                    <button
                      onClick={() => {
                        setShowAddAddressForm(true);
                        setNewAddress({
                          provinceOrDistrict: '',
                          khorooOrSoum: '',
                        } as Omit<CreateAddressRequest, 'fullName' | 'phoneNumber'>);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                      type="button"
                    >
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </div>
                      Хүргэлтийн хаяг нэмэх
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Label input at the top */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Хаягийн нэр
                      </label>
                      <Input
                        value={newAddress.label || ''}
                        onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                        placeholder="Жишээ: Гэр, Ажил, Орон сууц"
                        disabled={
                          createAddressMutation.isPending || updateAddressMutation.isPending
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Аймаг/Дүүрэг <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedDistrict}
                          onChange={e => {
                            setSelectedDistrict(e.target.value);
                            setNewAddress({ ...newAddress, provinceOrDistrict: e.target.value });
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                          disabled={
                            createAddressMutation.isPending || updateAddressMutation.isPending
                          }
                        >
                          <option value="">Аймаг/Дүүрэг сонгох</option>
                          {districts.map(district => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Хороо/Сум <span className="text-red-500">*</span>
                        </label>
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
                              ? 'Хороо/Сум сонгох'
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
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Хотхон
                        </label>
                        <Input
                          value={newAddress.residentialComplex || ''}
                          onChange={e =>
                            setNewAddress({ ...newAddress, residentialComplex: e.target.value })
                          }
                          placeholder="Хотхон"
                          disabled={
                            createAddressMutation.isPending || updateAddressMutation.isPending
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Барилга
                        </label>
                        <Input
                          value={newAddress.building || ''}
                          onChange={e => setNewAddress({ ...newAddress, building: e.target.value })}
                          placeholder="Барилга"
                          disabled={
                            createAddressMutation.isPending || updateAddressMutation.isPending
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Орц
                        </label>
                        <Input
                          value={newAddress.entrance || ''}
                          onChange={e => setNewAddress({ ...newAddress, entrance: e.target.value })}
                          placeholder="Орц"
                          disabled={
                            createAddressMutation.isPending || updateAddressMutation.isPending
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Тоот
                        </label>
                        <Input
                          value={newAddress.apartmentNumber || ''}
                          onChange={e =>
                            setNewAddress({ ...newAddress, apartmentNumber: e.target.value })
                          }
                          placeholder="Тоот"
                          disabled={
                            createAddressMutation.isPending || updateAddressMutation.isPending
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Дэлгэрэнгүй хаяг
                      </label>
                      <Textarea
                        value={newAddress.addressNote || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setNewAddress({ ...newAddress, addressNote: e.target.value.slice(0, 500) })
                        }
                        placeholder="Дэлгэрэнгүй хаягийн мэдээлэл"
                        maxLength={500}
                        rows={3}
                        disabled={
                          createAddressMutation.isPending || updateAddressMutation.isPending
                        }
                      />
                    </div>

                    {/* Save/Cancel Buttons - show when form is visible: adding new, editing, or user has no addresses */}
                    {(showAddAddressForm || addresses.length === 0) && (
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={handleSaveAddress}
                          disabled={
                            createAddressMutation.isPending ||
                            updateAddressMutation.isPending ||
                            !newAddress.provinceOrDistrict ||
                            !newAddress.khorooOrSoum
                          }
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          {createAddressMutation.isPending || updateAddressMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Хадгалж байна...
                            </>
                          ) : (
                            'Хадгалах'
                          )}
                        </Button>
                        <Button
                          onClick={handleCancelAddressForm}
                          variant="outline"
                          className="flex-1"
                          disabled={
                            createAddressMutation.isPending || updateAddressMutation.isPending
                          }
                        >
                          Цуцлах
                        </Button>
                      </div>
                    )}

                    {/* Show Add Address Button only when user has addresses and form is closed */}
                    {addresses.length > 0 && !showAddAddressForm && (
                      <button
                        onClick={() => {
                          setShowAddAddressForm(true);
                          setNewAddress({
                            provinceOrDistrict: '',
                            khorooOrSoum: '',
                          } as Omit<CreateAddressRequest, 'fullName' | 'phoneNumber'>);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        type="button"
                      >
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </div>
                        Хүргэлтийн хаяг нэмэх
                      </button>
                    )}
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
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Нэр <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={guestAddress.fullName}
                        onChange={e => setGuestAddress({ ...guestAddress, fullName: e.target.value })}
                        placeholder="Нэр"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Утасны дугаар <span className="text-red-500">*</span>
                      </label>
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
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Аймаг/Дүүрэг <span className="text-red-500">*</span>
                      </label>
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
                        <option value="">Аймаг/Дүүрэг сонгох</option>
                        {districts.map(district => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Хороо/Сум <span className="text-red-500">*</span>
                      </label>
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
                            ? 'Хороо/Сум сонгох'
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
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Хороолол
                      </label>
                      <Input
                        value={guestAddress.neighborhood}
                        onChange={e =>
                          setGuestAddress({ ...guestAddress, neighborhood: e.target.value })
                        }
                        placeholder="Хороолол"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Хотхон
                      </label>
                      <Input
                        value={guestAddress.residentialComplex}
                        onChange={e =>
                          setGuestAddress({ ...guestAddress, residentialComplex: e.target.value })
                        }
                        placeholder="Хотхон"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Барилга
                      </label>
                      <Input
                        value={guestAddress.building}
                        onChange={e => setGuestAddress({ ...guestAddress, building: e.target.value })}
                        placeholder="Барилга"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Орц
                      </label>
                      <Input
                        value={guestAddress.entrance}
                        onChange={e => setGuestAddress({ ...guestAddress, entrance: e.target.value })}
                        placeholder="Орц"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Орон сууцны дугаар
                      </label>
                      <Input
                        value={guestAddress.apartmentNumber}
                        onChange={e =>
                          setGuestAddress({ ...guestAddress, apartmentNumber: e.target.value })
                        }
                        placeholder="Орон сууцны дугаар"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Нэмэлт тэмдэглэл
                    </label>
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
                </div>
              )}

              {/* Delivery Date */}
              <div className="mt-6">
                <label className="mb-3 text-sm font-medium block">
                  Хүргэлтийн өдөр сонгох <span className="text-red-500">*</span>
                </label>
                <MongolianDatePicker
                  value={deliveryDate}
                  onChange={setDeliveryDate}
                  minDate={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Delivery Time Slot */}
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium">
                  Хүргэлтийн цаг сонгох <span className="text-red-500">*</span>
                </p>
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

                    // Check if time slot is available (disable current and past slots, enable all future slots)
                    const isTimeSlotAvailable = (): boolean => {
                      if (!deliveryDate) return false;
                      
                      const today = new Date();
                      const todayDateStr = getTodayDateString();
                      
                      // If delivery date is in the future, all slots are available
                      if (deliveryDate > todayDateStr) {
                        return true;
                      }
                      
                      // If delivery date is today, check if slot is available
                      if (deliveryDate === todayDateStr) {
                        const [startHour, endHour] = slot.split('-');
                        const slotStartHour = parseInt(startHour === '00' ? '24' : startHour);
                        const slotEndHour = parseInt(endHour === '00' ? '24' : endHour);
                        const currentHour = today.getHours();
                        const currentMinute = today.getMinutes();
                        const currentTimeInHours = currentHour + (currentMinute / 60);
                        
                        // Check if slot has already ended - disable past slots
                        if (slotEndHour === 24) {
                          // Midnight slot (21-00) - ends at midnight
                          if (currentTimeInHours >= 24) return false;
                        } else if (currentTimeInHours >= slotEndHour) {
                          return false; // Slot has already ended
                        }
                        
                        // Calculate hours until slot starts
                        let hoursUntilSlot;
                        if (slotStartHour === 24) {
                          // Midnight slot - calculate from current time to midnight
                          hoursUntilSlot = 24 - currentTimeInHours;
                        } else {
                          hoursUntilSlot = slotStartHour - currentTimeInHours;
                        }
                        
                        // Disable current slot (slot that has started but not ended)
                        if (hoursUntilSlot <= 0) {
                          // Slot has started or is starting now - disable it
                          return false;
                        }
                        
                        // Slot is in the future - enable it
                        return true;
                      }
                      
                      return false;
                    };

                    const isAvailable = isTimeSlotAvailable();

                    return (
                      <button
                        key={slot}
                        onClick={() => isAvailable && setDeliveryTimeSlot(slot)}
                        disabled={!isAvailable}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                          !isAvailable
                            ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                            : deliveryTimeSlot === slot
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

              {/* Navigation */}
              <div className="flex items-center mt-6 pt-6 border-t border-gray-200">
                <a
                  href="/cart"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors group"
                >
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  Сагс руу буцах
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
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
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
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold z-10">
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
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Нийт төлөх дүн</span>
                    <span className="text-xl font-bold text-primary">
                      {total.toLocaleString()}₮
                    </span>
                  </div>
                </div>
              </div>

              {/* Pay button */}
              <Button
                onClick={handleCreateOrder}
                disabled={
                  !deliveryDate ||
                  !deliveryTimeSlot ||
                  (isAuthenticated &&
                    (!userName || !userPhone || !userEmail || userPhone.length !== 8)) ||
                  (isAuthenticated && addresses.length > 0 && !selectedAddressId) ||
                  (isAuthenticated &&
                    addresses.length === 0 &&
                    (!newAddress.provinceOrDistrict ||
                      !newAddress.khorooOrSoum)) ||
                  (!isAuthenticated &&
                    (!guestAddress.fullName ||
                      !guestAddress.phoneNumber ||
                      guestAddress.phoneNumber.length !== 8 ||
                      !guestAddress.email ||
                      !guestAddress.provinceOrDistrict ||
                      !guestAddress.khorooOrSoum)) ||
                  createOrderMutation.isPending ||
                  createAddressMutation.isPending
                }
                className="w-full mt-4 bg-primary hover:bg-primary/90"
                size="lg"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Захиалга үүсгэж байна...
                  </>
                ) : (
                  'Төлбөр төлөх'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
