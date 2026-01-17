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
import { useToast } from "@/components/ui/toast";
import { useAuthRegister } from "@/lib/api";
import { X } from "lucide-react";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

export function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState(["", "", "", ""]);
  const [confirmPassword, setConfirmPassword] = useState(["", "", "", ""]);
  const passwordRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);
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
        // Reset form
        setMobile("");
        setName("");
        setPassword(["", "", "", ""]);
        setConfirmPassword(["", "", "", ""]);
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Бүртгэл үүсгэхэд алдаа гарлаа",
        description: error.message || "Алдаа гарлаа. Дахин оролдоно уу",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setMobile("");
    setName("");
    setPassword(["", "", "", ""]);
    setConfirmPassword(["", "", "", ""]);
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
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  placeholder="8 оронтой утасны дугаар"
                  className="pl-14 h-12 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                  required
                  maxLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="register-name" className="block text-sm font-semibold text-gray-700">
                Бүтэн нэр
              </label>
              <Input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Бүтэн нэрээ оруулна уу"
                className="h-12 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 text-center">
                4 оронтой PIN оруулна уу
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
                    onChange={(e) =>
                      handlePasswordChange(index, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 text-center">
                4 оронтой PIN-г баталгаажуулах
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
                    onChange={(e) =>
                      handlePasswordChange(index, e.target.value, true)
                    }
                    onKeyDown={(e) => handleKeyDown(index, e, true)}
                    className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
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
              className="w-full h-12 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Бүртгэл үүсгэж байна...
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
