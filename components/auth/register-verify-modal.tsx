'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOTPVerify, useAuthRegister, useOTPSend } from '@/lib/api';
import { X } from 'lucide-react';
import { InlineNotification } from './inline-notification';
import { FieldError } from './field-error';

interface RegisterVerifyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
  phoneNumber: string;
  pin: string;
  name: string;
}

export function RegisterVerifyModal({
  open,
  onOpenChange,
  onSwitchToLogin,
  phoneNumber,
  pin,
  name,
}: RegisterVerifyModalProps) {
  const [otp, setOtp] = useState(['', '', '', '']); // 4-digit OTP for REGISTRATION
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<{ otp?: string }>({});
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyOTPMutation = useOTPVerify();
  const registerMutation = useAuthRegister();
  const sendOTPMutation = useOTPSend();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setOtp(['', '', '', '']);
      setTimer(60);
      setCanResend(false);
      setNotification(null);
      setErrors({});
    }
  }, [open]);

  // Timer for resend
  useEffect(() => {
    if (timer > 0 && open) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, open]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 4) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 3)]?.focus();
  };

  const handleResend = async () => {
    setNotification(null);
    setErrors({});
    try {
      const response = await sendOTPMutation.mutateAsync({
        phoneNumber: phoneNumber,
        purpose: 'REGISTRATION',
      });
      if (response.data) {
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '']);
        setNotification({
          type: 'success',
          message: 'Таны утасны дугаарт 4 оронтой OTP код дахин илгээгдлээ',
        });
      }
    } catch (error: any) {
      setErrors({ otp: error.message || 'Алдаа гарлаа. Дахин оролдоно уу' });
    }
  };

  const handleVerify = async () => {
    setNotification(null);
    setErrors({});
    const otpString = otp.join('');

    if (otpString.length !== 4) {
      setErrors({ otp: 'Бүтэн 4 оронтой OTP оруулна уу' });
      return;
    }

    try {
      // Step 1: Verify OTP
      const verifyResponse = await verifyOTPMutation.mutateAsync({
        phoneNumber: phoneNumber,
        code: otpString,
        purpose: 'REGISTRATION',
      });

      if (verifyResponse.data?.verified) {
        // Step 2: Complete registration with OTP code
        const registerResponse = await registerMutation.mutateAsync({
          phoneNumber: phoneNumber,
          pin: pin,
          name: name,
          otpCode: otpString,
        });

        if (registerResponse.data) {
          // Set authentication data
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('mobile', phoneNumber);
          localStorage.setItem('user_name', registerResponse.data.user.name);
          window.dispatchEvent(new CustomEvent('authStateChanged'));

          setNotification({
            type: 'success',
            message: 'Таны бүртгэл амжилттай үүслээ!',
          });

          setOtp(['', '', '', '']);
          setNotification(null);
          setErrors({});
          onOpenChange(false);
        }
      }
    } catch (error: any) {
      setErrors({ otp: error.message || 'Буруу эсвэл хугацаа дууссан OTP код' });
    }
  };

  const handleClose = () => {
    setOtp(['', '', '', '']);
    setNotification(null);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden">
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
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 text-center">
                4 оронтой OTP код оруулна уу
              </label>
              <p className="text-xs text-gray-500 text-center">Утасны дугаар: +976 {phoneNumber}</p>
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={el => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => {
                      handleOtpChange(index, e.target.value);
                      if (errors.otp) setErrors({ ...errors, otp: undefined });
                    }}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-16 h-16 text-center text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all ${
                      errors.otp
                        ? 'border-2 border-red-300 focus:border-red-400'
                        : 'border-2 border-gray-300 focus:border-primary'
                    }`}
                  />
                ))}
              </div>
              {errors.otp && (
                <div className="flex justify-center">
                  <FieldError message={errors.otp} />
                </div>
              )}
            </div>

            <Button
              onClick={handleVerify}
              disabled={
                otp.join('').length !== 4 ||
                verifyOTPMutation.isPending ||
                registerMutation.isPending
              }
              className="w-full h-12 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {verifyOTPMutation.isPending || registerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Баталгаажуулж байна...
                </span>
              ) : (
                'Бүртгэл үүсгэх'
              )}
            </Button>

            <div className="text-center space-y-2">
              {timer > 0 ? (
                <p className="text-sm text-gray-600">
                  OTP дахин илгээх <span className="font-semibold text-primary">{timer}</span>
                </p>
              ) : (
                <Button
                  onClick={handleResend}
                  variant="outline"
                  disabled={sendOTPMutation.isPending}
                  className="text-sm font-semibold border-primary/20 text-primary hover:bg-primary/5"
                >
                  {sendOTPMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent"></span>
                      Илгээж байна...
                    </span>
                  ) : (
                    'OTP дахин илгээх'
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => {
                handleClose();
                onSwitchToLogin?.();
              }}
              className="text-sm text-primary hover:text-primary/80 font-medium w-full text-center transition-colors"
            >
              Цуцлах
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
                onSwitchToLogin?.();
              }}
              className="w-full h-12 border-2 border-primary/20 text-primary hover:bg-primary/5 font-semibold rounded-xl transition-all duration-200"
            >
              Аль хэдийн бүртгэлтэй юу? Нэвтрэх
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
