"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOTPSend } from "@/lib/api";
import { X } from "lucide-react";
import { InlineNotification } from "./inline-notification";
import { FieldError } from "./field-error";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
  onOTPSent?: (phoneNumber: string, pin: string, name: string) => void;
}

export function RegisterModal({ open, onOpenChange, onSwitchToLogin, onOTPSent }: RegisterModalProps) {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState(["", "", "", ""]);
  const [confirmPassword, setConfirmPassword] = useState(["", "", "", ""]);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<{ mobile?: string; name?: string; password?: string; confirmPassword?: string }>({});
  const passwordRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);
  const sendOTPMutation = useOTPSend();

  const handlePasswordChange = (
    index: number,
    value: string,
    isConfirm: boolean = false
  ) => {
    if (value.length > 1) return;
    const newValue = value.replace(/\D/g, "");

    if (isConfirm) {
      const newConfirm = [...confirmPassword];
      newConfirm[index] = newValue;
      setConfirmPassword(newConfirm);
      if (newValue && index < 3) {
        confirmRefs.current[index + 1]?.focus();
      } else if (newValue && index === 3) {
        const confirmString = [...newConfirm].join("");
        const passString = password.join("");
        if (confirmString.length === 4 && passString.length === 4) {
          if (confirmString !== passString) {
            setErrors({ ...errors, confirmPassword: "Пин код ижил байгаа эсэхийг шалгана уу" });
          } else {
            setErrors({ ...errors, confirmPassword: undefined });
          }
        }
      }
    } else {
      const newPass = [...password];
      newPass[index] = newValue;
      setPassword(newPass);
      if (newValue && index < 3) {
        passwordRefs.current[index + 1]?.focus();
      } else if (newValue && index === 3) {
        setTimeout(() => confirmRefs.current[0]?.focus(), 100);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    isConfirm: boolean = false
  ) => {
    if (e.key === "Backspace") {
      const current = isConfirm ? confirmPassword : password;
      if (!current[index] && index > 0) {
        if (isConfirm) {
          confirmRefs.current[index - 1]?.focus();
        } else {
          passwordRefs.current[index - 1]?.focus();
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setErrors({});

    const passString = password.join("");
    const confirmString = confirmPassword.join("");
    let hasErrors = false;
    const newErrors: { mobile?: string; name?: string; password?: string; confirmPassword?: string } = {};

    if (mobile.length !== 8) {
      newErrors.mobile = "Зөв 8 оронтой утасны дугаар оруулна уу";
      hasErrors = true;
    }

    if (!name.trim()) {
      newErrors.name = "Бүтэн нэрээ оруулна уу";
      hasErrors = true;
    } else if (name.length > 50) {
      newErrors.name = "Нэр хэт урт байна. Хамгийн ихдээ 50 тэмдэгт оруулна уу";
      hasErrors = true;
    }

    if (passString.length !== 4) {
      newErrors.password = "Бүтэн 4 оронтой нууц үг оруулна уу";
      hasErrors = true;
    }

    if (confirmString.length !== 4) {
      newErrors.confirmPassword = "Бүтэн 4 оронтой нууц үг оруулна уу";
      hasErrors = true;
    }

    if (passString !== confirmString && passString.length === 4 && confirmString.length === 4) {
      newErrors.confirmPassword = "Пин код ижил байгаа эсэхийг шалгана уу";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      // Step 1: Send OTP code
      const otpResponse = await sendOTPMutation.mutateAsync({
        phoneNumber: mobile,
        purpose: "REGISTRATION",
      });

      if (otpResponse.data) {
        setNotification({
          type: "success",
          message: "Таны утасны дугаарт 4 оронтой OTP код илгээгдлээ",
        });

        // Close modal and open verify modal after a short delay
        setTimeout(() => {
          onOpenChange(false);
          onOTPSent?.(mobile, passString, name.trim());
        }, 1500);
      }
    } catch (error: any) {
      setErrors({ mobile: error.message || "Алдаа гарлаа. Дахин оролдоно уу" });
    }
  };

  const handleClose = () => {
    setMobile("");
    setName("");
    setPassword(["", "", "", ""]);
    setConfirmPassword(["", "", "", ""]);
    setNotification(null);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="relative bg-linear-to-br from-primary via-primary/95 to-primary/90 px-6 pt-8 pb-6">
          <div className="absolute top-4 right-4">
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors rounded-full p-1.5 hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center space-y-3">
            <div className="inline-block">
              <Image
                src="/logo3.svg"
                alt="Gerar"
                width={120}
                height={40}
                className="h-10 w-auto mx-auto brightness-0 invert"
                priority
              />
            </div>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-white">
                Бүртгэл үүсгэх
              </DialogTitle>
            </DialogHeader>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {notification && (
            <InlineNotification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="register-mobile"
                className="block text-sm font-semibold text-gray-700"
              >
                Утасны дугаар
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-medium">+976</span>
                </div>
                <Input
                  type="tel"
                  id="register-mobile"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 8));
                    if (errors.mobile) setErrors({ ...errors, mobile: undefined });
                  }}
                  placeholder="8 оронтой утасны дугаар"
                  className={`pl-14 h-12 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all ${
                    errors.mobile
                      ? "border-red-300 focus:border-red-400"
                      : "border-gray-300 focus:border-primary"
                  }`}
                  required
                  maxLength={8}
                />
              </div>
              {errors.mobile && <FieldError message={errors.mobile} />}
            </div>

            <div className="space-y-2">
              <label htmlFor="register-name" className="block text-sm font-semibold text-gray-700">
                Бүтэн нэр
              </label>
              <Input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 50);
                  setName(value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="Бүтэн нэрээ оруулна уу"
                className={`h-12 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all ${
                  errors.name
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-300 focus:border-primary"
                }`}
                required
                maxLength={50}
              />
              {errors.name && <FieldError message={errors.name} />}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 text-center">
                ПИН код
              </label>
              <div className="flex justify-center gap-3">
                {password.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      passwordRefs.current[index] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      handlePasswordChange(index, e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-16 h-16 text-center text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all ${
                      errors.password
                        ? "border-2 border-red-300 focus:border-red-400"
                        : "border-2 border-gray-300 focus:border-primary"
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

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 text-center">
                ПИН код давтах
              </label>
              <div className="flex justify-center gap-3">
                {confirmPassword.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      confirmRefs.current[index] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      handlePasswordChange(index, e.target.value, true);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    onKeyDown={(e) => handleKeyDown(index, e, true)}
                    className={`w-16 h-16 text-center text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all ${
                      errors.confirmPassword
                        ? "border-2 border-red-300 focus:border-red-400"
                        : "border-2 border-gray-300 focus:border-primary"
                    }`}
                  />
                ))}
              </div>
              {errors.confirmPassword && (
                <div className="flex justify-center">
                  <FieldError message={errors.confirmPassword} />
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={
                sendOTPMutation.isPending ||
                mobile.length !== 8 ||
                !name.trim() ||
                password.join("").length !== 4 ||
                confirmPassword.join("").length !== 4
              }
              className="w-full h-12 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {sendOTPMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  OTP илгээж байна...
                </span>
              ) : (
                "Бүртгэл үүсгэх"
              )}
            </Button>
          </form>

          <div className="relative pt-2">
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
      </DialogContent>
    </Dialog>
  );
}
