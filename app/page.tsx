'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { useProducts, type Product } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ProductSliderSkeleton, Spinner } from '@/components/skeleton';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Reusable product list section (slider) with title and "view all" link
function ProductListSection({
  sectionId,
  title,
  description,
  linkHref,
  linkLabel,
  products,
  isLoading,
}: {
  sectionId: string;
  title: string;
  description?: string;
  linkHref: string;
  linkLabel: string;
  products: Product[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="py-6 sm:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{title}</h2>
          </div>
          <ProductSliderSkeleton count={6} />
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-2 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{title}</h2>
            {description && <p className="text-gray-600 text-sm sm:text-base">{description}</p>}
          </div>
          <Link
            href={linkHref}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm sm:text-base group transition-colors"
            aria-label={linkLabel}
          >
            <span>Бүгдийг харах</span>
            <ChevronRight
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="relative group">
          <button
            className={`${sectionId}-swiper-prev cursor-pointer hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110`}
            aria-label={`${title} - Өмнөх бараа`}
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" aria-hidden="true" />
          </button>
          <button
            className={`${sectionId}-swiper-next cursor-pointer hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110`}
            aria-label={`${title} - Дараагийн бараа`}
          >
            <ChevronRight className="w-5 h-5 text-gray-700" aria-hidden="true" />
          </button>
          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: `.${sectionId}-swiper-prev`,
              nextEl: `.${sectionId}-swiper-next`,
            }}
            slidesPerView={2}
            spaceBetween={16}
            breakpoints={{
              640: { slidesPerView: 3, spaceBetween: 16 },
              768: { slidesPerView: 4, spaceBetween: 16 },
              1024: { slidesPerView: 5, spaceBetween: 16 },
            }}
            className={`product-list-swiper -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4 [&_.swiper-wrapper]:items-stretch [&_.swiper-slide]:h-auto [&_.swiper-slide]:flex [&_.swiper-slide]:flex-col [&_.swiper-slide>*]:flex-1 [&_.swiper-slide>*]:min-h-0 [&_.swiper-slide>*]:flex [&_.swiper-slide>*]:flex-col`}
          >
            {products.slice(0, 12).map(product => (
              <SwiperSlide key={product.id} className="h-auto!">
                <ProductCard inGrid product={product} />
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

  const products = (productsResponse?.data || []).filter(p => p.isHidden !== true);

  const saleProducts = products.slice(0, 24);
  const latestProducts = products.slice(0, 24);
  const popularProducts = products.slice(0, 24);

  // Create carousel items from products with discounts (let React Compiler handle memoization)
  const discountedProducts = products
    .filter(p => p.hasDiscount && p.discountPercentage && p.discountPercentage >= 30)
    .slice(0, 5);
  const carouselItems =
    discountedProducts.length === 0
      ? products.slice(0, 5).map(product => ({
          id: product.id,
          title: product.name.toUpperCase(),
          subtitle: product.description?.slice(0, 50) || 'Шинэ бараа',
          discount:
            product.hasDiscount && product.discountPercentage
              ? `${product.discountPercentage}% ХЯМДАРСАН`
              : 'Онцгой санал',
          link: `/product/${product.id}`,
          imageUrl: product.firstImage || product.images?.[0],
        }))
      : discountedProducts.map(product => ({
          id: product.id,
          title: product.name.toUpperCase(),
          subtitle: product.description?.slice(0, 50) || 'Шинэ бараа',
          discount: product.discountPercentage
            ? `${product.discountPercentage}% ХЯМДАРСАН`
            : 'Онцгой санал',
          link: `/product/${product.id}`,
          imageUrl: product.firstImage || product.images?.[0],
        }));

  const handleItemClick = (link: string) => {
    router.push(link);
  };

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
                      className="hero-swiper-prev cursor-pointer absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 border border-white/30"
                      aria-label="Өмнөх слайд"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                    </button>
                    <button
                      className="hero-swiper-next cursor-pointer absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 border border-white/30"
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
                        className="carousel-slide-item flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6 cursor-pointer h-full min-h-[180px] lg:min-h-[250px] px-4 sm:px-8 lg:px-20 pb-3 sm:pb-0 [&:hover_.carousel-image-container]:scale-105"
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
                          <div className="carousel-image-container relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 transition-transform duration-500">
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
                                  unoptimized={
                                    item.imageUrl?.includes('localhost') ||
                                    item.imageUrl?.includes('127.0.0.1') ||
                                    item.imageUrl?.includes('192.168.1.3')
                                  }
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

        {/* Latest products list */}
        <ProductListSection
          sectionId="latest"
          title="Сүүлд нэмэгдсэн бараа"
          description="Шинэчлэгдсэн барааны жагсаалт"
          linkHref="/products"
          linkLabel="Сүүлд нэмэгдсэн бүх бараа харах"
          products={latestProducts}
          isLoading={productsLoading}
        />

        {/* Sale products list */}
        <ProductListSection
          sectionId="sale"
          title="Хямдралтай бараа"
          description="Онцгой хямдралтай бараанууд"
          linkHref="/products"
          linkLabel="Хямдралтай бүх бараа харах"
          products={saleProducts}
          isLoading={productsLoading}
        />

        {/* Sale products list */}
        <ProductListSection
          sectionId="popular"
          title="Эрэлттэй бараа"
          description="Хамгийн эрэлттэй бараанууд"
          linkHref="/products"
          linkLabel="Эрэлттэй бүх бараа харах"
          products={popularProducts}
          isLoading={productsLoading}
        />
      </main>
    </div>
  );
}
