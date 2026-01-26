'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthLogin } from '@/lib/api';
import { X } from 'lucide-react';
import { InlineNotification } from './inline-notification';
import { FieldError } from './field-error';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister?: () => void;
  onSwitchToOTP?: () => void;
}

export function LoginModal({
  open,
  onOpenChange,
  onSwitchToRegister,
  onSwitchToOTP,
}: LoginModalProps) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState(['', '', '', '']);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<{ mobile?: string; password?: string }>({});

  const passwordRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loginMutation = useAuthLogin();

  const handlePasswordChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPassword = [...password];
    newPassword[index] = value.replace(/\D/g, '');
    setPassword(newPassword);
    if (value && index < 3) {
      passwordRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !password[index] && index > 0) {
      passwordRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setErrors({});

    const passwordString = password.join('');
    let hasErrors = false;
    const newErrors: { mobile?: string; password?: string } = {};

    if (mobile.length !== 8) {
      newErrors.mobile = 'Зөв 8 оронтой утасны дугаар оруулна уу';
      hasErrors = true;
    }

    if (passwordString.length !== 4) {
      newErrors.password = '4 оронтой PIN оруулна уу';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await loginMutation.mutateAsync({
        phoneNumber: mobile,
        pin: passwordString,
      });

      if (response.data) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('mobile', mobile);
        localStorage.setItem('user_name', response.data.user.name);
        localStorage.setItem('user_email', response.data.user.email);
        window.dispatchEvent(new CustomEvent('authStateChanged'));

        setNotification({
          type: 'success',
          message: `Амжилттай нэвтэрлээ! Тавтай морил, ${response.data.user.name}!`,
        });
        setMobile('');
        setPassword(['', '', '', '']);
        setNotification(null);
        setErrors({});
        onOpenChange(false);
      } else {
        setErrors({ password: 'Хариу буцаахгүй байна. Дахин оролдоно уу.' });
      }
    } catch (error: any) {
      setErrors({ password: error.message || 'Утасны дугаар эсвэл PIN буруу байна' });
    }
  };

  const handleClose = () => {
    setMobile('');
    setPassword(['', '', '', '']);
    setNotification(null);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Нэвтрэх</DialogTitle>
        <div className="relative bg-linear-to-br from-primary via-primary/95 to-primary/90 p-6 flex items-center justify-between">
          <Image
            src="/logo3.svg"
            alt="GERAR"
            width={100}
            height={30}
            className="h-10 w-auto mx-auto brightness-0 invert"
            priority
          />
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors rounded-full p-1.5 hover:bg-white/20 absolute top-4 right-4"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {notification && (
            <InlineNotification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="login-mobile" className="block text-sm font-semibold text-gray-700">
                Утасны дугаар
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-medium">+976</span>
                </div>
                <Input
                  type="tel"
                  id="login-mobile"
                  value={mobile}
                  onChange={e => {
                    setMobile(e.target.value.replace(/\D/g, '').slice(0, 8));
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="8 оронтой утасны дугаар"
                  className={`pl-14 h-12 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all ${
                    errors.password
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-gray-300 focus:border-primary'
                  }`}
                  required
                  maxLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 text-center">
                4 оронтой PIN
              </label>
              <div className="flex justify-center gap-3">
                {password.map((digit, index) => (
                  <Input
                    key={index}
                    ref={el => {
                      passwordRefs.current[index] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => {
                      handlePasswordChange(index, e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className={`w-16 h-16 text-center text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all ${
                      errors.password
                        ? 'border-2 border-red-300 focus:border-red-400'
                        : 'border-2 border-gray-300 focus:border-primary'
                    }`}
                  />
                ))}
              </div>
              {errors.password && (
                <div className="flex justify-center">
                  <FieldError message={errors.password} />
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                loginMutation.isPending || mobile.length !== 8 || password.join('').length !== 4
              }
              className="w-full h-12 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Нэвтэрч байна...
                </span>
              ) : (
                'Нэвтрэх'
              )}
            </Button>
          </form>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => {
                handleClose();
                onSwitchToOTP?.();
              }}
              className="text-sm text-primary hover:text-primary/80 font-medium w-full text-center transition-colors"
            >
              Нууц үг мартсан уу?
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Эсвэл</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleClose();
                onSwitchToRegister?.();
              }}
              className="w-full h-12 border-2 border-primary/20 text-primary hover:bg-primary/5 font-semibold rounded-xl transition-all duration-200"
            >
              Бүртгэл үүсгэх
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
