"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Search, ShoppingCart, User, ChevronDown } from "lucide-react";
import { useCategories, type Category } from "@/lib/api";

export function Navigation() {
  const [cartCount, setCartCount] = useState(0);
  const [mobileProfileMenuOpen, setMobileProfileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const auth = localStorage.getItem("isAuthenticated");
    setIsAuthenticated(auth === "true");

    // Load cart count from localStorage
    const updateCartCount = () => {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        const totalItems = cartItems.reduce(
          (sum: number, item: any) => sum + (item.quantity || 1),
          0
        );
        setCartCount(totalItems);
      }
    };

    // Update authentication state
    const updateAuthState = () => {
      const auth = localStorage.getItem("isAuthenticated");
      setIsAuthenticated(auth === "true");
    };

    updateCartCount();
    // Listen for storage changes (when cart is updated in other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cart") {
        updateCartCount();
      } else if (e.key === "isAuthenticated") {
        updateAuthState();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("authStateChanged", updateAuthState);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("authStateChanged", updateAuthState);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("mobile");
    localStorage.removeItem("profile_name");
    localStorage.removeItem("profile_email");
    localStorage.removeItem("profile_address");
    setIsAuthenticated(false);
    setMobileProfileMenuOpen(false);
    // Dispatch custom event for instant navigation update
    window.dispatchEvent(new CustomEvent("authStateChanged"));
    window.location.href = "/";
  };

  const handleSearch = (e: FormEvent, query: string) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setSearchQuery("");
      setMobileSearchQuery("");
    }
  };

  // Fetch categories from API
  const { data: categoriesResponse, isLoading: categoriesLoading } =
    useCategories();
  const allCategories = categoriesResponse?.data || [];
  // Filter to show only parent categories (parentId === null)
  const categories = allCategories.filter((cat) => cat.parentId === null);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Profile Icon - Mobile/Small Screens (Left Side) */}
            <button
              onClick={() => setMobileProfileMenuOpen(!mobileProfileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded"
              aria-label="Профайл цэс нээх"
            >
              <User className="w-6 h-6" />
            </button>

            {/* Logo */}
            <a href="/" className="shrink-0 flex items-center">
              <Image
                src="/logo_white.jpg"
                alt="Gerar"
                width={120}
                height={40}
                className="h-8 sm:h-10 w-auto"
                priority
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
                  className="pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-primary cursor-pointer"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2">
              {mounted && isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden sm:flex text-sm sm:text-base whitespace-nowrap"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Профайл
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white border-0 shadow-lg"
                  >
                    <DropdownMenuItem asChild>
                      <a href="/profile">Профайл харах</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Гарах</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" asChild className="hidden sm:flex">
                  <a
                    href="/auth/login"
                    className="text-sm sm:text-base whitespace-nowrap"
                  >
                    Нэвтрэх
                  </a>
                </Button>
              )}
              <Button variant="ghost" size="icon" className="relative" asChild>
                <a href="/cart">
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </a>
              </Button>
            </div>
          </div>

          {/* Category Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-6 py-3 border-t border-gray-200">
            {categoriesLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Ангилал ачааллаж байна...</span>
              </div>
            ) : categories.length > 0 ? (
              <NavigationMenu>
                <NavigationMenuList className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
                  {categories.map((category) => {
                    const hasChildren =
                      category.children && category.children.length > 0;

                    if (hasChildren) {
                      return (
                        <NavigationMenuItem
                          key={category.id}
                          className="shrink-0"
                        >
                          <NavigationMenuTrigger className="text-sm text-gray-700 hover:text-primary whitespace-nowrap h-auto py-0 px-0 bg-transparent data-[state=open]:bg-transparent">
                            {category.name}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="grid w-[200px] gap-1 p-2">
                              {category.children?.map((child) => (
                                <li key={child.id}>
                                  <NavigationMenuLink asChild>
                                    <a
                                      href={`/category?cat=${encodeURIComponent(
                                        child.id
                                      )}`}
                                      className="block select-none rounded-sm px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                    >
                                      {child.name}
                                    </a>
                                  </NavigationMenuLink>
                                </li>
                              ))}
                            </ul>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      );
                    }

                    return (
                      <NavigationMenuItem
                        key={category.id}
                        className="shrink-0"
                      >
                        <NavigationMenuLink
                          href={`/category?cat=${encodeURIComponent(
                            category.id
                          )}`}
                          className="text-sm text-gray-700 hover:text-primary whitespace-nowrap"
                        >
                          {category.name}
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            ) : (
              <span className="text-sm text-gray-500">Ангилал олдсонгүй</span>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Category Menu - Always visible, sticky */}
      <nav className="lg:hidden bg-white border-b border-gray-200 sticky top-[73px] z-30 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col">
            {/* Categories Row */}
            <div className="flex items-center gap-4 py-3 overflow-x-auto">
              {categoriesLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  <span>Ачааллаж байна...</span>
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
                            `/category?cat=${encodeURIComponent(category.id)}`
                          );
                        }
                      }}
                      className={`text-xs sm:text-sm whitespace-nowrap py-1 shrink-0 flex items-center gap-1 ${
                        isExpanded
                          ? "text-primary font-semibold"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      {category.name}
                      {hasChildren && (
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
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
              <div className="flex items-center gap-4 py-2 px-4 bg-gray-50 border-t border-gray-200 overflow-x-auto">
                {categories
                  .find((cat) => cat.id === expandedCategoryId)
                  ?.children?.map((child) => (
                    <a
                      key={child.id}
                      href={`/category?cat=${encodeURIComponent(child.id)}`}
                      className="text-xs sm:text-sm text-gray-600 hover:text-primary whitespace-nowrap py-1 shrink-0"
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
          className="lg:hidden fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setMobileProfileMenuOpen(false)}
        />
      )}

      {/* Mobile Profile Drawer - Slides from left */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          mobileProfileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Цэс</h2>
            <button
              onClick={() => setMobileProfileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded"
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
                    className="flex items-center gap-3 py-3 px-4 text-sm text-gray-700 hover:text-primary hover:bg-secondary transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>Миний профайл</span>
                  </a>
                  <a
                    href="#"
                    onClick={() => setMobileProfileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-4 text-sm text-gray-700 hover:text-primary hover:bg-secondary transition-colors"
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
                    className="flex items-center gap-3 py-3 px-4 text-sm text-gray-700 hover:text-primary hover:bg-secondary transition-colors"
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
                    className="flex items-center gap-3 py-3 px-4 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-left"
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
                <a
                  href="/auth/login"
                  onClick={() => setMobileProfileMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-4 text-sm text-gray-700 hover:text-primary hover:bg-secondary transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>Нэвтрэх</span>
                </a>
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
                className="pr-10"
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-primary cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
