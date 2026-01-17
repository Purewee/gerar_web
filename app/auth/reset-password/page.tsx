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
import { useAuthResetPassword } from "@/lib/api";

export default function ResetPasswordPage() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState(["", "", "", ""]);
  const [confirmPassword, setConfirmPassword] = useState(["", "", "", ""]);
  const [mobile, setMobile] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const passwordRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const resetPasswordMutation = useAuthResetPassword();

  useEffect(() => {
    const storedMobile = sessionStorage.getItem("mobile");
    const storedResetToken = sessionStorage.getItem("resetToken");
    if (!storedMobile) {
      router.push("/auth/login");
      return;
    }
    setMobile(storedMobile);
    if (storedResetToken) {
      setResetToken(storedResetToken);
    }
  }, [router]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "");
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

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
      }
    } else {
      const newPass = [...password];
      newPass[index] = newValue;
      setPassword(newPass);
      if (newValue && index < 3) {
        passwordRefs.current[index + 1]?.focus();
      } else if (newValue && index === 3) {
        // When last digit of password is entered, move focus to confirm password
        setTimeout(() => confirmRefs.current[0]?.focus(), 100);
      }
    }
  };

  const handlePasswordKeyDown = (
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
    otpRefs.current[Math.min(pastedData.length, 3)]?.focus();
  };

  const handleSubmit = async () => {
    const otpString = otp.join("");
    const passString = password.join("");
    const confirmString = confirmPassword.join("");

    if (otpString.length !== 4) {
      toast({
        title: "Бүрэн бус OTP",
        description: "Бүтэн 4 оронтой OTP оруулна уу",
        variant: "destructive",
      });
      return;
    }

    if (passString.length !== 4 || confirmString.length !== 4) {
      toast({
        title: "Бүрэн бус нууц үг",
        description: "Бүтэн 4 оронтой нууц үг оруулна уу",
        variant: "destructive",
      });
      return;
    }

    if (passString !== confirmString) {
      toast({
        title: "Нууц үг таарахгүй байна",
        description: "Хоёр нууц үг ижил байгаа эсэхийг шалгана уу",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await resetPasswordMutation.mutateAsync({
        phoneNumber: mobile,
        resetCode: otpString,
        newPin: passString,
        resetToken: resetToken || undefined,
      });

      if (response.data) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("mobile", mobile);
        localStorage.setItem("user_name", response.data.user.name);
        localStorage.setItem("user_id", response.data.user.id.toString());
        sessionStorage.removeItem("mobile");
        sessionStorage.removeItem("resetToken");
        window.dispatchEvent(new CustomEvent("authStateChanged"));
        toast({
          title: "Нууц үг амжилттай солигдлоо",
          description: "Таны нууц үг амжилттай шинэчлэгдлээ",
        });
        router.push("/profile");
      }
    } catch (error: any) {
      toast({
        title: "Нууц үг солихөд алдаа гарлаа",
        description: error.message || "Алдаа гарлаа. Дахин оролдоно уу",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full bg-gray-50 flex items-center justify-center px-4 py-12">
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
            OTP код болон шинэ PIN-ээ оруулна уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-center">
                OTP код оруулна уу
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-center">
                4 оронтой шинэ PIN оруулна уу
              </label>
              <div className="flex justify-center gap-3 sm:gap-4">
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
                    onChange={(e) =>
                      handlePasswordChange(index, e.target.value)
                    }
                    onKeyDown={(e) => handlePasswordKeyDown(index, e)}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-xl font-semibold"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-center">
                4 оронтой PIN-г баталгаажуулах (дахин оруулна уу)
              </label>
              <div className="flex justify-center gap-3 sm:gap-4">
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
                    onChange={(e) =>
                      handlePasswordChange(index, e.target.value, true)
                    }
                    onKeyDown={(e) => handlePasswordKeyDown(index, e, true)}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-xl font-semibold"
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={
                resetPasswordMutation.isPending ||
                otp.join("").length !== 4 ||
                password.join("").length !== 4 ||
                confirmPassword.join("").length !== 4
              }
              className="w-full"
            >
              {resetPasswordMutation.isPending
                ? "Нууц үг солиж байна..."
                : "Нууц үг солих"}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/auth/login"
              className="text-sm text-primary hover:underline"
            >
              Нэвтрэх хуудас руу буцах
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
