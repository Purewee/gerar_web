'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Loader2, Coins, ArrowRight, ShoppingBag, Heart, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser, useUpdateProfile, useOrders, useFavorites, useAddresses } from '@/lib/api';

function formatPhoneDisplay(phoneNumber: string): string {
  if (!phoneNumber) return '';
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.startsWith('976')) return digits.slice(3);
  return digits;
}

export default function ProfilePage() {
  const { data: userResponse, isLoading, isError, error } = useCurrentUser();
  const { data: ordersResponse } = useOrders();
  const { data: favoritesResponse } = useFavorites();
  const { data: addressesResponse } = useAddresses();
  const updateProfile = useUpdateProfile();
  const user = userResponse?.data;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  const mobile = user ? formatPhoneDisplay(user.phoneNumber) : '';

  const handleSave = async () => {
    const nameTrim = name.trim();
    const emailTrim = email.trim();
    if (!nameTrim && emailTrim === '') {
      toast.error('Нэр эсвэл имэйлээс дор хаяж нэгийг оруулна уу');
      return;
    }
    try {
      const payload: { name?: string; email?: string } = {};
      if (nameTrim !== (user?.name ?? '')) payload.name = nameTrim;
      if (emailTrim !== (user?.email ?? '')) payload.email = emailTrim;
      if (Object.keys(payload).length === 0) {
        setEditMode(false);
        toast.info('Өөрчлөлт оруулаагүй');
        return;
      }
      await updateProfile.mutateAsync(payload);
      setEditMode(false);
      toast.success('Амжилттай шинэчлэгдлээ');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Шинэчлэхэд алдаа гарлаа');
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-12 flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !user) {
    return (
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <p className="text-destructive">
            {error instanceof Error ? error.message : 'Профайл ачааллахад алдаа гарлаа'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatName = (name: string) => {
    if (typeof name !== 'string' || name.length === 0) return '';
    // Split by whitespace, capitalize first letter of each word
    return name
      .toLocaleLowerCase('mn-MN')
      .split(/\s+/)
      .map(word => word.charAt(0).toLocaleUpperCase('mn-MN') + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md overflow-hidden ring-1 ring-black/5">
        <CardHeader className="relative bg-linear-to-br from-primary/10 via-primary/5 to-transparent border-b border-gray-100/50 pb-5">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-black tracking-tight bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Миний профайл
              </CardTitle>
              <CardDescription className="text-gray-500 text-xs font-medium mt-0.5">
                Профайлын мэдээллээ эндээс хянах боломжтой
              </CardDescription>
            </div>
            {!editMode ? (
              <Button
                onClick={() => setEditMode(true)}
                size="sm"
                className="bg-primary hover:bg-primary-light shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-xl px-5"
              >
                <Edit className="w-3.5 h-3.5 mr-2" />
                Профайл засах
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-gray-200 hover:bg-gray-50 bg-white shadow-sm"
                  disabled={updateProfile.isPending}
                >
                  Цуцлах
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="bg-primary hover:bg-primary-light shadow-lg shadow-primary/20 transition-all duration-300 rounded-xl px-5"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  ) : null}
                  Хадгалах
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* User Info Section (Compact) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Avatar Column */}
            <div className="flex flex-col items-center lg:items-start gap-3 lg:col-span-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-linear-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center shadow-xl ring-4 ring-white overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  {name ? (
                    <span className="text-2xl sm:text-3xl font-black text-primary/30">
                      {name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/5 to-transparent pointer-events-none" />
                </div>
              </div>
              <div className="text-center lg:text-left">
                <h3 className="text-lg font-black text-gray-900 tracking-tight leading-tight">
                  {formatName(name) || 'Хэрэглэгч'}
                </h3>
              </div>
            </div>

            {/* Details Column */}
            <div className="lg:col-span-3 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label
                    htmlFor="mobile"
                    className="text-[10px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    Утасны дугаар
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-bold text-xs">+976</span>
                    </div>
                    <Input
                      id="mobile"
                      type="tel"
                      value={mobile}
                      disabled
                      className="pl-14 h-11 bg-gray-50/50 border-gray-100 rounded-xl font-bold text-gray-600 focus:ring-0 cursor-not-allowed text-sm"
                    />
                    <div className="absolute inset-y-0 right-3.5 flex items-center">
                      <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter border border-gray-200/50">
                        Засах боломжгүй
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-[10px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    Бүтэн нэр
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={!editMode}
                    placeholder="Жишээ: Бат-Эрдэнэ"
                    className={`h-11 rounded-xl transition-all duration-300 font-medium text-sm ${
                      !editMode
                        ? 'bg-gray-50/50 border-gray-100 text-gray-700'
                        : 'bg-white border-primary/20 shadow-inner ring-2 ring-primary/5 focus:border-primary'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    Имэйл хаяг
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={!editMode}
                    placeholder="email@example.com"
                    className={`h-11 rounded-xl transition-all duration-300 font-medium text-sm ${
                      !editMode
                        ? 'bg-gray-50/50 border-gray-100 text-gray-700'
                        : 'bg-white border-primary/20 shadow-inner ring-2 ring-primary/5 focus:border-primary'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats or Info Card (Compact) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Нийт захиалга',
            value: ordersResponse?.data?.length || '0',
            icon: ShoppingBag,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
          },
          {
            label: 'Хадгалсан бараа',
            value: favoritesResponse?.data?.length || '0',
            icon: Heart,
            color: 'text-pink-500',
            bg: 'bg-pink-50',
          },
          {
            label: 'Хадгалсан хаяг',
            value: addressesResponse?.data?.length || '0',
            icon: MapPin,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden group hover:translate-y-[-2px] transition-all duration-300"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-colors duration-300 ring-1 ring-inset ring-black/5`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                    {stat.label}
                  </p>
                  <p className="text-xl font-black text-gray-900 leading-none">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
