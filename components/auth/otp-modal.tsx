"use client";

import { useState, useEffect, useRef } from "react";
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
import { useOTPSend, useOTPVerify, type OTPPurpose } from "@/lib/api";
import { X } from "lucide-react";
import { InlineNotification } from "./inline-notification";
import { FieldError } from "./field-error";

interface OTPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
  onOTPVerified?: (phoneNumber: string, otpCode: string) => void;
  purpose?: OTPPurpose;
}

export function OTPModal({ open, onOpenChange, onSwitchToLogin, onOTPVerified, purpose = "PASSWORD_RESET" }: OTPModalProps) {
  // OTP length: 4 digits for REGISTRATION, 6 digits for others
  const getOtpLength = (purpose: OTPPurpose) => purpose === "REGISTRATION" ? 4 : 6;
  const otpLength = getOtpLength(purpose);
  const [otp, setOtp] = useState<string[]>(() => Array(getOtpLength(purpose)).fill(""));
  const [mobile, setMobile] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showMobileInput, setShowMobileInput] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<{ mobile?: string; otp?: string }>({});
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const sendOTPMutation = useOTPSend();
  const verifyOTPMutation = useOTPVerify();

  // Reset state when modal opens/closes or purpose changes
  useEffect(() => {
    const newOtpLength = purpose === "REGISTRATION" ? 4 : 6;
    if (open) {
      const storedMobile = sessionStorage.getItem("mobile");
      if (storedMobile) {
        setMobile(storedMobile);
        setShowMobileInput(false);
      } else {
        setShowMobileInput(true);
        setMobile("");
      }
      setOtp(Array(newOtpLength).fill(""));
      setMobileInput("");
      setTimer(60);
      setCanResend(false);
      setNotification(null);
      setErrors({});
    } else {
      // Clean up when closing
      setOtp(Array(newOtpLength).fill(""));
      setMobileInput("");
      setShowMobileInput(true);
      setMobile("");
      setNotification(null);
      setErrors({});
    }
  }, [open, purpose]);

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setErrors({});
    
    if (mobileInput.length !== 8) {
      setErrors({ mobile: "Зөв 8 оронтой утасны дугаар оруулна уу" });
      return;
    }

    try {
      const response = await sendOTPMutation.mutateAsync({
        phoneNumber: mobileInput,
        purpose: purpose,
      });
      if (response.data) {
        sessionStorage.setItem("mobile", mobileInput);
        setMobile(mobileInput);
        setShowMobileInput(false);
        setTimer(60);
        setCanResend(false);
        setNotification({
          type: "success",
          message: `Таны утасны дугаарт ${otpLength} оронтой OTP код илгээгдлээ`,
        });
      }
    } catch (error: any) {
      setErrors({ mobile: error.message || "Алдаа гарлаа. Дахин оролдоно уу" });
    }
  };

  useEffect(() => {
    if (timer > 0 && !showMobileInput) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, showMobileInput]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "");
    setOtp(newOtp);

    if (value && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, otpLength);
    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < otpLength) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, otpLength - 1)]?.focus();
  };

  const handleVerify = async () => {
    setNotification(null);
    setErrors({});
    const otpString = otp.join("");
    
    if (otpString.length !== otpLength) {
      setErrors({ otp: `Бүтэн ${otpLength} оронтой OTP оруулна уу` });
      return;
    }

    if (!mobile) {
      setErrors({ otp: "Утасны дугаар олдсонгүй" });
      return;
    }

    try {
      const response = await verifyOTPMutation.mutateAsync({
        phoneNumber: mobile,
        code: otpString,
        purpose: purpose,
      });
      
      if (response.data?.verified) {
        // Store OTP verification state
        sessionStorage.setItem("otpVerified", "true");
        setNotification({
          type: "success",
          message: "OTP код амжилттай баталгаажлаа",
        });
        
        // Pass phone number and OTP code to callback after a short delay
        setTimeout(() => {
          onOTPVerified?.(mobile, otpString);
          onOpenChange(false);
        }, 1500);
      }
    } catch (error: any) {
      setErrors({ otp: error.message || "Буруу эсвэл хугацаа дууссан OTP код" });
    }
  };

  const handleResend = async () => {
    if (!mobile) return;
    setNotification(null);
    setErrors({});

    try {
      const response = await sendOTPMutation.mutateAsync({
        phoneNumber: mobile,
        purpose: purpose,
      });
      if (response.data) {
        setTimer(60);
        setCanResend(false);
        setOtp(Array(otpLength).fill(""));
        setNotification({
          type: "success",
          message: `Таны утасны дугаарт ${otpLength} оронтой OTP код дахин илгээгдлээ`,
        });
      }
    } catch (error: any) {
      setErrors({ otp: error.message || "Алдаа гарлаа. Дахин оролдоно уу" });
    }
  };

  const handleClose = () => {
    setOtp(Array(otpLength).fill(""));
    setMobileInput("");
    setShowMobileInput(true);
    setMobile("");
    setNotification(null);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden">
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
                {purpose === "PASSWORD_RESET"
                  ? "Нууц үг солих"
                  : purpose === "REGISTRATION"
                  ? "Бүртгэл баталгаажуулах"
                  : purpose === "LOGIN"
                  ? "Нэвтрэх"
                  : "OTP баталгаажуулах"}
              </DialogTitle>
              <DialogDescription className="text-white/90 text-sm">
                {showMobileInput
                  ? "Утасны дугаараа оруулаад OTP код аваарай"
                  : `${otpLength} оронтой OTP кодыг оруулна уу`}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {notification && (
            <InlineNotification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          )}
          {showMobileInput ? (
            <form onSubmit={handleMobileSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="otp-mobile"
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
                    id="otp-mobile"
                    value={mobileInput}
                    onChange={(e) => {
                      setMobileInput(e.target.value.replace(/\D/g, "").slice(0, 8));
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
                {errors.mobile ? (
                  <FieldError message={errors.mobile} />
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Бид таны дугаарыг баталгаажуулахын тулд OTP илгээх болно
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  sendOTPMutation.isPending || mobileInput.length !== 8
                }
                className="w-full h-12 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {sendOTPMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    OTP илгээж байна...
                  </span>
                ) : (
                  "OTP илгээх"
                )}
              </Button>

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
            </form>
          ) : (
            <>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 text-center">
                    {otpLength} оронтой OTP код оруулна уу
                  </label>
                  <div className={`flex justify-center gap-2 ${otpLength === 4 ? 'gap-3' : ''}`}>
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          handleOtpChange(index, e.target.value);
                          if (errors.otp) setErrors({ ...errors, otp: undefined });
                        }}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className={`${otpLength === 4 ? 'w-16 h-16' : 'w-14 h-14'} text-center text-xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all ${
                          errors.otp
                            ? "border-2 border-red-300 focus:border-red-400"
                            : "border-2 border-gray-300 focus:border-primary"
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
                  disabled={otp.join("").length !== otpLength || verifyOTPMutation.isPending}
                  className="w-full h-12 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {verifyOTPMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Баталгаажуулж байна...
                    </span>
                  ) : (
                    "OTP баталгаажуулах"
                  )}
                </Button>

                <div className="text-center space-y-2">
                  {timer > 0 ? (
                    <p className="text-sm text-gray-600">
                      OTP дахин илгээх{" "}
                      <span className="font-semibold text-primary">{timer}</span>
                    </p>
                  ) : (
                    <Button
                      onClick={handleResend}
                      variant="outline"
                      className="text-sm font-semibold border-primary/20 text-primary hover:bg-primary/5"
                    >
                      OTP дахин илгээх
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem("mobile");
                    setMobile("");
                    setShowMobileInput(true);
                    setOtp(Array(otpLength).fill(""));
                  }}
                  className="text-sm text-primary hover:text-primary/80 font-medium w-full text-center transition-colors"
                >
                  Утасны дугаар өөрчлөх
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
