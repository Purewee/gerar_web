'use client';

import { useState, useEffect, useRef } from 'react';

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import TermsPrivacyModal from '@/components/terms-privacy-modal';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  Info,
  User,
  Building2,
} from 'lucide-react';
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
  useKhoroo,
  useOffDeliveryDates,
  validateDeliveryTimeSlot,
  authApi,
  type CreateAddressRequest,
  type Address,
  useDistricts,
} from '@/lib/api';
import { A_ZONE } from '@/lib/zones';
import Image from 'next/image';
import { toast } from 'sonner';
import Link from 'next/link';
import { getDeliveryFee } from '@/lib/utils';
import { getSessionToken } from '@/lib/api';

export default function OrderCreatePage() {
  // ...existing code...
  // Phone, district, building, apartment, delivery date/time error state
  const [phoneError, setPhoneError] = useState('');
  const [districtError, setDistrictError] = useState('');
  const [buildingError, setBuildingError] = useState('');
  const [apartmentError, setApartmentError] = useState('');
  const [deliveryDateError, setDeliveryDateError] = useState('');
  const [deliveryTimeSlotError, setDeliveryTimeSlotError] = useState('');
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const districtInputRef = useRef<HTMLSelectElement>(null);
  const buildingInputRef = useRef<HTMLInputElement>(null);
  const apartmentInputRef = useRef<HTMLInputElement>(null);
  const deliveryDateRef = useRef<HTMLDivElement>(null);
  const deliveryTimeSlotRef = useRef<HTMLDivElement>(null);

  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  // Districts and khoroo (A_ZONE only)
  // const { data: districtsResponse } = useDistricts();
  // const districts = Array.isArray(districtsResponse?.data) ? districtsResponse.data : [];
  const districts = Object.keys(A_ZONE);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  // const {
  //   data: khorooResponse,
  //   isLoading: khorooLoading,
  //   error: khorooError,
  // } = useKhoroo(selectedDistrict || null);
  const [khorooOptions, setKhorooOptions] = useState<string[]>([]);
  const [khorooLoading, setKhorooLoading] = useState(false);

  useEffect(() => {
    if (selectedDistrict) {
      setKhorooLoading(true);
      setKhorooOptions(A_ZONE[selectedDistrict] || []);
      setKhorooLoading(false);
    } else {
      setKhorooOptions([]);
    }
  }, [selectedDistrict]);
  const { data: offDeliveryResponse } = useOffDeliveryDates();
  const offDeliveryData = offDeliveryResponse?.data;
  const offWeekdays = offDeliveryData?.offWeekdays ?? [];
  const offDatesSet = new Set(offDeliveryData?.offDates ?? []);
  const offTimeSlots = offDeliveryData?.offTimeSlots ?? [];
  const offTimeSlotsByDate = offDeliveryData?.offTimeSlotsByDate ?? {};

  // Off-days: backend sends 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat. Disable when weekday is in list or date in offDates.
  const isDeliveryDateDisabled = (dateString: string): boolean => {
    if (offDatesSet.has(dateString)) return true;
    const [y, m, d] = dateString.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    // Last day of month logic
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const isLastDayOfMonth =
      now.getFullYear() === lastDayOfMonth.getFullYear() &&
      now.getMonth() === lastDayOfMonth.getMonth() &&
      now.getDate() === lastDayOfMonth.getDate();
    if (isLastDayOfMonth && now.getHours() >= 18) {
      // Disable all days this month (including today)
      if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        return true;
      }
    }
    if (isToday && now.getHours() >= 18) return true;
    return offWeekdays.includes(weekday);
  };

  // API returns { data: { district: string, khorooOptions: string[] } }
  // const khorooOptions =
  //   khorooResponse?.data &&
  //   typeof khorooResponse.data === 'object' &&
  //   'khorooOptions' in khorooResponse.data &&
  //   Array.isArray(khorooResponse.data.khorooOptions)
  //     ? khorooResponse.data.khorooOptions
  //     : Array.isArray(khorooResponse?.data)
  //       ? khorooResponse.data
  //       : [];

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ebarimt state
  const [ebarimtType, setEbarimtType] = useState<'CITIZEN' | 'COMPANY'>('CITIZEN');
  const [ebarimtRegNo, setEbarimtRegNo] = useState('');
  const [ebarimtRegNoError, setEbarimtRegNoError] = useState('');
  const [ebarimtOrgName, setEbarimtOrgName] = useState('');
  const [isFetchingOrg, setIsFetchingOrg] = useState(false);

  // Debug: Log khoroo response
  // useEffect(() => {
  //   if (selectedDistrict) {
  //     console.log('Selected district:', selectedDistrict);
  //     console.log('Khoroo response:', khorooResponse);
  //     console.log('Khoroo options:', khorooOptions);
  //     console.log('Khoroo loading:', khorooLoading);
  //     console.log('Khoroo error:', khorooError);
  //     if (khorooError) {
  //       console.error('Khoroo API Error:', khorooError);
  //     }
  //   }
  // }, [selectedDistrict, khorooResponse, khorooOptions, khorooLoading, khorooError]);

  // Ebarimt Organization Info Fetcher
  useEffect(() => {
    const fetchOrgInfo = async () => {
      if (ebarimtType === 'COMPANY' && ebarimtRegNo.length >= 7) {
        setIsFetchingOrg(true);
        try {
          const response = await fetch(
            `https://info.ebarimt.mn/rest/merchant/info?regno=${ebarimtRegNo}`,
          );
          const data = await response.json();
          if (data && data.found) {
            setEbarimtOrgName(data.name);
          } else {
            setEbarimtOrgName('');
          }
        } catch (error) {
          console.error('Error fetching organization info:', error);
          setEbarimtOrgName('');
        } finally {
          setIsFetchingOrg(false);
        }
      } else {
        setEbarimtOrgName('');
      }
    };

    const timer = setTimeout(() => {
      fetchOrgInfo();
    }, 500);

    return () => clearTimeout(timer);
  }, [ebarimtRegNo, ebarimtType]);

  // Address form state for authenticated users without addresses
  // fullName and phoneNumber come from contact section (userName, userPhone)
  const [newAddress, setNewAddress] = useState<
    Omit<CreateAddressRequest, 'fullName' | 'phoneNumber'>
  >({
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
    apartmentNumber: '',
    addressNote: '',
  });

  // Load user info from localStorage
  useEffect(() => {
    const email = localStorage.getItem('user_email') || '';
    setSavedEmailPlaceholder(email);

    if (isAuthenticated) {
      const name = localStorage.getItem('user_name') || '';
      const phone = localStorage.getItem('mobile') || '';

      if (!userName) setUserName(name);
      if (!userEmail) setUserEmail(email);
      if (!userPhone) setUserPhone(phone);
    } else {
      const phone = localStorage.getItem('mobile') || '';

      if (!userPhone) setUserPhone(phone);

      if (phone) {
        setGuestAddress(prev => ({
          ...prev,
          phoneNumber: prev.phoneNumber || phone,
        }));
      }
    }
  }, [isAuthenticated]);

  // useEffect(() => {
  //   const email = localStorage.getItem('user_email') || '';
  //   setSavedEmailPlaceholder(email);

  //   if (isAuthenticated) {
  //     const name = localStorage.getItem('user_name') || '';
  //     const phone = localStorage.getItem('mobile') || '';

  //     setUserName(name);
  //     setUserEmail(email);
  //     setUserPhone(phone);
  //   }
  // }, [isAuthenticated]); // ❗ a

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

  // Helper: today's date string in local time (used by effects below)
  const getTodayDateString = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  };

  // Slot order for delivery time; we skip the first future slot and offer from the second (when delivery is today)
  const DELIVERY_SLOT_ORDER = ['10-14', '14-18', '18-21', '21-00'] as const;
  const getFirstFutureSlotIndex = (): number | null => {
    const today = new Date();
    const currentTimeInHours = today.getHours() + today.getMinutes() / 60;
    for (let i = 0; i < DELIVERY_SLOT_ORDER.length; i++) {
      const slot = DELIVERY_SLOT_ORDER[i];
      const [startHour, endHour] = slot.split('-');
      const slotStartHour = parseInt(startHour === '00' ? '24' : startHour);
      const slotEndHour = parseInt(endHour === '00' ? '24' : endHour);
      if (slotEndHour === 24 && currentTimeInHours >= 24) continue;
      if (slotEndHour !== 24 && currentTimeInHours >= slotEndHour) continue;
      const hoursUntilSlot =
        slotStartHour === 24 ? 24 - currentTimeInHours : slotStartHour - currentTimeInHours;
      if (hoursUntilSlot > 0) return i;
    }
    return null;
  };

  useEffect(() => {
    // Set default address if available (for authenticated users)
    if (isAuthenticated && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, router, selectedAddressId, isAuthenticated, cartItems.length]);

  // Clear delivery date and time slot if selected date is an off-day (when off-days data has loaded)
  useEffect(() => {
    if (!deliveryDate || offDeliveryResponse === undefined) return;
    if (isDeliveryDateDisabled(deliveryDate)) {
      setDeliveryDate('');
      setDeliveryTimeSlot('');
    }
  }, [offDeliveryResponse, deliveryDate]);

  // Clear time slot if it becomes unavailable when date changes (off slots for this date, or today's timing)
  useEffect(() => {
    if (!deliveryDate || !deliveryTimeSlot) return;

    // Slot is off for this date (global or date-specific)
    if (
      offTimeSlots.includes(deliveryTimeSlot) ||
      offTimeSlotsByDate[deliveryDate]?.includes(deliveryTimeSlot)
    ) {
      setDeliveryTimeSlot('');
      return;
    }

    const today = new Date();
    const todayDateStr = getTodayDateString();
    const currentTimeInHours = today.getHours() + today.getMinutes() / 60;

    // Tomorrow's first slot (whatever it is in DELIVERY_SLOT_ORDER) is unavailable after 20:50 today
    if (
      deliveryDate > todayDateStr &&
      deliveryTimeSlot === DELIVERY_SLOT_ORDER[0] &&
      currentTimeInHours >= 20 + 50 / 60
    ) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      if (deliveryDate === tomorrowStr) {
        setDeliveryTimeSlot('');
        return;
      }
    }

    // If delivery date is today, check if selected slot is still available
    if (deliveryDate === todayDateStr) {
      const [startHour, endHour] = deliveryTimeSlot.split('-');
      const slotStartHour = parseInt(startHour === '00' ? '24' : startHour);
      const slotEndHour = parseInt(endHour === '00' ? '24' : endHour);
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      const currentTimeInHours = currentHour + currentMinute / 60;

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
        return;
      }

      // Clear slot if it is the "next" slot (we skip it and offer from the second slot)
      const firstFutureIdx = getFirstFutureSlotIndex();
      if (firstFutureIdx !== null && DELIVERY_SLOT_ORDER[firstFutureIdx] === deliveryTimeSlot) {
        setDeliveryTimeSlot('');
      }
    }
  }, [deliveryDate, deliveryTimeSlot, offTimeSlots, offTimeSlotsByDate]);

  const validateAddress = (address: {
    provinceOrDistrict: string;
    khorooOrSoum: string;
    label?: string;
    residentialComplex?: string;
    apartmentNumber?: string;
  }): boolean => {
    if (address.label !== undefined && !address.label.trim()) {
      toast.warning('Хаягийн гарчиг оруулна уу');
      return false;
    }
    if (!address.provinceOrDistrict.trim()) {
      setDistrictError('Дүүрэг сонгоно уу');
      if (districtInputRef.current) {
        districtInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // districtInputRef.current.focus();
      }
      return false;
    } else {
      setDistrictError('');
    }
    // Байр
    if (!address.residentialComplex || !address.residentialComplex.trim()) {
      setBuildingError('Байр оруулна уу');
      if (buildingInputRef.current) {
        buildingInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // buildingInputRef.current.focus();
      }
      return false;
    } else {
      setBuildingError('');
    }
    // Тоот
    if (!address.apartmentNumber || !address.apartmentNumber.trim()) {
      setApartmentError('Тоот оруулна уу');
      if (apartmentInputRef.current) {
        apartmentInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // apartmentInputRef.current.focus();
      }
      return false;
    } else {
      setApartmentError('');
    }
    // Guest үед khoroo/soum шалгахгүй
    if (isAuthenticated && !address.khorooOrSoum.trim()) {
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
        setPhoneError('8 оронтой утасны дугаар оруулна уу');
        if (phoneInputRef.current) {
          phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          phoneInputRef.current.focus();
        }
        return false;
      } else {
        setPhoneError('');
      }
      if (!userEmail.trim() || !userEmail.includes('@')) {
        toast.warning('Зөв имэйл хаяг оруулна уу');
        return false;
      }
    } else {
      if (!guestAddress.phoneNumber || guestAddress.phoneNumber.length !== 8) {
        setPhoneError('8 оронтой утасны дугаар оруулна уу');
        if (phoneInputRef.current) {
          phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      } else {
        setPhoneError('');
      }
      // Guest үед нэр шалгахгүй
    }
    return true;
  };

  const handleCreateOrder = async () => {
    try {
      // Бүх шаардлагатай талбаруудыг шалгана
      if (cartItems.length === 0) {
        toast.warning('Сагс хоосон', {
          description: 'Захиалга үүсгэхийн тулд сагсанд бүтээгдэхүүн байх ёстой',
        });
        if (!isSubmitting) {
          router.push('/cart');
        }
        return;
      }

      if (!validateContactInfo()) return;

      if (isAuthenticated) {
        if (addresses.length === 0 && !validateAddress(newAddress)) return;
        if (addresses.length > 0 && !selectedAddressId) {
          toast.warning('Хүргэлтийн хаяг хуудсанаас сонгоно уу');
          return;
        }
      } else {
        if (!validateAddress(guestAddress)) return;
      }

      if (!deliveryDate) {
        setDeliveryDateError('Хүргэлтийн огноо сонгоно уу');
        if (deliveryDateRef.current) {
          deliveryDateRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      } else {
        setDeliveryDateError('');
      }

      if (!deliveryTimeSlot) {
        setDeliveryTimeSlotError('Хүргэлтийн цаг сонгоно уу');
        if (deliveryTimeSlotRef.current) {
          deliveryTimeSlotRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      } else {
        setDeliveryTimeSlotError('');
      }

      try {
        validateDeliveryTimeSlot(deliveryTimeSlot, deliveryDate, {
          offTimeSlots,
          offTimeSlotsByDate,
          slotOrder: [...DELIVERY_SLOT_ORDER],
        });
      } catch (err: any) {
        toast.error(
          err.message || 'Invalid or unavailable delivery time slot for the selected date.',
        );
        return;
      }

      if (ebarimtType === 'COMPANY') {
        if (!ebarimtRegNo.trim()) {
          setEbarimtRegNoError('Байгууллагын регистрийн дугаар оруулна уу');
          return;
        } else {
          setEbarimtRegNoError('');
        }
        if (!ebarimtOrgName.trim()) {
          setEbarimtRegNoError('Байгууллагын нэр олдсонгүй. Регистрийн дугаараа шалгана уу');
          return;
        } else {
          setEbarimtRegNoError('');
        }
      }

      // Бүх validation амжилттай болсны дараа л isSubmitting true болгоно
      setIsSubmitting(true);

      const receiverPhone = (isAuthenticated ? userPhone : guestAddress.phoneNumber) || '';

      let orderPayload: any = {
        deliveryTimeSlot: deliveryTimeSlot as '10-14' | '14-18' | '18-21' | '21-00',
        deliveryDate: deliveryDate,
        ebarimtReceiverType: ebarimtType,
        ebarimtReceiver: ebarimtType === 'COMPANY' ? ebarimtRegNo : (receiverPhone || '').trim(),
        ebarimtReceiverName: ebarimtType === 'COMPANY' ? ebarimtOrgName : undefined,
      };

      if (isAuthenticated) {
        if (!selectedAddressId) {
          toast.warning('Хүргэлтийн хаяг хуудсанаас сонгоно уу');
          setIsSubmitting(false);
          return;
        }
        orderPayload.addressId = selectedAddressId;
        orderPayload.fullName = userName.trim();
        orderPayload.phoneNumber = userPhone.trim();
        orderPayload.email = (userEmail || '').trim();

        if (!orderPayload.fullName || orderPayload.fullName.length < 2) {
          toast.warning('Нэр хамгийн багадаа 2 үсэг байх ёстой');
          setIsSubmitting(false);
          return;
        }
        if (!orderPayload.phoneNumber || orderPayload.phoneNumber.length !== 8) {
          toast.warning('8 оронтой утасны дугаар оруулна уу');
          setIsSubmitting(false);
          return;
        }
        if (!orderPayload.email || !orderPayload.email.includes('@')) {
          toast.warning('Зөв имэйл хаяг оруулна уу');
          setIsSubmitting(false);
          return;
        }
      } else {
        // Guest үед эхлээд холбоо барих мэдээлэл шалгана
        if (!validateContactInfo()) {
          setIsSubmitting(false);
          return;
        }
        if (!validateAddress(guestAddress)) {
          setIsSubmitting(false);
          return;
        }
        orderPayload.fullName = guestAddress.fullName.trim() || 'Хэрэглэгч';
        orderPayload.phoneNumber = guestAddress.phoneNumber.trim();
        orderPayload.email = 'gerarhousehold@gmail.com';

        if (!orderPayload.fullName || orderPayload.fullName.length < 2) {
          toast.warning('Нэр хамгийн багадаа 2 үсэг байх ёстой');
          setIsSubmitting(false);
          return;
        }
        if (!orderPayload.phoneNumber || orderPayload.phoneNumber.length !== 8) {
          toast.warning('8 оронтой утасны дугаар оруулна уу');
          setIsSubmitting(false);
          return;
        }

        orderPayload.address = {
          fullName: orderPayload.fullName,
          phoneNumber: orderPayload.phoneNumber,
          provinceOrDistrict: guestAddress.provinceOrDistrict.trim(),
          khorooOrSoum: '1-р хороо', // Guest үед default
          street: guestAddress.street?.trim() || undefined,
          neighborhood: guestAddress.neighborhood?.trim() || undefined,
          residentialComplex: guestAddress.residentialComplex?.trim() || undefined,
          building: guestAddress.building?.trim() || undefined,
          entrance: '1',
          apartmentNumber: guestAddress.apartmentNumber?.trim() || undefined,
          addressNote: guestAddress.addressNote?.trim() || undefined,
          label: 'Гэр',
        };
        orderPayload.sessionToken = typeof window !== 'undefined' ? getSessionToken() || '' : '';
      }

      const response = await createOrderMutation.mutateAsync(orderPayload);

      if (!response.data?.id) {
        toast.error('Захиалгын ID олдсонгүй');
        setIsSubmitting(false);
        return;
      }

      if (userEmail?.trim()) localStorage.setItem('user_email', userEmail.trim());
      if (userName?.trim()) localStorage.setItem('user_name', userName.trim());

      router.push(`/orders/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Захиалга үүсгэхэд алдаа гарлаа');
      setIsSubmitting(false);
    }
  };

  const _handleLogout = async () => {
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
    if (!newAddress.label?.trim()) {
      toast.warning('Хаягийн гарчиг оруулна уу');
      return;
    }
    if (!validateAddress(newAddress)) {
      return;
    }

    // Include user's name and phone from contact section
    const addressData: CreateAddressRequest = {
      ...newAddress,
      fullName: userName,
      phoneNumber: userPhone,
      label: newAddress.label?.trim() || undefined,
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
  const deliveryFee = getDeliveryFee(subtotal);
  const walletBalance = 0;
  const total = subtotal + deliveryFee - walletBalance;

  const _selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

  // Show loading only after mount to avoid hydration mismatch
  if (!isMounted || (isAuthenticated && addressesLoading)) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isContactValid = isAuthenticated
    ? userName && userPhone?.length === 8 && userEmail
    : guestAddress.phoneNumber?.length === 8;

  const isAddressValid = isAuthenticated
    ? addresses.length > 0
      ? selectedAddressId
      : newAddress.label?.trim() && newAddress.provinceOrDistrict && newAddress.khorooOrSoum
    : guestAddress.provinceOrDistrict &&
      guestAddress.residentialComplex &&
      guestAddress.apartmentNumber;

  const isOrderInfoValid =
    deliveryDate &&
    deliveryTimeSlot &&
    (ebarimtType === 'CITIZEN' || (ebarimtType === 'COMPANY' && ebarimtRegNo && ebarimtOrgName));

  const isDisabled =
    !isContactValid ||
    !isAddressValid ||
    !isOrderInfoValid ||
    isFetchingOrg ||
    createOrderMutation.isPending ||
    createAddressMutation.isPending ||
    isSubmitting;

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-6 pt-4">
        {/* Breadcrumbs */}
        <div className="mb-6 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Link href="/" className="hover:text-primary">
              Нүүр хуудас
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/cart" className="hover:text-primary">
              Сагс
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">Захиалгын хаяг</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="text-gray-400 cursor-default" aria-disabled="true">
              Төлбөр
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Left Column - Contact and Delivery Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information Section */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Холбоо барих мэдээлэл</h2>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
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
                      <label className="font-medium text-gray-700 mb-1 block">
                        Утасны дугаар <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={phoneInputRef}
                        value={userPhone}
                        onChange={e => {
                          setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 8));
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder="Утасны дугаар"
                        maxLength={8}
                        required
                        className={
                          phoneError
                            ? 'border-2 border-red-500 focus:border-red-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                            : ''
                        }
                      />
                      {phoneError && (
                        <span className="text-xs text-red-500 mt-1 block">{phoneError}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 mb-1 block">
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
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
                        Утасны дугаар <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={phoneInputRef}
                        value={guestAddress.phoneNumber}
                        onChange={e => {
                          setGuestAddress({
                            ...guestAddress,
                            phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                          });
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder={userPhone || 'Утасны дугаар'}
                        maxLength={8}
                        required
                        className={
                          phoneError
                            ? 'border-2 border-red-500 focus:border-red-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                            : ''
                        }
                      />
                      {phoneError && (
                        <span className="text-xs text-red-500 mt-1 block">{phoneError}</span>
                      )}
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
                        Нэр (заавал биш)
                      </label>
                      <Input
                        value={guestAddress.fullName}
                        onChange={e =>
                          setGuestAddress({ ...guestAddress, fullName: e.target.value })
                        }
                        placeholder="Хэрэглэгч"
                        className="placeholder:text-gray-300"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Бүртгэлтэй хэрэглэгч?{' '}
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                      className="text-primary font-medium hover:underline"
                    >
                      Нэвтрэх
                    </button>
                  </p>
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
                    {/* Label input at the top - ONLY for authenticated users */}
                    {isAuthenticated && (
                      <div>
                        <label className=" font-medium text-gray-700 mb-1 block">
                          Хаягийн гарчиг <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={newAddress.label || ''}
                          onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                          placeholder="Жишээ: гэр, ажил, оффис"
                          required
                          disabled={
                            createAddressMutation.isPending || updateAddressMutation.isPending
                          }
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className=" font-medium text-gray-700 mb-1 block">
                          Дүүрэг <span className="text-red-500">*</span>
                        </label>
                        <select
                          ref={districtInputRef}
                          value={selectedDistrict}
                          onChange={e => {
                            setSelectedDistrict(e.target.value);
                            setNewAddress({
                              ...newAddress,
                              provinceOrDistrict: e.target.value,
                              khorooOrSoum: '',
                            });
                            if (districtError) setDistrictError('');
                          }}
                          className={`flex h-10 w-full rounded-md bg-background px-3 py-2 
  appearance-none
  focus:outline-none
  ${
    districtError
      ? 'border-2 border-red-500 focus:ring-0'
      : 'border border-input focus:ring-2 focus:ring-ring'
  }`}
                          required
                          disabled={
                            createAddressMutation.isPending || updateAddressMutation.isPending
                          }
                        >
                          <option value="">Дүүрэг сонгох</option>
                          {districts.map(district => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                        {districtError && (
                          <span className="text-xs text-red-500 mt-1 block">{districtError}</span>
                        )}
                      </div>
                      {isAuthenticated && (
                        <div>
                          <label className=" font-medium text-gray-700 mb-1 block">
                            Хороо <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={newAddress.khorooOrSoum}
                            onChange={e =>
                              setNewAddress({ ...newAddress, khorooOrSoum: e.target.value })
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2  ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                            {selectedDistrict &&
                              khorooOptions.map(khoroo => (
                                <option key={khoroo} value={khoroo}>
                                  {khoroo}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className=" font-medium text-gray-700 mb-1 block">
                          Байр<span className="text-red-500">*</span>
                        </label>
                        <Input
                          ref={buildingInputRef}
                          value={newAddress.residentialComplex}
                          onChange={e => {
                            setNewAddress({ ...newAddress, residentialComplex: e.target.value });
                            if (buildingError) setBuildingError('');
                          }}
                          required
                          placeholder="Байр"
                          className={
                            buildingError
                              ? 'border-2 border-red-500 focus:border-red-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                              : ''
                          }
                        />
                        {buildingError && (
                          <span className="text-xs text-red-500 mt-1 block">{buildingError}</span>
                        )}
                      </div>
                      <div>
                        <label className=" font-medium text-gray-700 mb-1 block">
                          Тоот<span className="text-red-500">*</span>
                        </label>
                        <Input
                          ref={apartmentInputRef}
                          value={newAddress.apartmentNumber || ''}
                          onChange={e => {
                            setNewAddress({ ...newAddress, apartmentNumber: e.target.value });
                            if (apartmentError) setApartmentError('');
                          }}
                          placeholder="Тоот"
                          required
                          className={
                            apartmentError
                              ? 'border-2 border-red-500 focus:border-red-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                              : ''
                          }
                          disabled={
                            createAddressMutation.isPending || updateAddressMutation.isPending
                          }
                        />
                        {apartmentError && (
                          <span className="text-xs text-red-500 mt-1 block">{apartmentError}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className=" font-medium text-gray-700 mb-1 block">
                        Дэлгэрэнгүй хаяг
                      </label>
                      <Textarea
                        value={newAddress.addressNote || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setNewAddress({
                            ...newAddress,
                            addressNote: e.target.value.slice(0, 500),
                          })
                        }
                        placeholder="Дэлгэрэнгүй хаягийн мэдээлэл"
                        maxLength={500}
                        rows={3}
                        className="text-base"
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
                            // !newAddress.label?.trim() ||
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className=" font-medium text-gray-700 mb-1 block">
                        Дүүрэг <span className="text-red-500">*</span>
                      </label>
                      <select
                        ref={districtInputRef}
                        value={selectedDistrict}
                        onChange={e => {
                          const district = e.target.value;
                          setSelectedDistrict(district);
                          setGuestAddress({ ...guestAddress, provinceOrDistrict: district });
                          if (districtError) setDistrictError('');
                        }}
                        className={`flex h-10 w-full rounded-md bg-background px-3 py-2 
  appearance-none
  focus:outline-none
  ${
    districtError
      ? 'border-2 border-red-500 focus:ring-0'
      : 'border border-input focus:ring-2 focus:ring-ring'
  }`}
                        required
                      >
                        <option value="">Дүүрэг сонгох</option>
                        {districts.map(district => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                      {districtError && (
                        <span className="text-xs text-red-500 mt-1 block">{districtError}</span>
                      )}
                    </div>
                    <div>
                      <label className=" font-medium text-gray-700 mb-1 block">
                        Байр<span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={buildingInputRef}
                        value={guestAddress.residentialComplex}
                        onChange={e => {
                          setGuestAddress({ ...guestAddress, residentialComplex: e.target.value });
                          if (buildingError) setBuildingError('');
                        }}
                        required
                        placeholder="Байр"
                        className={
                          buildingError
                            ? 'border-2 border-red-500 focus:border-red-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                            : ''
                        }
                      />
                      {buildingError && (
                        <span className="text-xs text-red-500 mt-1 block">{buildingError}</span>
                      )}
                    </div>
                    <div>
                      <label className=" font-medium text-gray-700 mb-1 block">
                        Тоот<span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={apartmentInputRef}
                        value={guestAddress.apartmentNumber}
                        onChange={e => {
                          setGuestAddress({ ...guestAddress, apartmentNumber: e.target.value });
                          if (apartmentError) setApartmentError('');
                        }}
                        required
                        placeholder="Тоотоо оруулна уу"
                        className={
                          apartmentError
                            ? 'border-2 border-red-500 focus:border-red-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                            : ''
                        }
                      />
                      {apartmentError && (
                        <span className="text-xs text-red-500 mt-1 block">{apartmentError}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className=" font-medium text-gray-700 mb-1 block">
                      Дэлгэрэнгүй хаяг
                    </label>
                    <Textarea
                      value={guestAddress.addressNote || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setGuestAddress({
                          ...guestAddress,
                          addressNote: e.target.value.slice(0, 500),
                        })
                      }
                      placeholder="Хаягийн дэлгэрэнгүй мэдээлэл"
                      maxLength={500}
                      className="text-base"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Delivery Date */}
              <div className="mt-6" ref={deliveryDateRef}>
                <label className="mb-3 font-medium block">
                  Хүргэлтийн өдөр сонгох <span className="text-red-500">*</span>
                </label>
                <div>
                  <MongolianDatePicker
                    value={deliveryDate}
                    onChange={d => {
                      setDeliveryDate(d);
                      if (deliveryDateError) setDeliveryDateError('');
                    }}
                    minDate={new Date().toISOString().split('T')[0]}
                    isDateDisabled={isDeliveryDateDisabled}
                    className={
                      deliveryDateError ? 'border-2 border-red-500 rounded-md p-2 max-w-max' : ''
                    }
                  />
                </div>
                {deliveryDateError && (
                  <span className="text-xs text-red-500 mt-1 block">{deliveryDateError}</span>
                )}
              </div>

              {/* Delivery Time Slot */}
              <div className="mt-6" ref={deliveryTimeSlotRef}>
                <p className="mb-3 font-medium">
                  Хүргэлтийн цаг сонгох <span className="text-red-500">*</span>
                </p>
                <div
                  className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${deliveryTimeSlotError ? 'border-2 border-red-500 rounded-md p-2' : ''}`}
                >
                  {DELIVERY_SLOT_ORDER.map((slot, slotIndex) => {
                    const formatTimeSlot = (s: string) => {
                      const [start, end] = s.split('-');
                      const formatHour = (hour: string) => {
                        if (hour === '00') return '00:00';
                        return `${hour.padStart(2, '0')}:00`;
                      };
                      return `${formatHour(start)} - ${formatHour(end)}`;
                    };

                    // First future slot index when delivery is today (we skip it, offer from second slot)
                    const firstFutureSlotIndex =
                      deliveryDate === getTodayDateString() ? getFirstFutureSlotIndex() : null;

                    // Check if time slot is available (off slots for date, then current/past/skip-next for today)
                    const isTimeSlotAvailable = (): boolean => {
                      if (!deliveryDate) return false;
                      // Off for every date (global) or for this date only
                      if (
                        offTimeSlots.includes(slot) ||
                        offTimeSlotsByDate[deliveryDate]?.includes(slot)
                      )
                        return false;

                      const today = new Date();
                      const todayDateStr = getTodayDateString();
                      const currentTimeInHours = today.getHours() + today.getMinutes() / 60;

                      // If delivery date is in the future, all slots available except: tomorrow's first slot after 20:50
                      if (deliveryDate > todayDateStr) {
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
                        if (
                          deliveryDate === tomorrowStr &&
                          currentTimeInHours >= 20 + 50 / 60 &&
                          slotIndex === 0
                        ) {
                          return false;
                        }
                        return true;
                      }

                      // If delivery date is today, check if slot is available
                      if (deliveryDate === todayDateStr) {
                        const [startHour, endHour] = slot.split('-');
                        const slotStartHour = parseInt(startHour === '00' ? '24' : startHour);
                        const slotEndHour = parseInt(endHour === '00' ? '24' : endHour);
                        const currentHour = today.getHours();
                        const currentMinute = today.getMinutes();
                        const currentTimeInHours = currentHour + currentMinute / 60;

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

                        // Skip the next (first future) slot; only second slot and later are available
                        if (firstFutureSlotIndex !== null && slotIndex === firstFutureSlotIndex) {
                          return false;
                        }

                        // Slot is in the future and not the skipped "next" slot - enable it
                        return true;
                      }

                      return false;
                    };

                    const isAvailable = isTimeSlotAvailable();

                    return (
                      <button
                        key={slot}
                        onClick={() => {
                          if (isAvailable) {
                            setDeliveryTimeSlot(slot);
                            if (deliveryTimeSlotError) setDeliveryTimeSlotError('');
                          }
                        }}
                        disabled={!isAvailable}
                        className={`p-3 border-2 rounded-lg  font-medium transition-colors ${
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
                {deliveryTimeSlotError && (
                  <span className="text-xs text-red-500 mt-1 block">{deliveryTimeSlotError}</span>
                )}
              </div>

              {/* Ebarimt Section */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Image
                      src="/ebarimt-logo.svg"
                      alt="Ebarimt"
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <h3 className="text-lg font-semibold">И-Баримт</h3>
                </div>

                <div className="space-y-1 flex w-full gap-2">
                  {/* Citizen Option */}
                  <div
                    onClick={() => setEbarimtType('CITIZEN')}
                    className={`p-2 w-1/2 rounded-xl border-2 cursor-pointer transition-all ${
                      ebarimtType === 'CITIZEN'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          ebarimtType === 'CITIZEN' ? 'border-primary' : 'border-gray-300'
                        }`}
                      >
                        {ebarimtType === 'CITIZEN' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="font-medium text-sm sm:text-base">Хувь хүн</span>
                    </div>
                  </div>

                  {/* Organization Option */}
                  <div
                    onClick={() => setEbarimtType('COMPANY')}
                    className={`p-2 w-1/2 h-full rounded-xl border-2 cursor-pointer transition-all ${
                      ebarimtType === 'COMPANY'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 ">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          ebarimtType === 'COMPANY' ? 'border-primary' : 'border-gray-300'
                        }`}
                      >
                        {ebarimtType === 'COMPANY' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="font-medium text-sm sm:text-base">Байгууллага</span>
                    </div>
                  </div>
                </div>
                {ebarimtType === 'COMPANY' && (
                  <div className="mt-2 space-y-2" onClick={e => e.stopPropagation()}>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 flex gap-3">
                      {/* <Info className="w-5 h-5 text-amber-500 shrink-0" /> */}
                      <p className="text-xs text-amber-800 leading-snug text-justify">
                        Та байгууллагын регистрийн дугаараа зөв бичнэ үү. Төлбөр төлөгдсөн
                        тохиолдолд регистрийн дугаараа солих боломжгүйг анхаарна уу!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-base text-gray-500 mb-1 block">
                          Байгууллагын регистр <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            value={ebarimtRegNo}
                            onChange={e => {
                              setEbarimtRegNo(e.target.value.replace(/\D/g, '').slice(0, 10));
                              if (ebarimtRegNoError) setEbarimtRegNoError('');
                            }}
                            placeholder="Регистрийн дугаар"
                            className={`bg-white ${ebarimtRegNoError ? 'border-2 border-red-500 focus:border-red-500 focus-visible:ring-0 focus-visible:ring-offset-0' : 'border-gray-200'}`}
                          />
                          {isFetchingOrg && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            </div>
                          )}
                        </div>
                        {ebarimtRegNoError && (
                          <span className="text-xs text-red-500 mt-1 block">
                            {ebarimtRegNoError}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="text-base  text-gray-500 mb-1 block ">
                          Байгууллагын нэр <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={ebarimtOrgName}
                          readOnly
                          placeholder=""
                          className="bg-gray-100 text-base border-gray-200 text-gray-600 cursor-not-allowed placeholder:text-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Үйлчилгээний нөхцлийн текст */}
              <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  Төлбөр төлөх товч дарснаар та манай{' '}
                  <button
                    type="button"
                    className="text-primary font-semibold hover:text-primary/80 focus:outline-none"
                    onClick={() => setShowTermsModal(true)}
                  >
                    үйлчилгээний нөхцөл
                  </button>
                  -ийг зөвшөөрсөнд тооцно
                </span>
                <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
                  <DialogContent className="sm:max-w-3xl max-w-lg">
                    <TermsPrivacyModal onClose={() => setShowTermsModal(false)} />
                  </DialogContent>
                </Dialog>
                <a
                  href="/cart"
                  className="inline-flex items-center mt-2 gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors group"
                >
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  Сагс руу буцах
                </a>
              </div>

              <Button
                onClick={handleCreateOrder}
                disabled={isSubmitting}
                className="w-full mt-4 bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isSubmitting &&
                (!isAuthenticated
                  ? guestAddress.phoneNumber?.length === 8 &&
                    guestAddress.provinceOrDistrict &&
                    guestAddress.residentialComplex &&
                    guestAddress.apartmentNumber &&
                    deliveryDate &&
                    deliveryTimeSlot
                  : userName &&
                    userPhone?.length === 8 &&
                    userEmail &&
                    (addresses.length > 0
                      ? selectedAddressId
                      : newAddress.label?.trim() &&
                        newAddress.provinceOrDistrict &&
                        newAddress.khorooOrSoum) &&
                    deliveryDate &&
                    deliveryTimeSlot) ? (
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

          {/* Right Column - Order Summary */}
          <div className="hidden lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Захиалгын хураангуй</h3>

              {/* Products */}
              <div className="space-y-4 mb-6">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-20 shrink-0">
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
                disabled={isDisabled}
                className="w-full mt-4 bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isSubmitting ? (
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
