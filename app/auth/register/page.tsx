"use client";

import { useState, useRef } from "react";
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
import { useAuthRegister } from "@/lib/api";

export default function RegisterPage() {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState(["", "", "", ""]);
  const [confirmPassword, setConfirmPassword] = useState(["", "", "", ""]);
  const passwordRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const registerMutation = useAuthRegister();

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
        // When last digit of confirm password is entered, check if both match
        const confirmString = [...newConfirm].join("");
        const passString = password.join("");
        if (confirmString.length === 4 && passString.length === 4) {
          if (confirmString !== passString) {
            toast({
              title: "Нууц үг таарахгүй байна",
              description: "Хоёр нууц үг ижил байгаа эсэхийг шалгана уу",
              variant: "destructive",
            });
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
        // When last digit of password is entered, move focus to confirm password
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

    if (mobile.length !== 8) {
      toast({
        title: "Буруу утасны дугаар",
        description: "Зөв 8 оронтой утасны дугаар оруулна уу",
        variant: "destructive",
      });
      return;
    }

    const passString = password.join("");
    const confirmString = confirmPassword.join("");

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

    if (!name.trim()) {
      toast({
        title: "Нэр шаардлагатай",
        description: "Бүтэн нэрээ оруулна уу",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await registerMutation.mutateAsync({
        phoneNumber: mobile,
        pin: passString,
        name: name.trim(),
      });

      if (response.data) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("mobile", mobile);
        localStorage.setItem("user_name", response.data.user.name);
        localStorage.setItem("user_id", response.data.user.id.toString());
        window.dispatchEvent(new CustomEvent("authStateChanged"));
        toast({
          title: "Бүртгэл үүсгэгдсэн",
          description: "Таны бүртгэл амжилттай үүслээ!",
        });
        router.push("/profile");
      }
    } catch (error: any) {
      toast({
        title: "Бүртгэл үүсгэхэд алдаа гарлаа",
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
          <CardTitle>Бүртгэл үүсгэх</CardTitle>
          <CardDescription>
            Бүртгэлдээ 4 оронтой PIN үүсгэнэ үү. PIN-ээ хоёр удаа оруулна уу.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  placeholder="8 оронтой утасны дугаар оруулна уу"
                  className="pl-12"
                  required
                  maxLength={8}
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Бүтэн нэр
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Бүтэн нэрээ оруулна уу"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-center">
                4 оронтой PIN оруулна уу
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
                    onKeyDown={(e) => handleKeyDown(index, e)}
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
                    onKeyDown={(e) => handleKeyDown(index, e, true)}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-xl font-semibold"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                registerMutation.isPending ||
                mobile.length !== 8 ||
                !name.trim() ||
                password.join("").length !== 4 ||
                confirmPassword.join("").length !== 4
              }
              className="w-full"
            >
              {registerMutation.isPending
                ? "Бүртгэл үүсгэж байна..."
                : "Бүртгэл үүсгэх"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/auth/login"
              className="text-sm text-muted-foreground hover:underline"
            >
              Аль хэдийн бүртгэлтэй юу? Нэвтрэх
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
