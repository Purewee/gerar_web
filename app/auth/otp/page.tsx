"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuthForgotPassword } from "@/lib/api";

export default function OTPPage() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [mobile, setMobile] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showMobileInput, setShowMobileInput] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const forgotPasswordMutation = useAuthForgotPassword();

  useEffect(() => {
    const storedMobile = sessionStorage.getItem("mobile");
    if (!storedMobile) {
      setShowMobileInput(true);
      return;
    }
    setMobile(storedMobile);
    const storedResetToken = sessionStorage.getItem("resetToken");
    if (storedResetToken) {
      setResetToken(storedResetToken);
    }
  }, [router]);

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
    if (timer > 0) {
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
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "");
    setOtp(newOtp);

    // Auto-focus next input
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

    // Route to reset-password page after OTP verification
    router.push("/auth/reset-password");
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

  return (
    <div className="bg-gray-50 flex items-center justify-center px-4 py-12">
      <Card className="max-w-sm w-full">
        <CardHeader className="text-center">
          <a href="/" className="inline-block mb-2">
            <Image
              src="/logo3.svg"
              alt="Gerar"
              width={120}
              height={40}
              className="h-10 w-auto mx-auto"
              priority
            />
          </a>
          <CardTitle>Нууц үг солих</CardTitle>
          <CardDescription>
            Утасны дугаараа оруулаад OTP код аваарай
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showMobileInput ? (
            <form onSubmit={handleMobileSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="mobile"
                  className="block text-sm font-medium mb-2"
                >
                  Утасны дугаар
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-muted-foreground text-sm">+976</span>
                  </div>
                  <Input
                    type="tel"
                    id="mobile"
                    value={mobileInput}
                    onChange={(e) =>
                      setMobileInput(
                        e.target.value.replace(/\D/g, "").slice(0, 8)
                      )
                    }
                    placeholder="8 оронтой утасны дугаар оруулна уу"
                    className="pl-12"
                    required
                    maxLength={8}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Бид таны дугаарыг баталгаажуулахын тулд OTP илгээх болно
                </p>
              </div>

              <Button
                type="submit"
                disabled={
                  forgotPasswordMutation.isPending || mobileInput.length !== 8
                }
                className="w-full"
              >
                {forgotPasswordMutation.isPending
                  ? "OTP илгээж байна..."
                  : "OTP илгээх"}
              </Button>

              <div className="mt-6 text-center">
                <a
                  href="/auth/login"
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Аль хэдийн бүртгэлтэй юу? Нэвтрэх
                </a>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-6">
                <div className="flex justify-center gap-2 sm:gap-3">
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
                      className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold"
                    />
                  ))}
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={otp.join("").length !== 4}
                  className="w-full"
                >
                  OTP баталгаажуулах
                </Button>

                <div className="text-center space-y-2">
                  {timer > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      OTP дахин илгээх{" "}
                      <span className="font-semibold">{timer}с</span>
                    </p>
                  ) : (
                    <Button
                      onClick={handleResend}
                      variant="link"
                      className="text-sm font-semibold"
                    >
                      OTP дахин илгээх
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-6 text-center space-y-2">
                <div>
                  <Button
                    onClick={() => {
                      sessionStorage.removeItem("mobile");
                      sessionStorage.removeItem("resetToken");
                      setMobile("");
                      setShowMobileInput(true);
                    }}
                    variant="link"
                    className="text-sm"
                  >
                    Утасны дугаар өөрчлөх
                  </Button>
                </div>
                <div>
                  <a
                    href="/auth/login"
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    Аль хэдийн бүртгэлтэй юу? Нэвтрэх
                  </a>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

