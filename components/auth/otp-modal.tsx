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
import { useToast } from "@/components/ui/toast";
import { useAuthForgotPassword } from "@/lib/api";
import { X } from "lucide-react";

interface OTPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
  onOTPVerified?: () => void;
}

export function OTPModal({ open, onOpenChange, onSwitchToLogin, onOTPVerified }: OTPModalProps) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [mobile, setMobile] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showMobileInput, setShowMobileInput] = useState(true);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();
  const forgotPasswordMutation = useAuthForgotPassword();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      const storedMobile = sessionStorage.getItem("mobile");
      if (storedMobile) {
        setMobile(storedMobile);
        setShowMobileInput(false);
        const storedResetToken = sessionStorage.getItem("resetToken");
        if (storedResetToken) {
          setResetToken(storedResetToken);
        }
      } else {
        setShowMobileInput(true);
        setMobile("");
      }
      setOtp(["", "", "", ""]);
      setMobileInput("");
      setTimer(60);
      setCanResend(false);
    } else {
      // Clean up when closing
      setOtp(["", "", "", ""]);
      setMobileInput("");
      setShowMobileInput(true);
      setMobile("");
      setResetToken(null);
    }
  }, [open]);

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileInput.length !== 8) {
      toast({
        title: "Буруу утасны дугаар",
        description: "Зөв 8 оронтой утасны дугаар оруулна уу",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await forgotPasswordMutation.mutateAsync(mobileInput);
      if (response.data) {
        sessionStorage.setItem("mobile", mobileInput);
        if (response.data.resetToken) {
          sessionStorage.setItem("resetToken", response.data.resetToken);
        }
        setMobile(mobileInput);
        setResetToken(response.data.resetToken || null);
        setShowMobileInput(false);
        setTimer(60);
        setCanResend(false);
        toast({
          title: "OTP илгээгдсэн",
          description: `OTP код: ${response.data.resetCode}. Таны утасны дугаарт илгээгдлээ`,
        });
      }
    } catch (error: any) {
      toast({
        title: "OTP илгээхэд алдаа гарлаа",
        description: error.message || "Алдаа гарлаа. Дахин оролдоно уу",
        variant: "destructive",
      });
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

    if (value && index < 3) {
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
      .slice(0, 4);
    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 4) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 3)]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 4) {
      toast({
        title: "Бүрэн бус OTP",
        description: "Бүтэн 4 оронтой OTP оруулна уу",
        variant: "destructive",
      });
      return;
    }

    // Store OTP verification state and navigate to reset password
    sessionStorage.setItem("otpVerified", "true");
    onOTPVerified?.();
    onOpenChange(false);
    // Navigate to reset password page
    window.location.href = "/auth/reset-password";
  };

  const handleResend = async () => {
    if (!mobile) return;

    try {
      const response = await forgotPasswordMutation.mutateAsync(mobile);
      if (response.data) {
        if (response.data.resetToken) {
          sessionStorage.setItem("resetToken", response.data.resetToken);
        }
        setResetToken(response.data.resetToken || null);
        setTimer(60);
        setCanResend(false);
        setOtp(["", "", "", ""]);
        toast({
          title: "OTP дахин илгээгдсэн",
          description: `OTP код: ${response.data.resetCode}. Таны утасны дугаарт илгээгдлээ`,
        });
      }
    } catch (error: any) {
      toast({
        title: "OTP дахин илгээхэд алдаа гарлаа",
        description: error.message || "Алдаа гарлаа. Дахин оролдоно уу",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setOtp(["", "", "", ""]);
    setMobileInput("");
    setShowMobileInput(true);
    setMobile("");
    setResetToken(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/90 px-6 pt-8 pb-6">
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
                Нууц үг солих
              </DialogTitle>
              <DialogDescription className="text-white/90 text-sm">
                {showMobileInput
                  ? "Утасны дугаараа оруулаад OTP код аваарай"
                  : "OTP кодыг оруулна уу"}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
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
                    onChange={(e) =>
                      setMobileInput(
                        e.target.value.replace(/\D/g, "").slice(0, 8)
                      )
                    }
                    placeholder="8 оронтой утасны дугаар"
                    className="pl-14 h-12 border-gray-300 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all"
                    required
                    maxLength={8}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Бид таны дугаарыг баталгаажуулахын тулд OTP илгээх болно
                </p>
              </div>

              <Button
                type="submit"
                disabled={
                  forgotPasswordMutation.isPending || mobileInput.length !== 8
                }
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {forgotPasswordMutation.isPending ? (
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
                    OTP код оруулна уу
                  </label>
                  <div className="flex justify-center gap-3">
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
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition-all"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={otp.join("").length !== 4}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  OTP баталгаажуулах
                </Button>

                <div className="text-center space-y-2">
                  {timer > 0 ? (
                    <p className="text-sm text-gray-600">
                      OTP дахин илгээх{" "}
                      <span className="font-semibold text-primary">{timer}с</span>
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
                    sessionStorage.removeItem("resetToken");
                    setMobile("");
                    setShowMobileInput(true);
                    setOtp(["", "", "", ""]);
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
