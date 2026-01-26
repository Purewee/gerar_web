'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAuthResetPassword } from '@/lib/api';
import { X } from 'lucide-react';
import { FieldError } from './field-error';
import { toast } from 'sonner';

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
  phoneNumber: string;
  otpCode: string; // The verified OTP code
}

export function ResetPasswordModal({
  open,
  onOpenChange,
  onSwitchToLogin,
  phoneNumber,
  otpCode,
}: ResetPasswordModalProps) {
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [errors, setErrors] = useState<{ newPin?: string; confirmPin?: string }>({});
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);
  const resetPasswordMutation = useAuthResetPassword();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setNewPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setErrors({});
    }
  }, [open]);

  const handlePinChange = (index: number, value: string, isConfirm: boolean = false) => {
    if (value.length > 1) return;
    const newValue = value.replace(/\D/g, '');

    if (isConfirm) {
      const newConfirm = [...confirmPin];
      newConfirm[index] = newValue;
      setConfirmPin(newConfirm);
      if (newValue && index < 3) {
        confirmRefs.current[index + 1]?.focus();
      } else if (newValue && index === 3) {
        const confirmString = [...newConfirm].join('');
        const pinString = newPin.join('');
        if (confirmString.length === 4 && pinString.length === 4) {
          if (confirmString !== pinString) {
            toast.warning('Хоёр ПИН код ижил байгаа эсэхийг шалгана уу');
          }
        }
      }
    } else {
      const newPinArray = [...newPin];
      newPinArray[index] = newValue;
      setNewPin(newPinArray);
      if (newValue && index < 3) {
        pinRefs.current[index + 1]?.focus();
      } else if (newValue && index === 3) {
        setTimeout(() => confirmRefs.current[0]?.focus(), 100);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    isConfirm: boolean = false,
  ) => {
    if (e.key === 'Backspace') {
      const current = isConfirm ? confirmPin : newPin;
      if (!current[index] && index > 0) {
        if (isConfirm) {
          confirmRefs.current[index - 1]?.focus();
        } else {
          pinRefs.current[index - 1]?.focus();
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const pinString = newPin.join('');
    const confirmString = confirmPin.join('');
    let hasErrors = false;
    const newErrors: { newPin?: string; confirmPin?: string } = {};

    if (pinString.length !== 4) {
      newErrors.newPin = 'Бүтэн 4 оронтой ПИН код оруулна уу';
      hasErrors = true;
    }

    if (confirmString.length !== 4) {
      newErrors.confirmPin = 'Бүтэн 4 оронтой ПИН код оруулна уу';
      hasErrors = true;
    }

    if (pinString !== confirmString && pinString.length === 4 && confirmString.length === 4) {
      newErrors.confirmPin = 'Хоёр ПИН код ижил байгаа эсэхийг шалгана уу';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await resetPasswordMutation.mutateAsync({
        phoneNumber: phoneNumber,
        resetCode: otpCode, // Use the verified OTP code as resetCode
        newPin: pinString,
      });

      if (response.data) {
        // Set authentication data
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('mobile', phoneNumber);
        localStorage.setItem('user_name', response.data.user.name);
        window.dispatchEvent(new CustomEvent('authStateChanged'));

        toast.success('Таны нууц үг амжилттай шинэчлэгдлээ!');

        setNewPin(['', '', '', '']);
        setConfirmPin(['', '', '', '']);
        setErrors({});
        onOpenChange(false);
      }
    } catch (error: any) {
      setErrors({ confirmPin: error.message || 'Алдаа гарлаа. Дахин оролдоно уу' });
    }
  };

  const handleClose = () => {
    setNewPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Нууц үг солих</DialogTitle>
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Шинэ ПИН код</label>
              <div className="flex justify-center gap-3">
                {newPin.map((digit, index) => (
                  <Input
                    key={index}
                    ref={el => {
                      pinRefs.current[index] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => {
                      handlePinChange(index, e.target.value);
                      if (errors.newPin) setErrors({ ...errors, newPin: undefined });
                    }}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className={`w-16 h-16 text-center text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all ${
                      errors.newPin
                        ? 'border-2 border-red-300 focus:border-red-400'
                        : 'border-2 border-gray-300 focus:border-primary'
                    }`}
                  />
                ))}
              </div>
              {errors.newPin && (
                <div className="flex justify-center">
                  <FieldError message={errors.newPin} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">ПИН код давтах</label>
              <div className="flex justify-center gap-3">
                {confirmPin.map((digit, index) => (
                  <Input
                    key={index}
                    ref={el => {
                      confirmRefs.current[index] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => {
                      handlePinChange(index, e.target.value, true);
                      if (errors.confirmPin) setErrors({ ...errors, confirmPin: undefined });
                    }}
                    onKeyDown={e => handleKeyDown(index, e, true)}
                    className={`w-16 h-16 text-center text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all ${
                      errors.confirmPin
                        ? 'border-2 border-red-300 focus:border-red-400'
                        : 'border-2 border-gray-300 focus:border-primary'
                    }`}
                  />
                ))}
              </div>
              {errors.confirmPin && (
                <div className="flex justify-center">
                  <FieldError message={errors.confirmPin} />
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                resetPasswordMutation.isPending ||
                newPin.join('').length !== 4 ||
                confirmPin.join('').length !== 4
              }
              className="w-full h-12 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {resetPasswordMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Нууц үг солиж байна...
                </span>
              ) : (
                'Нууц үг солих'
              )}
            </Button>
          </form>

          <div className="space-y-3 pt-2">
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
                onSwitchToLogin?.();
              }}
              className="w-full h-12 border-2 border-primary/20 text-primary hover:bg-primary/5 font-semibold rounded-xl transition-all duration-200"
            >
              Нэвтрэх
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
