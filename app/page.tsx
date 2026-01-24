'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { useProducts, useCategoryProducts, type Product, type Category } from '@/lib/api';
import { useCategoriesStore } from '@/lib/stores/categories';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { ProductSliderSkeleton, CategorySkeleton, Spinner } from '@/components/skeleton';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

// Component to display products from a category
function CategoryProductsSection({ category }: { category: Category }) {
  const { data: categoryProductsResponse, isLoading: categoryProductsLoading } =
    useCategoryProducts(
      category.id,
      true, // include subcategories
    );

  const categoryProducts = categoryProductsResponse?.data || [];

  // Only show section if there are products
  if (categoryProductsLoading) {
    return (
      <section className="py-6 sm:py-10 lg:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 ">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{category.name}</h2>
          </div>
          <ProductSliderSkeleton count={6} />
        </div>
      </section>
    );
  }

  if (categoryProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-10 lg:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 ">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 lg:mb-12 gap-2 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{category.name}</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {category.description || `${category.name} дэд ангиллын бараа`}
            </p>
          </div>
          <Link
            href={`/products?categoryId=${category.id}`}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm sm:text-base group transition-colors"
          >
            Бүгдийг харах
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="relative group">
          {/* Navigation Buttons - Desktop Only */}
          <button
            className={`category-swiper-prev-${category.id} hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110`}
            aria-label={`${category.name} - Өмнөх бараа`}
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            className={`category-swiper-next-${category.id} hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110`}
            aria-label={`${category.name} - Дараагийн бараа`}
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: `.category-swiper-prev-${category.id}`,
              nextEl: `.category-swiper-next-${category.id}`,
            }}
            slidesPerView={2}
            breakpoints={{
              640: { slidesPerView: 3, spaceBetween: 16 },
              768: { slidesPerView: 4, spaceBetween: 16 },
              1024: { slidesPerView: 5, spaceBetween: 24 },
            }}
            className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4"
          >
            {categoryProducts.slice(0, 12).map(product => (
              <SwiperSlide key={product.id}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={parseFloat(product.price)}
                  original={product.originalPrice ? parseFloat(product.originalPrice) : undefined}
                  imageUrl={product.firstImage || product.images?.[0]}
                />
              </SwiperSlide>
            ))}
          </Swiper>
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

  // Fetch products sorted by newest first - fetch more to have enough for subcategory grouping
  const { data: productsResponse, isLoading: productsLoading } = useProducts({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 100, // Fetch more products to group by subcategory
  });

  // Get categories from store (hydrated by CategoriesProvider)
  const categories = useCategoriesStore(state => state.categories);
  const categoriesLoading = useCategoriesStore(state => state.isLoading);

  const products = productsResponse?.data || [];

  // Create carousel items from products with discounts
  const carouselItems = useMemo(() => {
    const discountedProducts = products
      .filter(p => p.hasDiscount && p.discountPercentage && p.discountPercentage >= 30)
      .slice(0, 5);

    if (discountedProducts.length === 0) {
      return products.slice(0, 5).map(product => ({
        id: product.id,
        title: product.name.toUpperCase(),
        subtitle: product.description?.slice(0, 50) || 'Шинэ бараа',
        discount:
          product.hasDiscount && product.discountPercentage
            ? `${product.discountPercentage}% ХЯМДАРСАН`
            : 'Онцгой санал',
        link: `/product/${product.id}`,
        imageUrl: product.firstImage || product.images?.[0],
      }));
    }

    return discountedProducts.map(product => ({
      id: product.id,
      title: product.name.toUpperCase(),
      subtitle: product.description?.slice(0, 50) || 'Шинэ бараа',
      discount: product.discountPercentage
        ? `${product.discountPercentage}% ХЯМДАРСАН`
        : 'Онцгой санал',
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
        setCurrentSlide(prev => (prev + 1) % carouselItems.length);
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
    setCurrentSlide(prev => (prev - 1 + carouselItems.length) % carouselItems.length);
    restartTimer();
  };

  const goToNext = () => {
    setCurrentSlide(prev => (prev + 1) % carouselItems.length);
    restartTimer();
  };

  const handleItemClick = (link: string) => {
    router.push(link);
  };

  // Get top-level categories only
  const topCategories = categories.filter(cat => !cat.parentId).slice(0, 8);

  // Get subcategories (categories with parentId)
  const subcategories = categories.filter(cat => cat.parentId !== null);

  // Create a map of category ID to category for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach(cat => {
      map.set(cat.id, cat);
    });
    return map;
  }, [categories]);

  // Group products by subcategory
  const productsBySubcategory = useMemo(() => {
    const grouped = new Map<
      number,
      { subcategory: Category; products: Product[]; parentName?: string }
    >();

    products.forEach(product => {
      // Check all categories associated with the product
      if (product.categories && product.categories.length > 0) {
        product.categories.forEach(productCategory => {
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
            if (!group.products.find(p => p.id === product.id)) {
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
          if (!group.products.find(p => p.id === product.id)) {
            group.products.push(product);
          }
        }
      }
    });

    // Convert to array and sort by number of products (descending)
    return Array.from(grouped.values())
      .filter(group => group.products.length > 0)
      .sort((a, b) => b.products.length - a.products.length)
      .slice(0, 8); // Limit to top 8 subcategories with most products
  }, [products, categoryMap]);

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      <main>
        {/* Hero Carousel */}
        <section
          className="relative overflow-hidden bg-linear-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-size-[20px_20px]"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6  py-4 sm:py-6 lg:py-8 relative z-10">
            {carouselItems.length > 0 ? (
              <>
                <div className="relative min-h-[150px] sm:min-h-[180px] lg:min-h-[200px]">
                  {/* Navigation Buttons */}
                  {carouselItems.length > 1 && (
                    <>
                      <button
                        onClick={goToPrevious}
                        className="absolute left-0 top-[150px] -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 z-30 border border-white/30"
                        aria-label="Өмнөх слайд"
                        style={{ transform: 'translateY(-150%) translateX(-150%)' }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={goToNext}
                        className="absolute right-0 top-[150px] -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 z-30 border border-white/30"
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
                            ? 'opacity-100 translate-x-0'
                            : index < currentSlide
                            ? 'opacity-0 -translate-x-full'
                            : 'opacity-0 translate-x-full'
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
                                  <div className="text-8xl sm:text-9xl opacity-80">🪑</div>
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
                            ? 'bg-white w-8 h-2 shadow-lg'
                            : 'bg-white/50 w-2 h-2 hover:bg-white/70 hover:w-3'
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

        {/* Featured Products Section */}
        <section className="py-6 sm:py-10 lg:py-14 bg-linear-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 ">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 lg:mb-12 gap-2 sm:gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                  Сүүлд нэмэгдсэн бараа
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">Шинэчлэгдсэн барааны жагсаалт</p>
              </div>
              <Link
                href="/products"
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
                  className="products-swiper-prev hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                  aria-label="Өмнөх бараа"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  className="products-swiper-next hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                  aria-label="Дараагийн бараа"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
                <Swiper
                  modules={[Navigation]}
                  navigation={{
                    prevEl: '.products-swiper-prev',
                    nextEl: '.products-swiper-next',
                  }}
                  slidesPerView={2}
                  breakpoints={{
                    640: { slidesPerView: 3, spaceBetween: 16 },
                    768: { slidesPerView: 4, spaceBetween: 16 },
                    1024: { slidesPerView: 5, spaceBetween: 24 },
                  }}
                  className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4"
                >
                  {products.slice(0, 12).map(product => (
                    <SwiperSlide key={product.id}>
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        price={parseFloat(product.price)}
                        original={
                          product.originalPrice ? parseFloat(product.originalPrice) : undefined
                        }
                        imageUrl={product.firstImage || product.images?.[0]}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}
          </div>
        </section>

        {/* Category-based Product Sections */}
        {topCategories.map((category, index) => (
          <CategoryProductsSection key={category.id} category={category} />
        ))}
      </main>
    </div>
  );
}
