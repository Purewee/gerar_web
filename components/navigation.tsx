'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Search, ShoppingCart, User, ChevronDown, Menu, ChevronRight } from 'lucide-react';
import { useCart, authApi } from '@/lib/api';
import { useCategoriesStore } from '@/lib/stores/categories';
import { LoginModal } from '@/components/auth/login-modal';
import { RegisterModal } from '@/components/auth/register-modal';
import { OTPModal } from '@/components/auth/otp-modal';
import { RegisterVerifyModal } from '@/components/auth/register-verify-modal';
import { ResetPasswordModal } from '@/components/auth/reset-password-modal';
import { Spinner, Skeleton } from '@/components/skeleton';
import Link from 'next/link';

export function Navigation() {
  const [mobileProfileMenuOpen, setMobileProfileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [userName, setUserName] = useState<string>('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [hasAutoSelectedCategory, setHasAutoSelectedCategory] = useState(false);
  const [selectedChildCategoryId, setSelectedChildCategoryId] = useState<number | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [registerVerifyModalOpen, setRegisterVerifyModalOpen] = useState(false);
  const [registrationData, setRegistrationData] = useState<{
    phoneNumber: string;
    pin: string;
    name: string;
  } | null>(null);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState<{
    phoneNumber: string;
    otpCode: string;
  } | null>(null);
  // For desktop ANГИЛАЛ mega menu: which parent category is hovered
  const [desktopActiveCategory, setDesktopActiveCategory] = useState<{
    id: number;
    name: string;
    children?: { id: number; name: string }[];
  } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Hide categories on payment, cart, and order create pages
  const hideCategories =
    pathname?.includes('/payment') ||
    pathname === '/cart' ||
    pathname === '/orders/create' ||
    false;

  // Fetch cart data from API
  const { data: cartResponse } = useCart();
  const cartItems = cartResponse?.data || [];
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  useEffect(() => {
    setMounted(true);
    const auth = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(auth === 'true');

    // Load user name from localStorage
    const updateUserName = () => {
      const name = localStorage.getItem('user_name') || '';
      setUserName(name);
    };

    // Update authentication state
    const updateAuthState = () => {
      const auth = localStorage.getItem('isAuthenticated');
      setIsAuthenticated(auth === 'true');
      updateUserName();
    };

    updateUserName();
    // Listen for storage changes (when cart is updated in other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isAuthenticated' || e.key === 'user_name') {
        updateAuthState();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-tab updates
    window.addEventListener('authStateChanged', updateAuthState);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', updateAuthState);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (!pathname.startsWith('/products')) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const searchValue = params.get('search') || '';
    setSearchQuery(searchValue);
    setMobileSearchQuery(searchValue);
  }, [pathname]);

  // Open login modal when a private API request fails with 401 (authRequired event from apiFetch)
  useEffect(() => {
    const onAuthRequired = () => {
      setLoginModalOpen(true);
    };
    window.addEventListener('authRequired', onAuthRequired);
    return () => window.removeEventListener('authRequired', onAuthRequired);
  }, []);

  // Open login modal when requested from other components (e.g. bottom nav "Нэвтрэх")
  useEffect(() => {
    const onOpenLogin = () => setLoginModalOpen(true);
    window.addEventListener('openLoginModal', onOpenLogin);
    return () => window.removeEventListener('openLoginModal', onOpenLogin);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setIsAuthenticated(false);
      setUserName('');
      setMobileProfileMenuOpen(false);
      localStorage.clear();
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      setIsAuthenticated(false);
      setUserName('');
      setMobileProfileMenuOpen(false);
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }
  };

  const handleSearch = (e: FormEvent, query: string) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setSearchQuery('');
      setMobileSearchQuery('');
    }
  };

  // Get categories from store (hydrated by CategoriesProvider)
  const allCategories = useCategoriesStore(state => state.categories);
  const categoriesLoading = useCategoriesStore(state => state.isLoading);
  // Filter to show only parent categories (parentId === null)
  const categories = allCategories.filter(cat => cat.parentId === null);

  // Get active categoryId from URL
  const categoryIdParam = searchParams?.get('categoryId');
  const activeCategoryId = categoryIdParam ? parseInt(categoryIdParam, 10) : null;
  const isValidCategoryId =
    activeCategoryId !== null && !isNaN(activeCategoryId) && activeCategoryId > 0;
  const finalActiveCategoryId = isValidCategoryId ? activeCategoryId : null;

  // Find the active category (could be parent or child)
  const findActiveCategory = () => {
    if (!finalActiveCategoryId) return null;
    // First check if it's a parent category
    const parentCategory = categories.find(cat => cat.id === finalActiveCategoryId);
    if (parentCategory) return { category: parentCategory, isChild: false };

    // Then check if it's a child category
    for (const parent of categories) {
      const childCategory = parent.children?.find(child => child.id === finalActiveCategoryId);
      if (childCategory) return { category: childCategory, parent, isChild: true };
    }
    return null;
  };

  const activeCategoryInfo = findActiveCategory();

  // Auto-select category based on URL or first category on mobile when categories load
  useEffect(() => {
    if (hasAutoSelectedCategory || categoriesLoading || categories.length === 0) return;
    if (typeof window === 'undefined') return;

    // Only run on mobile (screen width < 1024px, which is lg breakpoint)
    const isMobile = window.innerWidth < 1024;
    if (!isMobile) return;

    // If there's an active category from URL, use it
    if (activeCategoryInfo) {
      if (activeCategoryInfo.isChild && activeCategoryInfo.parent) {
        setExpandedCategoryId(activeCategoryInfo.parent.id);
        setSelectedChildCategoryId(activeCategoryInfo.category.id);
        setHasAutoSelectedCategory(true);
        return;
      } else if (!activeCategoryInfo.isChild) {
        // If it's a parent category with children, expand it
        if (
          activeCategoryInfo.category.children &&
          activeCategoryInfo.category.children.length > 0
        ) {
          setExpandedCategoryId(activeCategoryInfo.category.id);
          setSelectedChildCategoryId(activeCategoryInfo.category.children[0].id);
        }
        setHasAutoSelectedCategory(true);
        return;
      }
    }

    // Fallback: Find first parent category with children
    const firstParentWithChildren = categories.find(cat => cat.children && cat.children.length > 0);

    if (
      firstParentWithChildren &&
      firstParentWithChildren.children &&
      firstParentWithChildren.children.length > 0
    ) {
      setExpandedCategoryId(firstParentWithChildren.id);
      setHasAutoSelectedCategory(true);
      // Select first child visually
      const firstChild = firstParentWithChildren.children[0];
      setSelectedChildCategoryId(firstChild.id);
    }
  }, [categories, categoriesLoading, hasAutoSelectedCategory, activeCategoryInfo]);

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="bg-white backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-2 sm:py-3 md:py-5 gap-4">
            {/* Logo - start of nav bar */}
            <Link href="/" className="shrink-0 flex items-center">
              <Image
                src="/logo3.svg"
                alt="GERAR"
                width={120}
                height={40}
                priority
                className="w-[120px] h-7 md:h-10"
                fetchPriority="high"
              />
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4 hidden sm:flex">
              <form onSubmit={e => handleSearch(e, searchQuery)} className="relative w-full">
                <Input
                  type="text"
                  placeholder="Тавилга, чимэглэл, гэрийн хэрэгсэл хайх...."
                  className="pr-10 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value.replace(/[^\p{L}\p{N}\s]/gu, ''))}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-muted-foreground hover:text-primary hover:bg-gray-100 rounded-md cursor-pointer transition-colors duration-200"
                  aria-label="Хайх"
                >
                  <Search className="w-5 h-5" aria-hidden="true" />
                </button>
              </form>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-3">
              {/* Search icon - left of sidebar button; mobile only */}
              <button
                onClick={() => setMobileProfileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Хайх"
              >
                <Search className="w-6 h-6 text-gray-600" aria-hidden="true" />
              </button>
              {/* Hamburger menu - mobile only, right side */}
              <button
                onClick={() => setMobileProfileMenuOpen(!mobileProfileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Цэс нээх"
              >
                <Menu className="w-6 h-6 text-gray-600" aria-hidden="true" />
              </button>
              {mounted && isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden sm:flex text-sm sm:text-base whitespace-nowrap hover:bg-gray-100 rounded-lg px-3 py-2 transition-all duration-200"
                    >
                      <div className="w-7 h-7 rounded-full bg-linear-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                        {userName ? getUserInitials(userName) : <User className="w-4 h-4" />}
                      </div>
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
              {/* Cart - hidden on mobile (cart is in bottom nav) */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hidden md:flex hover:bg-gray-100 rounded-lg transition-all duration-200"
                asChild
              >
                <Link
                  href="/cart"
                  aria-label={mounted && cartCount > 0 ? `Сагс (${cartCount} зүйл)` : 'Сагс'}
                >
                  <ShoppingCart className="w-6 h-6 text-gray-700" aria-hidden="true" />
                  {mounted && cartCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 bg-primary text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-in zoom-in-50"
                      aria-hidden="true"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              </Button>
            </div>
          </div>
          {!hideCategories && (
            <div className="hidden md:block w-full max-w-[1450px] border-t border-gray-200">
              <nav className="m-0 rounded-none text-black h-11 flex items-center justify-start gap-1">
                {categoriesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 px-4">
                    <Spinner size="sm" className="border-white/30 border-t-white" />
                  </div>
                ) : categories.length > 0 ? (
                  <>
                    <HoverCard openDelay={10} closeDelay={10}>
                      <HoverCardTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 p-2 rounded cursor-pointer text-black hover:bg-white/10"
                          aria-label="Ангилал нээх"
                        >
                          <Menu className="size-4" aria-hidden="true" />
                          <span className="uppercase text-sm font-medium">Ангилал</span>
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="bottom"
                        align="start"
                        className="bg-white text-primary w-[700px] p-4 rounded-md shadow-lg border-gray-200"
                      >
                        <div className="flex gap-6">
                          <div className="w-1/3 space-y-0.5 border-r border-gray-200 pr-4">
                            {categories.map(cat => (
                              <div
                                key={cat.id}
                                onMouseEnter={() => setDesktopActiveCategory(cat)}
                                className={`flex justify-between w-full items-center p-2 rounded cursor-pointer text-sm ${
                                  desktopActiveCategory?.id === cat.id
                                    ? 'bg-neutral-100 font-medium'
                                    : 'hover:bg-neutral-50'
                                }`}
                              >
                                <Link
                                  href={`/products?categoryId=${cat.id}`}
                                  className="uppercase w-full text-gray-800 hover:text-primary"
                                >
                                  {cat.name}
                                </Link>
                                {cat.children && cat.children.length > 0 && (
                                  <ChevronRight
                                    className="h-4 w-4 text-neutral-500 shrink-0"
                                    aria-hidden="true"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="w-2/3">
                            {desktopActiveCategory?.children &&
                              desktopActiveCategory.children.length > 0 && (
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                  {desktopActiveCategory.children.map(child => (
                                    <div key={child.id}>
                                      <Link
                                        href={`/products?categoryId=${child.id}`}
                                        className="block font-medium text-gray-800 hover:text-primary uppercase mb-1 text-sm"
                                        aria-label={`${child.name} ангиллын бараа харах`}
                                      >
                                        {child.name}
                                      </Link>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>

                    {/* Each category as HoverCard or Link - first 4 only */}
                    {categories.slice(0, 4).map(category => {
                      const hasChildren = category.children && category.children.length > 0;
                      const isCategoryActive = finalActiveCategoryId === category.id;
                      const hasActiveChild =
                        activeCategoryInfo?.isChild &&
                        activeCategoryInfo?.parent?.id === category.id;

                      if (hasChildren) {
                        return (
                          <HoverCard key={category.id} openDelay={10} closeDelay={10}>
                            <HoverCardTrigger asChild>
                              <Link
                                href={`/products?categoryId=${category.id}`}
                                className={`flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm font-medium outline-none hover:bg-white/10 uppercase ${
                                  isCategoryActive || hasActiveChild ? 'bg-white/10' : ''
                                }`}
                                aria-label={`${category.name} ангиллын бараа харах`}
                                aria-current={isCategoryActive ? 'page' : undefined}
                              >
                                {category.name}
                              </Link>
                            </HoverCardTrigger>
                            <HoverCardContent
                              side="bottom"
                              align="start"
                              className="bg-white text-black w-full md:w-[500px] p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 rounded-md shadow-lg border-gray-200"
                            >
                              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 text-sm">
                                {category.children?.map(child => (
                                  <div key={child.id}>
                                    <Link
                                      href={`/products?categoryId=${child.id}`}
                                      className="font-medium text-gray-600 hover:text-primary uppercase block py-1"
                                      aria-label={`${child.name} ангиллын бараа харах`}
                                    >
                                      {child.name}
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        );
                      }

                      return (
                        <Link
                          key={category.id}
                          href={`/products?categoryId=${category.id}`}
                          className={`flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm font-medium outline-none hover:bg-white/10 uppercase ${
                            isCategoryActive ? 'bg-white/10' : ''
                          }`}
                          aria-label={`${category.name} ангиллын бараа харах`}
                          aria-current={isCategoryActive ? 'page' : undefined}
                        >
                          {category.name}
                        </Link>
                      );
                    })}

                    {/* Хямдралтай link */}
                    <Link
                      href="/products"
                      className="flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm font-medium outline-none hover:bg-white/10 uppercase"
                      aria-label="Хямдралтай бараа харах"
                    >
                      Хямдралтай
                    </Link>
                  </>
                ) : (
                  <span className="text-sm text-gray-400 px-4">Ангилал олдсонгүй</span>
                )}
              </nav>
            </div>
          )}
        </div>
        {/* Category Navigation - Mobile */}
        {!hideCategories && (
          <nav className="block md:hidden bg-white backdrop-blur-md border-b border-gray-200/80 z-40 shadow-sm">
            <div className="w-full px-4">
              {/* Categories Row */}
              <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
                {categoriesLoading ? (
                  <div className="flex items-center gap-2 py-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-lg sm:w-24" />
                    ))}
                  </div>
                ) : categories.length > 0 ? (
                  categories.map(category => {
                    const hasChildren = category.children && category.children.length > 0;
                    const isExpanded = expandedCategoryId === category.id;
                    const isActive = finalActiveCategoryId === category.id;
                    const hasActiveChild =
                      activeCategoryInfo?.isChild && activeCategoryInfo?.parent?.id === category.id;

                    return (
                      <button
                        key={category.id}
                        onClick={e => {
                          if (hasChildren) {
                            e.preventDefault();
                            setExpandedCategoryId(category.id);
                          } else {
                            router.push(`/products?categoryId=${encodeURIComponent(category.id)}`);
                          }
                        }}
                        onBlur={e => {
                          // Remove any lingering focus styles
                          e.currentTarget.style.outline = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        onMouseDown={e => {
                          // Prevent focus ring on mouse click
                          e.currentTarget.style.outline = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        className={`text-xs sm:text-sm font-semibold whitespace-nowrap py-1.5 px-2 shrink-0 flex items-center gap-1.5 rounded-lg transition-all duration-300 relative group outline-none focus:outline-none focus-visible:outline-none bg-white ${
                          isExpanded || isActive || hasActiveChild
                            ? 'text-primary bg-linear-to-r from-primary/15 to-primary/5 shadow-sm'
                            : 'text-gray-700 hover:text-primary hover:bg-linear-to-r hover:from-primary/10 hover:to-primary/5'
                        }`}
                        aria-label={
                          hasChildren
                            ? `${category.name} ангиллын дэд ангилал ${
                                isExpanded ? 'хаах' : 'нээх'
                              }`
                            : `${category.name} ангиллын бараа харах`
                        }
                        aria-expanded={hasChildren ? isExpanded : undefined}
                      >
                        <span className="relative z-10">{category.name}</span>
                        {hasChildren && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-all duration-300 relative z-10 ${
                              isExpanded || hasActiveChild
                                ? 'rotate-180 text-primary'
                                : 'text-gray-700 group-hover:text-primary group-hover:translate-y-0.5'
                            }`}
                            aria-hidden="true"
                          />
                        )}
                        {!isExpanded && !isActive && !hasActiveChild && (
                          <span className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent duration-300 rounded-lg" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-gray-500">Ангилал олдсонгүй</span>
                )}
              </div>

              <div className="flex items-center gap-2 py-2.5 border-t border-gray-200/60 overflow-x-auto scrollbar-hide">
                {categories
                  .find(cat => cat.id === expandedCategoryId)
                  ?.children?.map(child => {
                    const isSelected = selectedChildCategoryId === child.id;
                    const isChildActive = activeCategoryId === child.id;
                    return (
                      <Link
                        key={child.id}
                        href={`/products?categoryId=${encodeURIComponent(child.id)}`}
                        className={`text-xs sm:text-sm font-medium whitespace-nowrap py-2 px-3 shrink-0 rounded-lg transition-all duration-200 ${
                          isSelected || isChildActive
                            ? 'text-primary bg-primary/10 shadow-sm font-semibold'
                            : 'text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm'
                        }`}
                        aria-label={`${child.name} ангиллын бараа харах`}
                        aria-current={isChildActive ? 'page' : undefined}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileProfileMenuOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/50 z-101"
          onClick={() => setMobileProfileMenuOpen(false)}
        />
      )}

      {/* Mobile Profile Drawer - Slides from right */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-101 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          mobileProfileMenuOpen ? 'translate-x-0' : 'translate-x-full'
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    href="/profile/orders"
                    onClick={() => setMobileProfileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-5 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors duration-200 rounded-lg mx-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    href="/profile/favorites"
                    onClick={() => setMobileProfileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-5 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors duration-200 rounded-lg mx-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>Хүслийн жагсаалт</span>
                  </a>
                  <a
                    href="/profile/addresses"
                    onClick={() => setMobileProfileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-5 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors duration-200 rounded-lg mx-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Хаягууд</span>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 py-3 px-5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 text-left rounded-lg mx-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              onSubmit={e => {
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
                onChange={e => setMobileSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-muted-foreground hover:text-primary hover:bg-gray-100 rounded-md cursor-pointer transition-colors duration-200"
                aria-label="Хайх"
              >
                <Search className="w-5 h-5" aria-hidden="true" />
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
        onOTPSent={(phoneNumber, pin, name) => {
          setRegistrationData({ phoneNumber, pin, name });
          setRegisterVerifyModalOpen(true);
        }}
      />
      <RegisterVerifyModal
        open={registerVerifyModalOpen}
        onOpenChange={setRegisterVerifyModalOpen}
        onSwitchToLogin={() => {
          setRegisterVerifyModalOpen(false);
          setLoginModalOpen(true);
        }}
        phoneNumber={registrationData?.phoneNumber || ''}
        pin={registrationData?.pin || ''}
        name={registrationData?.name || ''}
      />
      <OTPModal
        open={otpModalOpen}
        onOpenChange={setOtpModalOpen}
        onSwitchToLogin={() => {
          setOtpModalOpen(false);
          setLoginModalOpen(true);
        }}
        onOTPVerified={(phoneNumber, otpCode) => {
          // OTP verified, open reset password modal
          setResetPasswordData({ phoneNumber, otpCode });
          setResetPasswordModalOpen(true);
        }}
        purpose="PASSWORD_RESET"
      />
      <ResetPasswordModal
        open={resetPasswordModalOpen}
        onOpenChange={setResetPasswordModalOpen}
        onSwitchToLogin={() => {
          setResetPasswordModalOpen(false);
          setLoginModalOpen(true);
        }}
        phoneNumber={resetPasswordData?.phoneNumber || ''}
        otpCode={resetPasswordData?.otpCode || ''}
      />
    </>
  );
}
