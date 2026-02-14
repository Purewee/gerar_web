'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { useProducts, type Product } from '@/lib/api';
import { useBanners } from '@/lib/api';
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
export function ProductListSection({
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

  // Fetch sale products for the "Хямдралтай бараа" section
  const { data: saleResponse, isLoading: saleLoading } = useProducts({
    onSale: true,
    limit: 24,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const saleProducts = (saleResponse?.data || []).filter(p => p.isHidden !== true);

  const latestProducts = products.slice(0, 24);
  const popularProducts = products.slice(0, 24);

  // Fetch banners for hero carousel
  const { data: bannersResponse, isLoading: bannersLoading } = useBanners();
  const banners = bannersResponse?.data || [];

  // Map banners to carousel items
  const carouselItems = banners.map(banner => ({
    id: banner.id,
    title: banner.title || '',
    subtitle: banner.title || '',
    discount: banner.description || '',
    link: banner.link || '#',
    imageMobile: banner.imageMobile,
    imageDesktop: banner.imageDesktop,
  }));

  console.log('resp', bannersResponse);

  const handleItemClick = (link: string) => {
    router.push(link);
  };

  // Preload first hero image for LCP optimization
  const firstCarouselImage = carouselItems[0]?.imageMobile || carouselItems[0]?.imageDesktop;
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
        <section className="relative overflow-hidden text-primary-foreground">
          <div className="relative">
            {!bannersLoading && carouselItems.length > 0 ? (
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
                <div className="hero-carousel relative w-full min-h-[300px] sm:h-[400px] lg:h-[500px] max-w-7xl mx-auto">
                  <Swiper
                    modules={[Autoplay, Navigation, Pagination]}
                    navigation={{
                      prevEl: '.hero-swiper-prev',
                      nextEl: '.hero-swiper-next',
                    }}
                    pagination={{
                      clickable: true,
                    }}
                    loop={carouselItems.length > 1}
                    slidesPerView={1}
                    spaceBetween={0}
                    className="w-full h-full"
                  >
                    {carouselItems.map(item => (
                      <SwiperSlide
                        key={item.id}
                        className="!h-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]"
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          className="relative w-full h-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                          onClick={() => handleItemClick(item.link)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleItemClick(item.link);
                            }
                          }}
                          aria-label={`${item.title} - Дэлгэрэнгүй мэдээлэл харах`}
                        >
                          {/* Background Image */}
                          {/* Responsive banner image: mobile vs desktop */}
                          {item.imageMobile && item.imageDesktop ? (
                            <>
                              <Image
                                src={item.imageMobile}
                                alt={item.title}
                                className="object-cover w-full h-full absolute inset-0 block sm:hidden"
                                priority={item.id === carouselItems[0]?.id}
                                fill
                                fetchPriority={item.id === carouselItems[0]?.id ? 'high' : 'auto'}
                                unoptimized={
                                  item.imageMobile?.includes('localhost') ||
                                  item.imageMobile?.includes('127.0.0.1') ||
                                  item.imageMobile?.includes('192.168.1.3')
                                }
                              />
                              <Image
                                src={item.imageDesktop}
                                alt={item.title}
                                className="object-cover w-full h-full absolute inset-0 hidden sm:block"
                                priority={item.id === carouselItems[0]?.id}
                                fill
                                fetchPriority={item.id === carouselItems[0]?.id ? 'high' : 'auto'}
                                unoptimized={
                                  item.imageDesktop?.includes('localhost') ||
                                  item.imageDesktop?.includes('127.0.0.1') ||
                                  item.imageDesktop?.includes('192.168.1.3')
                                }
                              />
                            </>
                          ) : item.imageMobile ? (
                            <Image
                              src={item.imageMobile}
                              alt={item.title}
                              className="object-cover w-full h-full absolute inset-0"
                              priority={item.id === carouselItems[0]?.id}
                              fill
                              fetchPriority={item.id === carouselItems[0]?.id ? 'high' : 'auto'}
                              unoptimized={
                                item.imageMobile?.includes('localhost') ||
                                item.imageMobile?.includes('127.0.0.1') ||
                                item.imageMobile?.includes('192.168.1.3')
                              }
                            />
                          ) : item.imageDesktop ? (
                            <Image
                              src={item.imageDesktop}
                              alt={item.title}
                              className="object-cover w-full h-full absolute inset-0"
                              priority={item.id === carouselItems[0]?.id}
                              fill
                              fetchPriority={item.id === carouselItems[0]?.id ? 'high' : 'auto'}
                              unoptimized={
                                item.imageDesktop?.includes('localhost') ||
                                item.imageDesktop?.includes('127.0.0.1') ||
                                item.imageDesktop?.includes('192.168.1.3')
                              }
                            />
                          ) : null}

                          <div className="relative z-10 flex flex-col items-center justify-center gap-4 lg:gap-6 text-center w-full h-full">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white">
                              {item.subtitle}
                            </h2>
                            <div className="inline-block">
                              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 text-white">
                                <span className="inline-flex items-center gap-2">
                                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                                  <span>{item.discount}</span>
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                  {/* Swiper pagination override */}
                  <style jsx global>{`
                    .hero-carousel .swiper-pagination {
                      position: absolute;
                      left: 0;
                      right: 0;
                      bottom: 24px;
                      z-index: 20;
                      display: flex;
                      justify-content: center;
                      gap: 8px;
                      pointer-events: auto;
                      background: none;
                      border-radius: 0;
                      padding: 0;
                      width: 100%;
                      margin: 0;
                      box-shadow: none;
                    }
                    .hero-carousel .swiper-pagination-bullet {
                      background: var(--primary);
                      opacity: 1;
                      border-radius: 9999px;
                      width: 16px;
                      height: 8px;
                      transition:
                        background 0.2s,
                        width 0.2s;
                    }
                    .hero-carousel .swiper-pagination-bullet-active {
                      background: var(--primary);
                      width: 32px;
                      height: 8px;
                    }
                  `}</style>
                </div>
              </div>
            ) : (
              <div className="min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] flex items-center justify-center">
                <Spinner size="lg" className="border-white/30 border-t-white" />
              </div>
            )}
          </div>
        </section>

        {/* Sale products list */}
        <ProductListSection
          sectionId="sale"
          title="Хямдралтай бараа"
          description="Онцгой хямдралтай бараанууд"
          linkHref="/products?onSale=true"
          linkLabel="Хямдралтай бүх бараа харах"
          products={saleProducts}
          isLoading={saleLoading || productsLoading}
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
      </main>
    </div>
  );
}
