"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { useProducts, useCategories, type Product, type Category } from "@/lib/api";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { ProductSliderSkeleton, CategorySkeleton, Spinner } from "@/components/skeleton";

// Component to display products from a subcategory
function SubcategoryProductsSection({ 
  subcategory, 
  parentCategoryName, 
  products 
}: { 
  subcategory: Category; 
  parentCategoryName?: string;
  products: Product[];
}) {
  const subcategoryScrollRef = useRef<HTMLDivElement>(null);
  
  const scrollSubcategoryProducts = (direction: 'left' | 'right') => {
    if (subcategoryScrollRef.current) {
      const scrollAmount = 300;
      const currentScroll = subcategoryScrollRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      subcategoryScrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };
  
  // Only show section if there are products
  if (products.length === 0) {
    return null;
  }
  
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 lg:mb-12 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              {subcategory.name}
            </h2>
            {parentCategoryName && (
              <p className="text-gray-500 text-sm sm:text-base mb-1">
                {parentCategoryName}
              </p>
            )}
            <p className="text-gray-600 text-sm sm:text-base">
              {subcategory.description || `${subcategory.name} дэд ангиллын бараа`}
            </p>
          </div>
          <Link
            href={`/category?categoryId=${subcategory.id}`}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm sm:text-base group transition-colors"
          >
            Бүгдийг харах
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="relative group">
          {/* Navigation Buttons - Desktop Only */}
          <button
            onClick={() => scrollSubcategoryProducts('left')}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
            aria-label={`${subcategory.name} - Өмнөх бараа`}
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => scrollSubcategoryProducts('right')}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
            aria-label={`${subcategory.name} - Дараагийн бараа`}
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
          <div 
            ref={subcategoryScrollRef}
            className="product-slider overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 scroll-smooth"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
            }}
          >
            <div className="flex gap-4 lg:gap-6 pb-4 min-w-max">
              {products.slice(0, 12).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={parseFloat(product.price)}
                  original={
                    product.originalPrice
                      ? parseFloat(product.originalPrice)
                      : undefined
                  }
                  imageUrl={product.firstImage || product.images?.[0]}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const productsScrollRef = useRef<HTMLDivElement>(null);
  const offersScrollRef = useRef<HTMLDivElement>(null);

  // Fetch products sorted by newest first - fetch more to have enough for subcategory grouping
  const { data: productsResponse, isLoading: productsLoading } = useProducts({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 100, // Fetch more products to group by subcategory
  });

  // Fetch categories
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();

  const products = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];

  // Create carousel items from products with discounts
  const carouselItems = useMemo(() => {
    const discountedProducts = products
      .filter((p) => p.hasDiscount && p.discountPercentage && p.discountPercentage >= 30)
      .slice(0, 5);
    
    if (discountedProducts.length === 0) {
      return products.slice(0, 5).map((product) => ({
        id: product.id,
        title: product.name.toUpperCase(),
        subtitle: product.description?.slice(0, 50) || "Шинэ бараа",
        discount: product.hasDiscount && product.discountPercentage
          ? `${product.discountPercentage}% ХЯМДАРСАН`
          : "Онцгой санал",
        link: `/product/${product.id}`,
        imageUrl: product.firstImage || product.images?.[0],
      }));
    }

    return discountedProducts.map((product) => ({
      id: product.id,
      title: product.name.toUpperCase(),
      subtitle: product.description?.slice(0, 50) || "Шинэ бараа",
      discount: product.discountPercentage
        ? `${product.discountPercentage}% ХЯМДАРСАН`
        : "Онцгой санал",
      link: `/product/${product.id}`,
      imageUrl: product.firstImage || product.images?.[0],
    }));
  }, [products]);

  const restartTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (!isPaused && carouselItems.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
      }, 5000);
    }
  }, [isPaused, carouselItems.length]);

  useEffect(() => {
    restartTimer();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [restartTimer]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    restartTimer();
  };

  const goToPrevious = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + carouselItems.length) % carouselItems.length
    );
    restartTimer();
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    restartTimer();
  };

  const handleItemClick = (link: string) => {
    router.push(link);
  };

  const scrollProducts = (direction: 'left' | 'right') => {
    if (productsScrollRef.current) {
      const scrollAmount = 300;
      const currentScroll = productsScrollRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      productsScrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  const scrollOffers = (direction: 'left' | 'right') => {
    if (offersScrollRef.current) {
      const scrollAmount = 300;
      const currentScroll = offersScrollRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      offersScrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  // Get top-level categories only
  const topCategories = categories.filter((cat) => !cat.parentId).slice(0, 8);
  
  // Get subcategories (categories with parentId)
  const subcategories = categories.filter((cat) => cat.parentId !== null);
  
  // Create a map of category ID to category for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((cat) => {
      map.set(cat.id, cat);
    });
    return map;
  }, [categories]);
  
  // Group products by subcategory
  const productsBySubcategory = useMemo(() => {
    const grouped = new Map<number, { subcategory: Category; products: Product[]; parentName?: string }>();
    
    products.forEach((product) => {
      // Check all categories associated with the product
      if (product.categories && product.categories.length > 0) {
        product.categories.forEach((productCategory) => {
          // Find if this category is a subcategory
          const fullCategory = categoryMap.get(productCategory.id);
          if (fullCategory && fullCategory.parentId !== null) {
            // This is a subcategory
            if (!grouped.has(fullCategory.id)) {
              const parentCategory = categoryMap.get(fullCategory.parentId);
              grouped.set(fullCategory.id, {
                subcategory: fullCategory,
                products: [],
                parentName: parentCategory?.name,
              });
            }
            const group = grouped.get(fullCategory.id)!;
            // Avoid duplicate products
            if (!group.products.find((p) => p.id === product.id)) {
              group.products.push(product);
            }
          }
        });
      }
      // Also check categoryId if categories array is empty
      else if (product.categoryId) {
        const fullCategory = categoryMap.get(product.categoryId);
        if (fullCategory && fullCategory.parentId !== null) {
          if (!grouped.has(fullCategory.id)) {
            const parentCategory = categoryMap.get(fullCategory.parentId);
            grouped.set(fullCategory.id, {
              subcategory: fullCategory,
              products: [],
              parentName: parentCategory?.name,
            });
          }
          const group = grouped.get(fullCategory.id)!;
          if (!group.products.find((p) => p.id === product.id)) {
            group.products.push(product);
          }
        }
      }
    });
    
    // Convert to array and sort by number of products (descending)
    return Array.from(grouped.values())
      .filter((group) => group.products.length > 0)
      .sort((a, b) => b.products.length - a.products.length)
      .slice(0, 8); // Limit to top 8 subcategories with most products
  }, [products, categoryMap]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main>
        {/* Hero Carousel */}
        <section
          className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] [background-size:20px_20px]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
            {carouselItems.length > 0 ? (
              <>
                <div className="relative min-h-[150px] sm:min-h-[180px] lg:min-h-[200px]">
                  {/* Navigation Buttons */}
                  {carouselItems.length > 1 && (
                    <>
                      <button
                        onClick={goToPrevious}
                        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 z-30 border border-white/30"
                        aria-label="Өмнөх слайд"
                        style={{ transform: 'translateY(-150%) translateX(-150%)' }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={goToNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 z-30 border border-white/30"
                        aria-label="Дараагийн слайд"
                        style={{ transform: 'translateY(-150%) translateX(150%)' }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <div className="px-10 sm:px-12 lg:px-14">
                  {carouselItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                        index === currentSlide
                          ? "opacity-100 translate-x-0"
                          : index < currentSlide
                          ? "opacity-0 -translate-x-full"
                          : "opacity-0 translate-x-full"
                      }`}
                    >
                      <div
                        className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6 cursor-pointer group h-full"
                        onClick={() => handleItemClick(item.link)}
                      >
                          <div className="flex-1 text-center lg:text-left space-y-2 lg:space-y-3 animate-in fade-in slide-in-from-left-5 duration-500">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                              <Sparkles className="w-3 h-3" />
                              <span className="opacity-95">{item.subtitle}</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
                              {item.title}
                            </h2>
                            <div className="inline-block">
                              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                                {item.discount}
                              </p>
                            </div>
                          </div>
                          <div className="flex-1 flex justify-center lg:justify-end w-full lg:w-auto">
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 group-hover:scale-105 transition-transform duration-500">
                              {item.imageUrl ? (
                                <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl">
                                  <div className="text-8xl sm:text-9xl opacity-80">
                                    🪑
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indicator Dots */}
                {carouselItems.length > 1 && (
                  <div className="flex justify-center lg:justify-start gap-2 mt-4 lg:mt-6 relative z-10">
                    {carouselItems.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-300 rounded-full ${
                          index === currentSlide
                            ? "bg-white w-8 h-2 shadow-lg"
                            : "bg-white/50 w-2 h-2 hover:bg-white/70 hover:w-3"
                        }`}
                        aria-label={`Слайд ${index + 1} руу шилжих`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="min-h-[200px] flex items-center justify-center">
                <Spinner size="lg" className="border-white/30 border-t-white" />
              </div>
            )}
          </div>
        </section>

        {/* Featured Categories Section */}
        {topCategories.length > 0 && (
          <section className="py-12 lg:py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  Ангилалууд
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 lg:gap-6">
                {categoriesLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <CategorySkeleton key={i} />
                  ))
                ) : (
                  topCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category?categoryId=${category.id}`}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 border border-gray-200 hover:border-primary/30"
                  >
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                        🛋️
                      </div>
                      <h3 className="font-semibold text-base lg:text-lg text-gray-900 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        <section className="py-12 lg:py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 lg:mb-12 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                  Сүүлд нэмэгдсэн бараа
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Шинэчлэгдсэн барааны жагсаалт
                </p>
              </div>
              <Link
                href="/category"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm sm:text-base group transition-colors"
              >
                Бүгдийг харах
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {productsLoading ? (
              <ProductSliderSkeleton count={6} />
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-600 text-lg">Одоогоор бараа байхгүй байна</p>
              </div>
            ) : (
              <div className="relative group">
                {/* Navigation Buttons - Desktop Only */}
                <button
                  onClick={() => scrollProducts('left')}
                  className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                  aria-label="Өмнөх бараа"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={() => scrollProducts('right')}
                  className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                  aria-label="Дараагийн бараа"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
                <div 
                  ref={productsScrollRef}
                  className="product-slider overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 scroll-smooth"
                  style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
                  }}
                >
                  <div className="flex gap-4 lg:gap-6 pb-4 min-w-max">
                    {products.slice(0, 12).map((product) => (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        price={parseFloat(product.price)}
                        original={
                          product.originalPrice
                            ? parseFloat(product.originalPrice)
                            : undefined
                        }
                        imageUrl={product.firstImage || product.images?.[0]}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Special Offers Section */}
        {products.filter((p) => p.hasDiscount).length > 0 && (
          <section className="py-12 lg:py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  Хямдралтай бараа
                </h2>
              </div>
              <div className="relative group">
                {/* Navigation Buttons - Desktop Only */}
                <button
                  onClick={() => scrollOffers('left')}
                  className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                  aria-label="Өмнөх санал"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={() => scrollOffers('right')}
                  className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                  aria-label="Дараагийн санал"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
                <div 
                  ref={offersScrollRef}
                  className="product-slider overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 scroll-smooth"
                  style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
                  }}
                >
                  <div className="flex gap-4 lg:gap-6 pb-4 min-w-max">
                    {products
                      .filter((p) => p.hasDiscount && p.discountPercentage && p.discountPercentage >= 20)
                      .slice(0, 8)
                      .map((product) => (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          name={product.name}
                          price={parseFloat(product.price)}
                          original={
                            product.originalPrice
                              ? parseFloat(product.originalPrice)
                              : undefined
                          }
                          imageUrl={product.firstImage || product.images?.[0]}
                          featured={true}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Subcategory-based Product Sections */}
        {productsBySubcategory.length > 0 ? (
          productsBySubcategory.map((group, index) => (
            <SubcategoryProductsSection
              key={group.subcategory.id}
              subcategory={group.subcategory}
              parentCategoryName={group.parentName}
              products={group.products}
            />
          ))
        ) : productsLoading ? (
          <section className="py-12 lg:py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ProductSliderSkeleton count={6} />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
