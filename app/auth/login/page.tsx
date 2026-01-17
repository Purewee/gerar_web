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
import { useAuthLogin } from "@/lib/api";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState(["", "", "", ""]);
  const passwordRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const loginMutation = useAuthLogin();

  const handlePasswordChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPassword = [...password];
    newPassword[index] = value.replace(/\D/g, "");
    setPassword(newPassword);
    if (value && index < 3) {
      passwordRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !password[index] && index > 0) {
      passwordRefs.current[index - 1]?.focus();
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

    const passwordString = password.join("");
    if (passwordString.length !== 4) {
      toast({
        title: "Буруу нууц үг",
        description: "4 оронтой PIN оруулна уу",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await loginMutation.mutateAsync({
        phoneNumber: mobile,
        pin: passwordString,
      });

      if (response.data) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("mobile", mobile);
        localStorage.setItem("user_name", response.data.user.name);
        localStorage.setItem("user_id", response.data.user.id.toString());
        window.dispatchEvent(new CustomEvent("authStateChanged"));
        
        // Show success toast
        toast({
          title: "Амжилттай нэвтэрлээ",
          description: `Тавтай морил, ${response.data.user.name}!`,
        });
        
        // Navigate after a short delay to ensure toast is visible
        setTimeout(() => {
          router.push("/profile");
        }, 500);
      } else {
        // Handle case where response doesn't have data
        toast({
          title: "Нэвтрэхэд алдаа гарлаа",
          description: "Хариу буцаахгүй байна. Дахин оролдоно уу.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Show error toast
      toast({
        title: "Нэвтрэхэд алдаа гарлаа",
        description: error.message || "Утасны дугаар эсвэл PIN буруу байна",
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
          <CardTitle>Нэвтрэх</CardTitle>
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
              <label className="block text-sm font-medium mb-3 text-center">
                4 оронтой PIN
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

            <Button
              type="submit"
              variant="outline"
              disabled={
                loginMutation.isPending ||
                mobile.length !== 8 ||
                password.join("").length !== 4
              }
              className="w-full"
            >
              {loginMutation.isPending ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Button
              variant="link"
              onClick={() => router.push("/auth/otp")}
              className="text-sm text-muted-foreground w-full"
            >
              Нууц үг мартсан уу?
            </Button>
          </div>

          <div className="flex items-center justify-between mt-4 text-center space-y-2">
            <Button
              variant="link"
              onClick={() => router.push("/")}
              className="text-sm text-primary"
            >
              Нүүр хуудас руу буцах
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/auth/register")}
              className="text-sm text-muted-foreground"
            >
              Бүртгэл үүсгэх
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
