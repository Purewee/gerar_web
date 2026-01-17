"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {  Search, ShoppingCart, User, ChevronDown } from "lucide-react";
import { useCart, authApi } from "@/lib/api";
import { useCategoriesStore } from "@/lib/stores/categories";
import { LoginModal } from "@/components/auth/login-modal";
import { RegisterModal } from "@/components/auth/register-modal";
import { OTPModal } from "@/components/auth/otp-modal";
import { Spinner } from "@/components/skeleton";

export function Navigation() {
  const [mobileProfileMenuOpen, setMobileProfileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [userName, setUserName] = useState<string>("");
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(
    null
  );
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fetch cart data from API
  const { data: cartResponse } = useCart();
  const cartItems = cartResponse?.data || [];
  const cartCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  useEffect(() => {
    setMounted(true);
    const auth = localStorage.getItem("isAuthenticated");
    setIsAuthenticated(auth === "true");

    // Load user name from localStorage
    const updateUserName = () => {
      const name = localStorage.getItem("user_name") || localStorage.getItem("profile_name") || "";
      setUserName(name);
    };

    // Update authentication state
    const updateAuthState = () => {
      const auth = localStorage.getItem("isAuthenticated");
      setIsAuthenticated(auth === "true");
      updateUserName();
    };

    updateUserName();
    // Listen for storage changes (when cart is updated in other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "isAuthenticated" || e.key === "user_name" || e.key === "profile_name") {
        updateAuthState();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener("authStateChanged", updateAuthState);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStateChanged", updateAuthState);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (!pathname.startsWith("/products")) return;
    const searchValue = searchParams.get("search") || "";
    setSearchQuery(searchValue);
    setMobileSearchQuery(searchValue);
  }, [pathname, searchParams]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setIsAuthenticated(false);
      setUserName("");
      setMobileProfileMenuOpen(false);
      localStorage.removeItem("user_name");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Still proceed with logout even if API call fails
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("mobile");
      localStorage.removeItem("user_name");
      localStorage.removeItem("profile_name");
      localStorage.removeItem("profile_email");
      localStorage.removeItem("profile_address");
      localStorage.removeItem("user_id");
      setIsAuthenticated(false);
      setUserName("");
      setMobileProfileMenuOpen(false);
      window.dispatchEvent(new CustomEvent("authStateChanged"));
      window.location.href = "/";
    }
  };

  const handleSearch = (e: FormEvent, query: string) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setSearchQuery("");
      setMobileSearchQuery("");
    }
  };

  // Get categories from store (hydrated by CategoriesProvider)
  const allCategories = useCategoriesStore((state) => state.categories);
  const categoriesLoading = useCategoriesStore((state) => state.isLoading);
  // Filter to show only parent categories (parentId === null)
  const categories = allCategories.filter((cat) => cat.parentId === null);

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 ">
          <div className="flex items-center justify-between py-3 md:py-5 gap-4">
            {/* Profile Icon - Mobile/Small Screens (Left Side) */}
            <button
              onClick={() => setMobileProfileMenuOpen(!mobileProfileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              aria-label="Профайл цэс нээх"
            >
              {mounted && isAuthenticated && userName ? (
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {getUserInitials(userName)}
                </div>
              ) : (
                <User className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {/* Logo */}
            <a href="/" className="shrink-0 flex items-center">
              <Image
                src="/logo3.svg"
                alt="Gerar"
                width={120}
                height={40}
                priority
                className="w-auto h-7 md:h-10"
              />
            </a>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4 hidden sm:flex">
              <form
                onSubmit={(e) => handleSearch(e, searchQuery)}
                className="relative w-full"
              >
                <Input
                  type="text"
                  placeholder="Тавилга, чимэглэл, гэрийн хэрэгсэл хайх...."
                  className="pr-10 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value.replace(/[^\p{L}\p{N}\s]/gu, "")
                    )
                  }
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-muted-foreground hover:text-primary hover:bg-gray-100 rounded-md cursor-pointer transition-colors duration-200"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-3">
              {mounted && isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden sm:flex text-sm sm:text-base whitespace-nowrap hover:bg-gray-100 rounded-lg px-3 py-2 transition-all duration-200"
                    >
                      <div className="w-7 h-7 rounded-full bg-linear-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-xs mr-2.5 shadow-sm">
                        {userName ? getUserInitials(userName) : <User className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-gray-700">
                        {userName || "Профайл"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white border border-gray-200 shadow-xl rounded-lg mt-2 w-48"
                  >
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <a href="/profile" className="flex items-center gap-2 w-full">
                        <User className="w-4 h-4" />
                        Профайл харах
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      Гарах
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setLoginModalOpen(true)}
                  className="hidden sm:flex hover:bg-gray-100 rounded-lg transition-all duration-200 text-sm sm:text-base whitespace-nowrap font-medium"
                >
                  Нэвтрэх
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100 rounded-lg transition-all duration-200"
                asChild
              >
                <a href="/cart">
                  <ShoppingCart className="w-6 h-6 text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-in zoom-in-50">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </a>
              </Button>
            </div>
          </div>

          {/* Category Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-2 py-3 border-t border-gray-200/80 relative z-40">
            {categoriesLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner size="sm" />
              </div>
            ) : categories.length > 0 ? (
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide w-full">
                {categories.map((category) => {
                  const hasChildren =
                    category.children && category.children.length > 0;

                  if (hasChildren) {
                    return (
                      <DropdownMenu key={category.id}>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="text-sm font-semibold text-gray-700 hover:text-primary whitespace-nowrap py-2.5 px-4 bg-white border border-gray-200 hover:border-primary/30 data-[state=open]:bg-linear-to-r data-[state=open]:from-primary/10 data-[state=open]:to-primary/5 data-[state=open]:text-primary data-[state=open]:border-primary/30 shadow-sm hover:shadow-md rounded-lg transition-colors duration-200 flex items-center gap-1.5 shrink-0 hover:bg-linear-to-r hover:from-primary/10 hover:to-primary/5 relative group outline-none focus:outline-none focus-visible:outline-none"
                            onBlur={(e) => {
                              // Remove any lingering focus styles
                              e.currentTarget.style.outline = 'none';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            onMouseDown={(e) => {
                              // Prevent focus ring on mouse click
                              e.currentTarget.style.outline = 'none';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <span className="relative z-10 text-gray-700 group-hover:text-primary data-[state=open]:text-primary">{category.name}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-700 group-hover:text-primary transition-transform duration-300 data-[state=open]:rotate-180 data-[state=open]:text-primary relative z-10" />
                            <span className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 min-w-[14rem]">
                          {category.children?.map((child) => (
                            <DropdownMenuItem key={child.id} asChild>
                              <a
                                href={`/products?categoryId=${encodeURIComponent(
                                  child.id
                                )}`}
                                className="cursor-pointer w-full"
                              >
                                {child.name}
                              </a>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }

                  return (
                    <a
                      key={category.id}
                      href={`/products?categoryId=${encodeURIComponent(category.id)}`}
                      className="text-sm font-semibold text-gray-700 hover:text-primary whitespace-nowrap py-2.5 px-4 bg-white border border-gray-200 hover:border-primary/30 shadow-sm hover:shadow-md rounded-lg transition-colors duration-200 hover:bg-linear-to-r hover:from-primary/10 hover:to-primary/5 shrink-0 relative group"
                    >
                      <span className="relative z-10">{category.name}</span>
                      <span className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                    </a>
                  );
                })}
              </div>
            ) : (
              <span className="text-sm text-gray-500">Ангилал олдсонгүй</span>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Category Menu - Always visible, sticky */}
      <nav className="lg:hidden bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-[65px] z-30 overflow-x-auto shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 ">
          <div className="flex flex-col">
            {/* Categories Row */}
            <div className="flex items-center gap-2 py-3 overflow-x-auto">
              {categoriesLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Spinner size="sm" />
                </div>
              ) : categories.length > 0 ? (
                categories.map((category) => {
                  const hasChildren =
                    category.children && category.children.length > 0;
                  const isExpanded = expandedCategoryId === category.id;

                  return (
                    <button
                      key={category.id}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          setExpandedCategoryId(
                            isExpanded ? null : category.id
                          );
                        } else {
                          router.push(
                            `/products?categoryId=${encodeURIComponent(category.id)}`
                          );
                        }
                      }}
                      onBlur={(e) => {
                        // Remove any lingering focus styles
                        e.currentTarget.style.outline = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onMouseDown={(e) => {
                        // Prevent focus ring on mouse click
                        e.currentTarget.style.outline = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      className={`text-xs sm:text-sm font-semibold whitespace-nowrap py-2.5 px-4 shrink-0 flex items-center gap-1.5 rounded-lg transition-all duration-300 relative group outline-none focus:outline-none focus-visible:outline-none bg-white ${isExpanded
                        ? "text-primary bg-linear-to-r from-primary/15 to-primary/5 shadow-sm"
                        : "text-gray-700 hover:text-primary hover:bg-linear-to-r hover:from-primary/10 hover:to-primary/5"
                        }`}
                    >
                      <span className="relative z-10">{category.name}</span>
                      {hasChildren && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-gray-700 group-hover:text-primary transition-all duration-300 relative z-10 ${isExpanded ? "rotate-180 text-primary" : "group-hover:translate-y-0.5"
                            }`}
                        />
                      )}
                      {!isExpanded && (
                        <span className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      )}
                    </button>
                  );
                })
              ) : (
                <span className="text-xs text-gray-500">Ангилал олдсонгүй</span>
              )}
            </div>

            {/* Children Categories Row - Show when parent is expanded */}
            {expandedCategoryId !== null && (
              <div className="flex items-center gap-2 py-2.5 px-4 bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-t border-gray-200/60 overflow-x-auto">
                {categories
                  .find((cat) => cat.id === expandedCategoryId)
                  ?.children?.map((child) => (
                    <a
                      key={child.id}
                      href={`/products?categoryId=${encodeURIComponent(child.id)}`}
                      className="text-xs sm:text-sm font-medium text-gray-600 hover:text-primary whitespace-nowrap py-2 px-3 shrink-0 rounded-lg transition-all duration-200 hover:bg-white/80 hover:shadow-sm"
                      onClick={() => setExpandedCategoryId(null)}
                    >
                      {child.name}
                    </a>
                  ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileProfileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-101 transition-opacity"
          onClick={() => setMobileProfileMenuOpen(false)}
        />
      )}

      {/* Mobile Profile Drawer - Slides from left */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-101 shadow-2xl transform transition-transform duration-300 ease-in-out ${mobileProfileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              {mounted && isAuthenticated && userName ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {getUserInitials(userName)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{userName}</h2>
                    <p className="text-xs text-gray-500">Цэс</p>
                  </div>
                </>
              ) : (
                <h2 className="text-lg font-semibold text-gray-900">Цэс</h2>
              )}
            </div>
            <button
              onClick={() => setMobileProfileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              aria-label="Цэс хаах"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Drawer Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col py-2">
              {mounted && isAuthenticated ? (
                <>
                  <a
                    href="/profile"
                    onClick={() => setMobileProfileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-5 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors duration-200 rounded-lg mx-2"
                  >
                    <User className="w-5 h-5" />
                    <span>Миний профайл</span>
                  </a>
                  <a
                    href="#"
                    onClick={() => setMobileProfileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-5 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors duration-200 rounded-lg mx-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span>Миний захиалга</span>
                  </a>
                  <a
                    href="#"
                    onClick={() => setMobileProfileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-5 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors duration-200 rounded-lg mx-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>Хүслийн жагсаалт</span>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 py-3 px-5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 text-left rounded-lg mx-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Гарах</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileProfileMenuOpen(false);
                    setLoginModalOpen(true);
                  }}
                  className="flex items-center gap-3 p-3 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors duration-200 rounded-lg mx-2 w-full text-left"
                >
                  <User className="w-5 h-5" />
                  <span>Нэвтрэх</span>
                </button>
              )}
            </div>
          </div>

          {/* Drawer Footer - Search Input */}
          <div className="border-t border-gray-200 p-4">
            <form
              onSubmit={(e) => {
                handleSearch(e, mobileSearchQuery);
                setMobileProfileMenuOpen(false);
              }}
              className="relative"
            >
              <Input
                type="text"
                placeholder="Тавилга, чимэглэл, гэрийн хэрэгсэл хайх...."
                className="pr-10 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-muted-foreground hover:text-primary hover:bg-gray-100 rounded-md cursor-pointer transition-colors duration-200"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Auth Modals */}
      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
        onSwitchToOTP={() => {
          setLoginModalOpen(false);
          setOtpModalOpen(true);
        }}
      />
      <RegisterModal
        open={registerModalOpen}
        onOpenChange={setRegisterModalOpen}
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
      <OTPModal
        open={otpModalOpen}
        onOpenChange={setOtpModalOpen}
        onSwitchToLogin={() => {
          setOtpModalOpen(false);
          setLoginModalOpen(true);
        }}
        onOTPVerified={() => {
          // OTP verified, will navigate to reset password page
        }}
      />
    </>
  );
}
