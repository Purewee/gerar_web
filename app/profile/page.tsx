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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md overflow-hidden ring-1 ring-black/5">
        <CardHeader className="relative bg-linear-to-br from-primary/10 via-primary/5 to-transparent border-b border-gray-100/50 pb-8">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-secondary/10 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Миний профайл
              </CardTitle>
              <CardDescription className="text-gray-500 font-medium mt-1">Профайлын мэдээллээ эндээс хянах боломжтой</CardDescription>
            </div>
            {!editMode ? (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-primary hover:bg-primary-light shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-xl px-6"
              >
                <Edit className="w-4 h-4 mr-2" />
                Профайл засах
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="rounded-xl border-gray-200 hover:bg-gray-50 bg-white shadow-sm"
                  disabled={updateProfile.isPending}
                >
                  Цуцлах
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-primary hover:bg-primary-light shadow-lg shadow-primary/20 transition-all duration-300 rounded-xl px-6"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Хадгалах
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-10 space-y-10">
          {/* Points Balance Card - Premium Version */}
          <div className="relative group overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-yellow-400 via-yellow-500 to-amber-600 opacity-10 group-hover:opacity-15 transition-opacity duration-500 rounded-3xl" />
            <div className="relative border border-yellow-200/50 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-white/40 backdrop-blur-sm shadow-xl shadow-yellow-500/5">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 animate-pulse" />
                  <div className="relative w-20 h-20 bg-linear-to-br from-yellow-300 to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-500">
                    <Coins className="w-12 h-12 text-white drop-shadow-md" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-yellow-900 mb-1">Урамшууллын оноо</h3>
                  <p className="text-yellow-800/60 font-medium max-w-xs">Цуглуулсан оноогоо бэлгэнд солих эсвэл хөнгөлөлт болгон ашиглаарай</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center md:items-end gap-3">
                <div className="text-center md:text-right">
                  <div className="flex items-baseline gap-2 justify-center md:justify-end">
                    <span className="text-5xl font-black text-yellow-600 tracking-tighter">
                      {user.points.toLocaleString()}
                    </span>
                    <span className="text-lg font-bold text-yellow-700/50 uppercase tracking-widest">оноо</span>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = '/loyalty-store'}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-2xl px-6 py-6 shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 transition-all duration-300 h-auto group/btn"
                >
                  Онооны дэлгүүр орох 
                  <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* User Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Avatar Column */}
            <div className="flex flex-col items-center lg:items-start gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-linear-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center shadow-2xl ring-8 ring-white overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  {name ? (
                    <span className="text-4xl sm:text-5xl font-black text-primary/30">
                      {name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  ) : (
                    <span className="text-6xl">👤</span>
                  )}
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/5 to-transparent pointer-events-none" />
                </div>
              </div>
              <div className="text-center lg:text-left space-y-1">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  {formatName(name) || 'Хэрэглэгч'}
                </h3>
                <p className="text-gray-500 font-medium">#{user.id}</p>
              </div>
            </div>

            {/* Details Column */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="sm:col-span-2 space-y-3">
                  <Label htmlFor="mobile" className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Утасны дугаар
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-bold text-sm">+976</span>
                    </div>
                    <Input
                      id="mobile"
                      type="tel"
                      value={mobile}
                      disabled
                      className="pl-16 h-14 bg-gray-50/50 border-gray-100 rounded-2xl font-bold text-gray-600 focus:ring-0 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center">
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-bold uppercase tracking-tighter">Шинэчлэх боломжгүй</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Бүтэн нэр
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={!editMode}
                    placeholder="Жишээ: Бат-Эрдэнэ"
                    className={`h-14 rounded-2xl transition-all duration-300 font-medium ${
                      !editMode 
                        ? 'bg-gray-50/50 border-gray-100 text-gray-700' 
                        : 'bg-white border-primary/20 shadow-inner ring-2 ring-primary/5 focus:border-primary'
                    }`}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Имэйл хаяг
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={!editMode}
                    placeholder="email@example.com"
                    className={`h-14 rounded-2xl transition-all duration-300 font-medium ${
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

      {/* Quick Stats or Info Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Нийт захиалга', value: ordersResponse?.data?.length || '0', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Хадгалсан бараа', value: favoritesResponse?.data?.length || '0', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
          { label: 'Хадгалсан хаяг', value: addressesResponse?.data?.length || '0', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-colors duration-300`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
