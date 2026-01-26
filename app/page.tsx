'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { useProducts, useCategoryProducts, type Product, type Category } from '@/lib/api';
import { useCategoriesStore } from '@/lib/stores/categories';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ProductSliderSkeleton, Spinner } from '@/components/skeleton';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Component to display products from a category
// Uses Intersection Observer to lazy load when section comes into view
function CategoryProductsSection({ category }: { category: Category }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Lazy load category products when section is visible
  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }, // Start loading 200px before section is visible
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const { data: categoryProductsResponse, isLoading: categoryProductsLoading } =
    useCategoryProducts(category.id, true, {
      enabled: isVisible, // Only fetch when section is visible (lazy loading)
    });

  const categoryProducts = categoryProductsResponse?.data || [];

  // Don't render until section is visible (lazy loading)
  if (!isVisible) {
    return (
      <section ref={sectionRef} className="py-6 sm:py-10 lg:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{category.name}</h2>
          </div>
          <ProductSliderSkeleton count={6} />
        </div>
      </section>
    );
  }

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
    <section ref={sectionRef} className="py-6 sm:py-10 lg:py-14 bg-white">
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
            aria-label={`${category.name} ангиллын бүх бараа харах`}
          >
            <span>Бүгдийг харах</span>
            <ChevronRight
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="relative group">
          {/* Navigation Buttons - Desktop Only */}
          <button
            className={`category-swiper-prev-${category.id} hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110`}
            aria-label={`${category.name} - Өмнөх бараа`}
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" aria-hidden="true" />
          </button>
          <button
            className={`category-swiper-next-${category.id} hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110`}
            aria-label={`${category.name} - Дараагийн бараа`}
          >
            <ChevronRight className="w-5 h-5 text-gray-700" aria-hidden="true" />
          </button>
          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: `.category-swiper-prev-${category.id}`,
              nextEl: `.category-swiper-next-${category.id}`,
            }}
            slidesPerView={2}
            spaceBetween={16}
            breakpoints={{
              640: { slidesPerView: 3, spaceBetween: 16 },
              768: { slidesPerView: 4, spaceBetween: 16 },
              1024: { slidesPerView: 5, spaceBetween: 16 },
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
                  inGrid
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

  // Fetch products sorted by newest first - fetch more to have enough for subcategory grouping
  const { data: productsResponse, isLoading: productsLoading } = useProducts({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 100, // Fetch more products to group by subcategory
  });

  // Get categories from store (hydrated by CategoriesProvider)
  const categories = useCategoriesStore(state => state.categories);

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

  const handleItemClick = (link: string) => {
    router.push(link);
  };

  // Get top-level categories only
  const topCategories = categories.filter(cat => !cat.parentId).slice(0, 8);

  // Create a map of category ID to category for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach(cat => {
      map.set(cat.id, cat);
    });
    return map;
  }, [categories]);

  // Preload first hero image for LCP optimization
  const firstCarouselImage = carouselItems[0]?.imageUrl;
  useEffect(() => {
    if (firstCarouselImage && typeof document !== 'undefined') {
      // Check if preload link already exists
      const existingPreload = document.querySelector(
        `link[rel="preload"][href="${firstCarouselImage}"]`,
      );
      if (!existingPreload) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = firstCarouselImage;
        link.setAttribute('fetchpriority', 'high');
        // Add imageSizes for responsive images
        link.setAttribute(
          'imagesizes',
          '(max-width: 640px) 128px, (max-width: 1024px) 160px, 192px',
        );
        document.head.appendChild(link);
      }
    }
  }, [firstCarouselImage]);

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      <main>
        {/* Hero Carousel */}
        <section className="relative overflow-hidden bg-linear-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-size-[20px_20px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 relative z-10">
            {carouselItems.length > 0 ? (
              <div className="relative hero-carousel">
                {carouselItems.length > 1 && (
                  <>
                    <button
                      className="hero-swiper-prev absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 border border-white/30"
                      aria-label="Өмнөх слайд"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                    </button>
                    <button
                      className="hero-swiper-next absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 border border-white/30"
                      aria-label="Дараагийн слайд"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                    </button>
                  </>
                )}
                <Swiper
                  modules={[Autoplay, Navigation, Pagination]}
                  navigation={{
                    prevEl: '.hero-swiper-prev',
                    nextEl: '.hero-swiper-next',
                  }}
                  pagination={{
                    clickable: true,
                  }}
                  // autoplay={{
                  //   delay: 5000,
                  //   disableOnInteraction: false,
                  //   pauseOnMouseEnter: true,
                  // }}
                  loop={carouselItems.length > 1}
                  slidesPerView={1}
                  spaceBetween={0}
                  className="hero-carousel min-h-[150px] sm:min-h-[180px] lg:min-h-[200px]"
                >
                  {carouselItems.map(item => (
                    <SwiperSlide key={item.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6 cursor-pointer group h-full min-h-[180px] lg:min-h-[250px] px-4 sm:px-8 lg:px-20 pb-3 sm:pb-0"
                        onClick={() => handleItemClick(item.link)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleItemClick(item.link);
                          }
                        }}
                        aria-label={`${item.title} - Дэлгэрэнгүй мэдээлэл харах`}
                      >
                        <div className="flex-1 text-center lg:text-left space-y-2 lg:space-y-3 order-2 lg:order-1">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                            <Sparkles className="w-3 h-3" aria-hidden="true" />
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
                        <div className="flex-1 flex justify-center lg:justify-end w-full lg:w-auto order-1 lg:order-2">
                          <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 group-hover:scale-105 transition-transform duration-500">
                            {item.imageUrl ? (
                              <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.title}
                                  sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 192px"
                                  className="object-cover"
                                  priority={item.id === carouselItems[0]?.id}
                                  fill
                                  fetchPriority={item.id === carouselItems[0]?.id ? 'high' : 'auto'}
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
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
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
                aria-label="Сүүлд нэмэгдсэн бүх бараа харах"
              >
                <span>Бүгдийг харах</span>
                <ChevronRight
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
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
                  <ChevronLeft className="w-5 h-5 text-gray-700" aria-hidden="true" />
                </button>
                <button
                  className="products-swiper-next hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                  aria-label="Дараагийн бараа"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" aria-hidden="true" />
                </button>
                <Swiper
                  modules={[Navigation]}
                  navigation={{
                    prevEl: '.products-swiper-prev',
                    nextEl: '.products-swiper-next',
                  }}
                  slidesPerView={2}
                  spaceBetween={16}
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
                        inGrid
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
