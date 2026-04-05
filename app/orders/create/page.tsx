'use client';

import { useRef } from 'react';
import { useState, useEffect } from 'react';
import { useIsAuthenticated } from '@/components/use-is-authenticated';

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronRight, ChevronLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { MongolianDatePicker } from '@/components/mongolian-date-picker';
import {
  useOrderCreate,
  useAddresses,
  useAddressCreate,
  useAddressUpdate,
  useAddressDelete,
  useCart,
  GuestAddress,
  useDistricts,
  useOffDeliveryDates,
  validateDeliveryTimeSlot,
  authApi,
  useCurrentUser,
  type CreateAddressRequest,
  type Address,
} from '@/lib/api';
import { A_ZONE } from '@/lib/zones';
import Image from 'next/image';
import { toast } from 'sonner';
import Link from 'next/link';
import { getDeliveryFee } from '@/lib/utils';
import { getSessionToken } from '@/lib/api';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TermsPrivacyModal from '@/components/terms-privacy-modal';

export default function OrderCreatePage() {
  const guestDeliveryDateRef = useRef<HTMLDivElement>(null);
  const [guestDeliveryDateError, setGuestDeliveryDateError] = useState(false);
  const guestTootRef = useRef<HTMLInputElement>(null);
  const [guestTootError, setGuestTootError] = useState(false);
  // Delivery time slot error state for guest
  const [guestDeliveryTimeSlotError, setGuestDeliveryTimeSlotError] = useState(false);
  const guestOrtsRef = useRef<HTMLInputElement>(null);
  const [guestOrtsError, setGuestOrtsError] = useState(false);
  const guestBairRef = useRef<HTMLInputElement>(null);
  const [guestBairError, setGuestBairError] = useState(false);
  const guestKhorooRef = useRef<HTMLSelectElement>(null);
  const [guestKhorooError, setGuestKhorooError] = useState(false);
  const userDistrictRef = useRef<HTMLSelectElement>(null);
  const guestDistrictRef = useRef<HTMLSelectElement>(null);
  const [userDistrictError, setUserDistrictError] = useState(false);
  // Error state for address label (authenticated user)
  const [userAddressLabelError, setUserAddressLabelError] = useState(false);
  const [guestDistrictError, setGuestDistrictError] = useState(false);
  // Refs for error scrolling (must be before state to avoid TDZ)
  const userNameInputRef = useRef<HTMLInputElement>(null);
  const guestNameInputRef = useRef<HTMLInputElement>(null);
  const userPhoneInputRef = useRef<HTMLInputElement>(null);
  const guestPhoneInputRef = useRef<HTMLInputElement>(null);
  // Error states for name/phone fields
  const [userNameError, setUserNameError] = useState(false);
  const [guestNameError, setGuestNameError] = useState(false);
  const [userPhoneError, setUserPhoneError] = useState(false);
  const [guestPhoneError, setGuestPhoneError] = useState(false);

  // Error state for user khoroo select
  const [userKhorooError, setUserKhorooError] = useState(false);
  // Error state for user Орц, Тоот
  const [userOrtsError, setUserOrtsError] = useState(false);
  const [userTootError, setUserTootError] = useState(false);
  // Error state for user Байр
  const [userBairError, setUserBairError] = useState(false);

  // State for save address error
  const [showSaveAddressError, setShowSaveAddressError] = useState(false);
  console.log('showSaveAddressError:', showSaveAddressError);

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
  const { data: userResponse } = useCurrentUser();
  const currentUser = userResponse?.data;
  const addresses = addressesResponse?.data || [];
  // Robust detection of point products and filtering
  const cartItems = (cartResponse?.data || [])
    .map(item => ({
      ...item,
      _computedIsPointProduct:
        item.isPointProduct ||
        (item as any).is_point_product ||
        !!(item.pointProduct || (item as any).point_product),
    }))
    .filter(item => (item.product || item.pointProduct || (item as any).point_product) != null);

  // Use custom hook for authentication state
  const isAuthenticated = useIsAuthenticated();
  const [isMounted, setIsMounted] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [savedEmailPlaceholder, setSavedEmailPlaceholder] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const [showTermsModal, setShowTermsModal] = useState(false);

  // Set mount state after mount to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<
    '10-14' | '14-18' | '18-21' | '21-00' | ''
  >('');
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  // Districts and khoroo
  const { data: districtsResponse } = useDistricts();
  const districts = Array.isArray(districtsResponse?.data) ? districtsResponse.data : [];
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  // Backend khoroo fetching is disabled. Use A_ZONE for khoroo options.
  const khorooLoading = false;
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
    return offWeekdays.includes(weekday);
  };

  // Use static khoroo options from A_ZONE
  const khorooOptions =
    selectedDistrict &&
    (A_ZONE[selectedDistrict.replace(' дүүрэг', '')] || A_ZONE[selectedDistrict] || []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ebarimt state
  const [ebarimtType, setEbarimtType] = useState<'CITIZEN' | 'COMPANY'>('CITIZEN');
  const [ebarimtRegNo, setEbarimtRegNo] = useState('');
  const [ebarimtOrgName, setEbarimtOrgName] = useState('');
  const [isFetchingOrg, setIsFetchingOrg] = useState(false);
  // Error state for ebarimtRegNo
  const [ebarimtRegNoError, setEbarimtRegNoError] = useState(false);

  // Debug: Log khoroo response
  useEffect(() => {
    if (selectedDistrict) {
      console.log('Selected district:', selectedDistrict);
      // console.log('Khoroo response:', khorooResponse);
      console.log('Khoroo options:', khorooOptions);
      console.log('Khoroo loading:', khorooLoading);
      // console.log('Khoroo error:', khorooError);
      // if (khorooError) {
      //   console.error('Khoroo API Error:', khorooError);
      // }
    }
  }, [selectedDistrict, khorooOptions, khorooLoading]);

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
            // Guest: Хүргэлтийн өдөр, цаг заавал
            if (!deliveryDate) {
              setGuestDeliveryDateError(true);
              setIsSubmitting(false);
              setTimeout(() => {
                guestDeliveryDateRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }, 400);
              return;
            } else {
              setGuestDeliveryDateError(false);
            }
            if (!deliveryTimeSlot) {
              setGuestDeliveryTimeSlotError(true);
              setIsSubmitting(false);
              setTimeout(() => {
                const el = document.getElementById('guest-delivery-time-slot');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 400);
              return;
            } else {
              setGuestDeliveryTimeSlotError(false);
            }
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
    residentialComplex: '',
    entrance: '',
    apartmentNumber: '',
    street: '',
    neighborhood: '',
    building: '',
    addressNote: '',
    label: '',
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
    label: 'Хоосон', // Default label for guest address
    email: '', // Optional email field for guest address
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
  }): boolean => {
    // Хороо/Сум заавал биш тул шалгахгүй
    return true;
  };

  const validateContactInfo = (): boolean => {
    if (isAuthenticated) {
      if (!userName.trim()) {
        return false;
      }
      if (!userPhone || userPhone.length !== 8) {
        toast.warning('8 оронтой утасны дугаар оруулна уу');
        return false;
      }
      // Email is now optional for user; no validation or toast
    } else {
      if (!guestAddress.fullName.trim()) {
        return false;
      }
      if (!guestAddress.phoneNumber || guestAddress.phoneNumber.length !== 8) {
        toast.warning('8 оронтой утасны дугаар оруулна уу');
        return false;
      }
      // Guest email is now optional
    }
    return true;
  };
  console.log('addresses:', addresses);
  const handleCreateOrder = async () => {
    try {
      setIsSubmitting(true);

      // Always check fields in order for both user and guest

      if (isAuthenticated) {
        if (!userName || !userName.trim()) {
          setUserNameError(true);
          setIsSubmitting(false);
          setTimeout(() => {
            userNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400); // delay scroll for slower effect
          return;
        } else {
          setUserNameError(false);
        }
        if (!userPhone || userPhone.length !== 8) {
          setUserPhoneError(true);
          setIsSubmitting(false);
          setTimeout(() => {
            userPhoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400);
          return;
        } else {
          setUserPhoneError(false);
        }
        console.log('end irjin0');

        if (addresses.length === 0) {
          // Prevent further validation and scroll if address must be saved
          if (showSaveAddressError) {
            setIsSubmitting(false);
            return;
          }
          if (!newAddress.label || !newAddress.label.trim()) {
            setUserAddressLabelError(true);
            setIsSubmitting(false);
            setTimeout(() => {
              const el = document.getElementById('user-address-label-input');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
            return;
          } else {
            setUserAddressLabelError(false);
          }

          if (!newAddress.provinceOrDistrict || !newAddress.provinceOrDistrict.trim()) {
            setUserDistrictError(true);
            setIsSubmitting(false);
            setTimeout(() => {
              userDistrictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
            return;
          } else {
            setUserDistrictError(false);
          }
          if (!newAddress.khorooOrSoum || !newAddress.khorooOrSoum.trim()) {
            // Хороо заавал биш, алгасана
            setUserKhorooError(false);
          }
          if (!newAddress.residentialComplex || !newAddress.residentialComplex.trim()) {
            setUserBairError(true);
            setIsSubmitting(false);
            setTimeout(() => {
              const el = document.getElementById('user-bair-input');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
            return;
          } else {
            setUserBairError(false);
          }
          if (!newAddress.entrance || !newAddress.entrance.trim()) {
            setUserOrtsError(true);
            setIsSubmitting(false);
            setTimeout(() => {
              const el = document.getElementById('user-orts-input');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
            return;
          } else {
            setUserOrtsError(false);
          }
          if (!newAddress.apartmentNumber || !newAddress.apartmentNumber.trim()) {
            setUserTootError(true);
            setIsSubmitting(false);
            setTimeout(() => {
              const el = document.getElementById('user-toot-input');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
            return;
          } else {
            setUserTootError(false);
          }
        }
        console.log('end irjin1');
        // Custom: If user is authenticated and must save address, show red border and message on save button (after toot check)
        if (addresses.length === 0 && !showAddAddressForm) {
          setShowAddAddressForm(true);
          setTimeout(() => {
            const el = document.getElementById('user-address-label-input');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 400);
          setIsSubmitting(false);
          setShowSaveAddressError(true);
          return;
        } else if (addresses.length !== 0) {
          setShowSaveAddressError(false);
        } else {
          setShowSaveAddressError(false);
        }
        console.log('end irjin2');
      } else {
        if (!guestAddress.fullName || !guestAddress.fullName.trim()) {
          setGuestNameError(true);
          setIsSubmitting(false);
          setTimeout(() => {
            guestNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400); // delay scroll for slower effect
          return;
        } else {
          setGuestNameError(false);
        }
        if (!guestAddress.phoneNumber || guestAddress.phoneNumber.length !== 8) {
          setGuestPhoneError(true);
          setIsSubmitting(false);
          setTimeout(() => {
            guestPhoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400);
          return;
        } else {
          setGuestPhoneError(false);
        }

        if (!guestAddress.provinceOrDistrict || !guestAddress.provinceOrDistrict.trim()) {
          setGuestDistrictError(true);
          setIsSubmitting(false);
          setTimeout(() => {
            guestDistrictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400);
          return;
        } else {
          setGuestDistrictError(false);
        }
        if (!guestAddress.khorooOrSoum || !guestAddress.khorooOrSoum.trim()) {
          // Хороо заавал биш, алгасана
          setGuestKhorooError(false);
        }
        if (!guestAddress.residentialComplex || !guestAddress.residentialComplex.trim()) {
          setGuestBairError(true);
          setIsSubmitting(false);
          setTimeout(() => {
            guestBairRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400);
          return;
        } else {
          setGuestBairError(false);
        }
        if (!guestAddress.entrance || !guestAddress.entrance.trim()) {
          setGuestOrtsError(true);
          setIsSubmitting(false);
          setTimeout(() => {
            guestOrtsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400);
          return;
        } else {
          setGuestOrtsError(false);
        }
        if (!guestAddress.apartmentNumber || !guestAddress.apartmentNumber.trim()) {
          setGuestTootError(true);
          setIsSubmitting(false);
          setTimeout(() => {
            guestTootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400);
          return;
        } else {
          setGuestTootError(false);
        }
      }

      if (cartItems.length === 0) {
        toast.warning('Сагс хоосон', {
          description: 'Захиалга үүсгэхийн тулд сагсанд бүтээгдэхүүн байх ёстой',
        });
        router.push('/cart');
        return;
      }

      if (!deliveryDate) {
        setGuestDeliveryDateError(true);
        setIsSubmitting(false);
        setTimeout(() => {
          guestDeliveryDateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
        return;
      } else {
        setGuestDeliveryDateError(false);
      }

      if (!deliveryTimeSlot) {
        setGuestDeliveryTimeSlotError(true);
        setIsSubmitting(false);
        setTimeout(() => {
          const el = document.getElementById('guest-delivery-time-slot');
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
        return;
      } else {
        setGuestDeliveryTimeSlotError(false);
      }

      // Points balance check
      if (isAuthenticated && currentUser) {
        if (pointsSubtotal > currentUser.points) {
          toast.error('Урамшууллын оноо хүрэлцэхгүй байна', {
            description: `Танд ${currentUser.points} оноо байгаа бөгөөд энэ захиалгад ${pointsSubtotal} оноо шаардлагатай байна.`,
          });
          setIsSubmitting(false);
          return;
        }
      } else if (pointsSubtotal > 0 && !isAuthenticated) {
        toast.error('Нэвтрэх шаардлагатай', {
          description: 'Онооны бараа худалдан авахын тулд заавал нэвтэрсэн байх шаардлагатай.',
        });
        setIsSubmitting(false);
        return;
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

      if (!validateContactInfo()) {
        setIsSubmitting(false);
        return;
      }

      if (ebarimtType === 'COMPANY') {
        if (!ebarimtRegNo.trim()) {
          setEbarimtRegNoError(true);
          setIsSubmitting(false);
          setTimeout(() => {
            const el = document.getElementById('ebarimt-regno-input');
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400);
          return;
        } else {
          setEbarimtRegNoError(false);
        }
        if (!ebarimtOrgName.trim()) {
          toast.warning('Байгууллагын нэр олдсонгүй. Регистрийн дугаараа шалгана уу');
          setIsSubmitting(false);
          return;
        }
      }

      const receiverPhone = (isAuthenticated ? userPhone : guestAddress.phoneNumber) || '';

      let orderPayload: any = {
        deliveryTimeSlot: deliveryTimeSlot as '10-14' | '14-18' | '18-21' | '21-00',
        deliveryDate: deliveryDate,
        ebarimtReceiverType: ebarimtType,
        ebarimtReceiver: ebarimtType === 'COMPANY' ? ebarimtRegNo : (receiverPhone || '').trim(),
        ebarimtReceiverName: ebarimtType === 'COMPANY' ? ebarimtOrgName : undefined,
      };

      if (isAuthenticated) {
        // Removed blocking for missing selectedAddressId
        orderPayload.addressId = selectedAddressId;
        orderPayload.fullName = userName.trim();
        orderPayload.phoneNumber = userPhone.trim();
        // If user email is empty, use default
        orderPayload.email = (userEmail && userEmail.trim()) || 'gerarhousehold@gmail.com';

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
        // Removed email validation toast and blocking for user flow
      } else {
        if (!validateAddress(guestAddress)) {
          setIsSubmitting(false);
          return;
        }

        orderPayload.fullName = guestAddress.fullName.trim();
        orderPayload.phoneNumber = guestAddress.phoneNumber.trim();
        // If guest email is empty, use default
        orderPayload.email =
          (guestAddress.email && guestAddress.email.trim()) || 'gerarhousehold@gmail.com';

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
          khorooOrSoum:
            guestAddress.khorooOrSoum && guestAddress.khorooOrSoum.trim()
              ? guestAddress.khorooOrSoum.trim()
              : '1-р хороо',
          street: guestAddress.street?.trim() || undefined,
          neighborhood: guestAddress.neighborhood?.trim() || undefined,
          residentialComplex: guestAddress.residentialComplex?.trim() || undefined,
          building: guestAddress.building?.trim() || undefined,
          entrance: guestAddress.entrance?.trim() || undefined,
          apartmentNumber: guestAddress.apartmentNumber?.trim() || undefined,
          addressNote: guestAddress.addressNote?.trim() || undefined,
          label: 'Хоосон', // Default label for guest address
        }; // End of address payload
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
      khorooOrSoum:
        address.khorooOrSoum && address.khorooOrSoum.trim()
          ? address.khorooOrSoum.trim()
          : '1-р хороо',
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
      khorooOrSoum:
        newAddress.khorooOrSoum && newAddress.khorooOrSoum.trim()
          ? newAddress.khorooOrSoum.trim()
          : '1-р хороо',
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
  const cashSubtotal = cartItems.reduce((sum, item) => {
    if (item._computedIsPointProduct) return sum;
    const productData = item.product || (item as any).product;
    return sum + parseFloat(productData?.price || '0') * item.quantity;
  }, 0);

  const pointsSubtotal = cartItems.reduce((sum, item) => {
    if (!item._computedIsPointProduct) return sum;
    const productData = item.pointProduct || (item as any).point_product || item.product;
    return sum + ((productData as any)?.pointsPrice || 0) * item.quantity;
  }, 0);
  const deliveryFee = getDeliveryFee(cashSubtotal);
  const total = cashSubtotal + deliveryFee;

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
    : guestAddress.fullName && guestAddress.phoneNumber?.length === 8 && guestAddress.email;

  const isAddressValid = isAuthenticated
    ? addresses.length > 0
      ? selectedAddressId
      : newAddress.label?.trim() && newAddress.provinceOrDistrict && newAddress.khorooOrSoum
    : guestAddress.label?.trim() && guestAddress.provinceOrDistrict && guestAddress.khorooOrSoum;

  const isOrderInfoValid = deliveryDate && deliveryTimeSlot;

  const isDisabled =
    !isContactValid ||
    !isAddressValid ||
    !isOrderInfoValid ||
    (ebarimtType === 'COMPANY' && (!ebarimtRegNo || !ebarimtOrgName)) ||
    isFetchingOrg ||
    createOrderMutation.isPending ||
    createAddressMutation.isPending ||
    isSubmitting;

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6  py-6">
        {/* Breadcrumbs */}
        <div className="mb-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact and Delivery Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information Section */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Холбоо барих</h2>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
                        Нэр <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={userNameInputRef}
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        placeholder="Нэр"
                        required
                        className={`${userNameError ? 'border-red-500' : ''}`}
                        style={
                          userNameError
                            ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                            : {}
                        }
                      />
                      {userNameError && <p className="text-xs text-red-600 mt-1">Нэр оруулна уу</p>}
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
                        Утасны дугаар <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={userPhoneInputRef}
                        value={userPhone}
                        onChange={e => setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="Утасны дугаар"
                        maxLength={8}
                        required
                        className={`${userPhoneError ? 'border-red-500' : ''}`}
                        style={
                          userPhoneError
                            ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                            : {}
                        }
                      />
                      {userPhoneError && (
                        <p className="text-xs text-red-600 mt-1">
                          8 оронтой утасны дугаар оруулна уу
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 mb-1 block">
                      И-мэйл хаяг <span className="text-gray-400">(заавал биш)</span>
                    </label>
                    <Input
                      type="email"
                      value={userEmail}
                      onChange={e => setUserEmail(e.target.value)}
                      placeholder={savedEmailPlaceholder || 'Имэйл'}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
                        Нэр <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={guestNameInputRef}
                        value={guestAddress.fullName}
                        onChange={e =>
                          setGuestAddress({ ...guestAddress, fullName: e.target.value })
                        }
                        placeholder="Нэрээ оруулна уу"
                        required
                        className={`${guestNameError ? 'border-red-500' : ''}`}
                        style={
                          guestNameError
                            ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                            : {}
                        }
                      />
                      {guestNameError && (
                        <p className="text-xs text-red-600 mt-1">Нэр оруулна уу</p>
                      )}
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
                        Утасны дугаар <span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={guestPhoneInputRef}
                        value={guestAddress.phoneNumber}
                        onChange={e =>
                          setGuestAddress({
                            ...guestAddress,
                            phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 8),
                          })
                        }
                        placeholder={userPhone || 'xxxx-xxxx'}
                        maxLength={8}
                        required
                        className={`${guestPhoneError ? 'border-red-500' : ''}`}
                        style={
                          guestPhoneError
                            ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                            : {}
                        }
                      />
                      {guestPhoneError && (
                        <p className="text-xs text-red-600 mt-1">
                          8 оронтой утасны дугаар оруулна уу
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 mb-1 block">
                      И-мэйл хаяг <span className="text-gray-400">(заавал биш)</span>
                    </label>
                    <Input
                      type="email"
                      value={guestAddress.email || ''}
                      onChange={e => setGuestAddress({ ...guestAddress, email: e.target.value })}
                      placeholder={savedEmailPlaceholder || 'user@gmail.com'}
                    />
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
              <h2 className="text-xl font-semibold mb-4">Хүргэлтийн мэдээлэл</h2>

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
                      <label className="font-medium text-gray-700 mb-1 block">
                        Хаягийн гарчиг <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="user-address-label-input"
                        value={newAddress.label || ''}
                        onChange={e => {
                          setNewAddress({ ...newAddress, label: e.target.value });
                          setUserAddressLabelError(false);
                        }}
                        placeholder="Жишээ: гэр, ажил, оффис"
                        className={`${userAddressLabelError ? 'border-red-500' : ''}`}
                        style={
                          userAddressLabelError
                            ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                            : {}
                        }
                        required
                        disabled={
                          createAddressMutation.isPending || updateAddressMutation.isPending
                        }
                      />
                      {userAddressLabelError && (
                        <p className="text-xs text-red-600 mt-1">Хаягийн гарчиг оруулна уу</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-medium text-gray-700 mb-1 block">
                          Дүүрэг <span className="text-red-500">*</span>
                        </label>
                        <select
                          ref={userDistrictRef}
                          value={selectedDistrict}
                          onChange={e => {
                            setSelectedDistrict(e.target.value);
                            setNewAddress({ ...newAddress, provinceOrDistrict: e.target.value });
                          }}
                          className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${userDistrictError ? 'border-red-500' : 'border-input'}`}
                          required
                          style={
                            userDistrictError
                              ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                              : {}
                          }
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
                        {userDistrictError && (
                          <p className="text-xs text-red-600 mt-1">Дүүрэг сонгоно уу</p>
                        )}
                      </div>
                      <div>
                        <label className="font-medium text-gray-700 mb-1 block">
                          Хороо <span className="text-gray-500"> (заавал биш)</span>
                        </label>
                        <select
                          id="user-khoroo-select"
                          value={newAddress.khorooOrSoum}
                          onChange={e => {
                            setNewAddress({ ...newAddress, khorooOrSoum: e.target.value });
                            setUserKhorooError(false);
                          }}
                          className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${userKhorooError ? 'border-red-500' : 'border-input'}`}
                          required
                          style={
                            userKhorooError
                              ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                              : {}
                          }
                          disabled={
                            createAddressMutation.isPending || !selectedDistrict || khorooLoading
                          }
                        >
                          <option value="">
                            {khorooLoading
                              ? 'Ачаалж байна...'
                              : selectedDistrict
                                ? 'Хороо сонгох'
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
                        {/* Хороо заавал биш тул алдаа харуулахгүй */}
                      </div>
                      <div>
                        <label className="font-medium text-gray-700 mb-1 block">
                          Байр<span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="user-bair-input"
                          value={newAddress.residentialComplex || ''}
                          onChange={e => {
                            setNewAddress({ ...newAddress, residentialComplex: e.target.value });
                            setUserBairError(false);
                          }}
                          required
                          placeholder="Байр"
                          className={`${userBairError ? 'border-red-500' : ''}`}
                          style={
                            userBairError
                              ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                              : {}
                          }
                        />
                        {userBairError && (
                          <p className="text-xs text-red-600 mt-1">Байр оруулна уу</p>
                        )}
                      </div>
                      <div>
                        <label className="font-medium text-gray-700 mb-1 block">
                          Орц<span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="user-orts-input"
                          value={newAddress.entrance || ''}
                          onChange={e => {
                            setNewAddress({ ...newAddress, entrance: e.target.value });
                            setUserOrtsError(false);
                          }}
                          placeholder="Орцны дугаар"
                          required
                          disabled={
                            createAddressMutation.isPending || updateAddressMutation.isPending
                          }
                          className={`${userOrtsError ? 'border-red-500' : ''}`}
                          style={
                            userOrtsError
                              ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                              : {}
                          }
                        />
                        {userOrtsError && (
                          <p className="text-xs text-red-600 mt-1">Орц оруулна уу</p>
                        )}
                      </div>
                      <div>
                        <label className="font-medium text-gray-700 mb-1 block">
                          Тоот<span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="user-toot-input"
                          value={newAddress.apartmentNumber || ''}
                          onChange={e => {
                            setNewAddress({ ...newAddress, apartmentNumber: e.target.value });
                            setUserTootError(false);
                          }}
                          placeholder="Тоот"
                          required
                          disabled={
                            createAddressMutation.isPending || updateAddressMutation.isPending
                          }
                          className={`${userTootError ? 'border-red-500' : ''}`}
                          style={
                            userTootError
                              ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                              : {}
                          }
                        />
                        {userTootError && (
                          <p className="text-xs text-red-600 mt-1">Тоот оруулна уу</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
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
                        disabled={
                          createAddressMutation.isPending || updateAddressMutation.isPending
                        }
                      />
                    </div>

                    {/* Save/Cancel Buttons - show when form is visible: adding new, editing, or user has no addresses */}
                    {(showAddAddressForm || addresses.length === 0) && (
                      <div className="flex gap-3 pt-4">
                        <div className="flex-1">
                          <Button
                            onClick={handleSaveAddress}
                            disabled={
                              createAddressMutation.isPending ||
                              updateAddressMutation.isPending ||
                              !newAddress.provinceOrDistrict ||
                              !newAddress.residentialComplex?.trim() ||
                              !newAddress.entrance?.trim() ||
                              !newAddress.apartmentNumber?.trim()
                            }
                            className={`w-full bg-primary hover:bg-primary/90 ${showSaveAddressError ? 'border-2 border-red-500' : ''}`}
                            style={
                              showSaveAddressError
                                ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                                : {}
                            }
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
                          {showSaveAddressError && (
                            <p className="text-xs text-red-600 mt-2 text-center font-semibold">
                              Хаягаа хадгална уу
                            </p>
                          )}
                        </div>
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
                      <label className="font-medium text-gray-700 mb-1 block">
                        Дүүрэг <span className="text-red-500">*</span>
                      </label>
                      <select
                        ref={guestDistrictRef}
                        value={selectedDistrict}
                        onChange={e => {
                          const district = e.target.value;
                          setSelectedDistrict(district);
                          setGuestAddress({ ...guestAddress, provinceOrDistrict: district });
                        }}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${guestDistrictError ? 'border-red-500' : 'border-input'}`}
                        required
                        style={
                          guestDistrictError
                            ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                            : {}
                        }
                      >
                        <option value="">Дүүрэг сонгох</option>
                        {districts.map(district => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                      {guestDistrictError && (
                        <p className="text-xs text-red-600 mt-1">Дүүрэг сонгоно уу</p>
                      )}
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
                        Хороо <span className="text-gray-500">(заавал биш)</span>
                      </label>
                      <select
                        ref={guestKhorooRef}
                        value={guestAddress.khorooOrSoum}
                        onChange={e => {
                          setGuestAddress({ ...guestAddress, khorooOrSoum: e.target.value });
                          setGuestKhorooError(false);
                        }}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${guestKhorooError ? 'border-red-500' : 'border-input'}`}
                        required
                        style={
                          guestKhorooError
                            ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                            : {}
                        }
                        disabled={!selectedDistrict || khorooLoading}
                      >
                        <option value="">
                          {khorooLoading
                            ? 'Ачаалж байна...'
                            : selectedDistrict
                              ? 'Хороо сонгох '
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
                      {/* Хороо заавал биш тул алдаа харуулахгүй */}
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
                        Байр<span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={guestBairRef}
                        value={guestAddress.residentialComplex}
                        onChange={e => {
                          setGuestAddress({ ...guestAddress, residentialComplex: e.target.value });
                          setGuestBairError(false);
                        }}
                        required
                        placeholder="Байр"
                        className={`${guestBairError ? 'border-red-500' : ''}`}
                        style={
                          guestBairError
                            ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                            : {}
                        }
                      />
                      {guestBairError && (
                        <p className="text-xs text-red-600 mt-1">Байр оруулна уу</p>
                      )}
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
                        Орц<span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={guestOrtsRef}
                        value={guestAddress.entrance}
                        onChange={e => {
                          setGuestAddress({ ...guestAddress, entrance: e.target.value });
                          setGuestOrtsError(false);
                        }}
                        required
                        placeholder="Орц"
                        className={`${guestOrtsError ? 'border-red-500' : ''}`}
                        style={
                          guestOrtsError
                            ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                            : {}
                        }
                      />
                      {guestOrtsError && (
                        <p className="text-xs text-red-600 mt-1">Орц оруулна уу</p>
                      )}
                    </div>
                    <div>
                      <label className="font-medium text-gray-700 mb-1 block">
                        Тоот<span className="text-red-500">*</span>
                      </label>
                      <Input
                        ref={guestTootRef}
                        value={guestAddress.apartmentNumber}
                        onChange={e => {
                          setGuestAddress({ ...guestAddress, apartmentNumber: e.target.value });
                          setGuestTootError(false);
                        }}
                        required
                        placeholder="Тоотоо оруулна уу"
                        className={`${guestTootError ? 'border-red-500' : ''}`}
                        style={
                          guestTootError
                            ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                            : {}
                        }
                      />
                      {guestTootError && (
                        <p className="text-xs text-red-600 mt-1">Тоот оруулна уу</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 mb-1 block">Дэлгэрэнгүй хаяг</label>
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
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Delivery Date */}
              <div className="mt-6" ref={guestDeliveryDateRef}>
                <label className="mb-3 font-medium block">
                  Хүргэлтийн өдөр сонгох <span className="text-red-500">*</span>
                </label>
                <div
                  className={`rounded-md border bg-white max-w-max ${guestDeliveryDateError ? 'border-red-500' : 'border-input'}`}
                  style={
                    guestDeliveryDateError
                      ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                      : {}
                  }
                >
                  <MongolianDatePicker
                    value={deliveryDate}
                    onChange={date => {
                      setDeliveryDate(date);
                      setGuestDeliveryDateError(false);
                    }}
                    minDate={new Date().toISOString().split('T')[0]}
                    isDateDisabled={isDeliveryDateDisabled}
                  />
                </div>
                {guestDeliveryDateError && (
                  <p className="text-xs text-red-600 mt-1">Хүргэлтийн огноо сонгоно уу</p>
                )}
              </div>

              {/* Delivery Time Slot */}
              <div className="mt-6" id="guest-delivery-time-slot">
                <p className="mb-3 font-medium">
                  Хүргэлтийн цаг сонгох <span className="text-red-500">*</span>
                </p>
                <div
                  className={`grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-md bg-white px-2 py-2 ${guestDeliveryTimeSlotError ? 'border-red-500' : 'border-input'}`}
                  style={
                    guestDeliveryTimeSlotError
                      ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                      : {}
                  }
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
                            setGuestDeliveryTimeSlotError(false);
                          }
                        }}
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
                {guestDeliveryTimeSlotError && (
                  <p className="text-xs text-red-600 mt-1">Хүргэлтийн цаг сонгоно уу</p>
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
                  <h3 className="text-lg font-semibold">ebarimt</h3>
                </div>

                <div className="flex flex-row gap-1 w-full">
                  {/* Citizen Option */}
                  <div
                    onClick={() => setEbarimtType('CITIZEN')}
                    className={`px-4 py-2 rounded-xl border-2 cursor-pointer transition-all w-1/2 ${
                      ebarimtType === 'CITIZEN'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-1 flex items-center justify-center ${
                          ebarimtType === 'CITIZEN' ? 'border-primary' : 'border-gray-300'
                        }`}
                      >
                        {ebarimtType === 'CITIZEN' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="font-medium text-sm">Хувь хүн</span>
                    </div>
                  </div>

                  {/* Organization Option */}
                  <div
                    onClick={() => setEbarimtType('COMPANY')}
                    className={`px-4 py-2 rounded-xl border-1 cursor-pointer transition-all w-1/2 ${
                      ebarimtType === 'COMPANY'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          ebarimtType === 'COMPANY' ? 'border-primary' : 'border-gray-300'
                        }`}
                      >
                        {ebarimtType === 'COMPANY' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="font-medium text-sm">Байгууллага</span>
                    </div>
                  </div>
                </div>
                {ebarimtType === 'COMPANY' && (
                  <div className="mt-4 space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
                      <p className="text-xs text-amber-800 leading-snug flex">
                        Та байгууллагын регистрийн дугаараа зөв бичнэ үү. Төлбөр төлөгдсөн
                        тохиолдолд регистрийн дугаар солих боломжгүйг анхаарна уу!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-base font-semibold text-gray-500 mb-1 block ">
                          Байгууллагын регистр <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            id="ebarimt-regno-input"
                            value={ebarimtRegNo}
                            onChange={e => {
                              setEbarimtRegNo(e.target.value.replace(/\D/g, '').slice(0, 10));
                              setEbarimtRegNoError(false);
                            }}
                            placeholder="Регистрийн дугаар"
                            className={`bg-white ${ebarimtRegNoError ? 'border-red-500' : 'border-gray-200'}`}
                            style={
                              ebarimtRegNoError
                                ? { borderColor: '#ef4444', boxShadow: '0 0 0 1.5px #ef4444' }
                                : {}
                            }
                          />
                          {isFetchingOrg && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            </div>
                          )}
                          {ebarimtRegNoError && (
                            <p className="text-xs text-red-600 mt-1">
                              Байгууллагын регистр оруулна уу
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-base font-semibold text-gray-500 mb-1 block ">
                          Байгууллагын нэр <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={ebarimtOrgName}
                          readOnly
                          className="bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Үйлчилгээний нөхцөл зөвшөөрөх хэсэг */}
              <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-gray-200">
                <label className="flex gap-2 text-xs">
                  <span>
                    Төлбөр төлөх дарснаар{' '}
                    <button
                      type="button"
                      className="cursor-pointer font-semibold"
                      style={{ background: 'none', border: 'none', padding: 0 }}
                      onClick={() => setShowTermsModal(true)}
                    >
                      <span className="text-primary hover:text-primary/80 transition-colors">
                        Үйлчилгээний нөхцөл
                      </span>
                    </button>
                    -ийг зөвшөөрч байгаад тооцно
                  </span>
                </label>
                <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
                  <DialogContent className="max-w-2xl">
                    <TermsPrivacyModal onClose={() => setShowTermsModal(false)} />
                  </DialogContent>
                </Dialog>
              </div>
              {/* Pay button */}
              <Button
                onClick={handleCreateOrder}
                className="w-full text-base mt-4 bg-primary hover:bg-primary/90"
                size="lg"
                disabled={isSubmitting}
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

              {/* Mobile Order Summary & Navigation */}
              {/* <div className="lg:hidden mt-6 pt-6 border-t border-gray-200 space-y-4">
                {orderSummaryContent}
              </div> */}

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center mt-6 pt-6 border-t border-gray-200">
                <a
                  href="/cart"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors group"
                >
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  Сагс руу буцах
                </a>
              </div>

              {/* Mobile Navigation */}
              <div className="flex lg:hidden items-center justify-center mt-4">
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
          {/* <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-6">{orderSummaryContent}</div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
