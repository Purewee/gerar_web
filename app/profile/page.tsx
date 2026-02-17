'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser, useUpdateProfile } from '@/lib/api';

function formatPhoneDisplay(phoneNumber: string): string {
  if (!phoneNumber) return '';
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.startsWith('976')) return digits.slice(3);
  return digits;
}

export default function ProfilePage() {
  const { data: userResponse, isLoading, isError, error } = useCurrentUser();
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
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Миний профайл
            </CardTitle>
            <CardDescription className="mt-2">Профайлын мэдээллээ засах</CardDescription>
          </div>
          {!editMode ? (
            <Button
              onClick={() => setEditMode(true)}
              className="shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Edit className="w-4 h-4 mr-2" />
              Профайл засах
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="shadow-sm"
                disabled={updateProfile.isPending}
              >
                Цуцлах
              </Button>
              <Button
                onClick={handleSave}
                className="shadow-md hover:shadow-lg transition-all duration-200"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Хадгалах
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 lg:p-8">
        <div className="space-y-8">
          <div className="flex flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 sm:w-28 sm:h-28 bg-linear-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center shadow-lg ring-4 ring-primary/10 shrink-0">
              {name ? (
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  {name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              ) : (
                <span className="text-4xl sm:text-5xl">👤</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {formatName(name) || 'Хэрэглэгч'}
              </h3>
              <p className="text-sm text-gray-600">
                {email && email !== 'null' ? email : 'Имэйл оруулаагүй'}
              </p>
              <p className="text-sm text-gray-500 mt-1">+976 {mobile}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="mobile" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                Утасны дугаар
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-medium">+976</span>
                </div>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  disabled
                  className="pl-16 bg-gray-50 border-gray-200"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <span>ℹ️</span>
                Утасны дугаар өөрчлөх боломжгүй
              </p>
            </div>
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                Бүтэн нэр
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={!editMode}
                placeholder="Бүтэн нэрээ оруулна уу"
                className={!editMode ? 'bg-gray-50' : ''}
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2.5 block">
                Имэйл хаяг
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!editMode}
                placeholder="Имэйл хаягаа оруулна уу"
                className={!editMode ? 'bg-gray-50' : ''}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
