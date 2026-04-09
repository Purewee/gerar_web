'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { useProducts, type Product } from '@/lib/api';
import { useBanners } from '@/lib/api';
import { useCategoriesStore } from '@/lib/stores/categories';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductSliderSkeleton, Spinner } from '@/components/skeleton';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { UnifiedAuthModal } from '@/components/auth/unified-auth-modal';

function RegisterSectionButton() {
  return (
    <Button
      className="flex mt-8 items-center gap-3 py-2 px-11 border border-primary mx-auto text-primary font-semibold max-w-max hover:text-primary hover:bg-gray-50 transition-colors duration-200 rounded-lg mx-2 w-full text-left"
      // onClick={() => {
      //   window.dispatchEvent(new CustomEvent('openLoginModal'));
      // }}
      variant={'outline'}
      type="button"
    >
      Нэвтрэх / Бүртгүүлэх
    </Button>
  );
}

// Fetches products for a feature (GET /products?featureId=...) and renders ProductListSection
function FeatureProductSection({
  featureId,
  featureName,
}: {
  featureId: number;
  featureName: string;
}) {
  const { data, isLoading } = useProducts({
    featureId,
    limit: 100,
  });
  const raw = data?.data;
  const productsRaw = Array.isArray(raw) ? raw.filter(p => p && p.isHidden !== true) : [];
  // Shuffle products for random order
  function shuffleArray<T>(array: T[]): T[] {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const products = shuffleArray(productsRaw);

  return (
    <ProductListSection
      sectionId={`feature-${featureId}`}
      title={featureName}
      linkHref={`/products?featureId=${featureId}`}
      linkLabel={`${featureName} бүх бараа харах`}
      products={products}
      isLoading={isLoading}
      description={undefined}
    />
  );
}

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
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const updateLimit = () => {
      if (window.innerWidth >= 1024) {
        setLimit(15); // desktop
      } else {
        setLimit(10); // mobile
      }
    };

    updateLimit();
    window.addEventListener('resize', updateLimit);
    return () => window.removeEventListener('resize', updateLimit);
  }, []);
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
    <section className="sm:pt-4 bg-white">
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
            modules={[Navigation, Pagination]}
            navigation={{
              prevEl: `.${sectionId}-swiper-prev`,
              nextEl: `.${sectionId}-swiper-next`,
            }}
            slidesPerView={2.2}
            pagination={{ clickable: true }}
            spaceBetween={16}
            breakpoints={{
              640: { slidesPerView: 3, spaceBetween: 16 },
              768: { slidesPerView: 4, spaceBetween: 16 },
              1024: { slidesPerView: 5, spaceBetween: 16 },
            }}
            className={`product-list-swiper overflow-visible [&_.swiper-pagination]:!relative [&_.swiper-pagination]:!mt-4 [&_.swiper-pagination-bullet]:!w-2 [&_.swiper-pagination-bullet]:!h-2 [&_.swiper-pagination-bullet]:!bg-gray-500 [&_.swiper-pagination-bullet-active]:!bg-primary mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4 [&_.swiper-wrapper]:items-stretch [&_.swiper-slide]:h-auto [&_.swiper-slide]:flex [&_.swiper-slide]:flex-col [&_.swiper-slide>*]:flex-1 [&_.swiper-slide>*]:min-h-0 [&_.swiper-slide>*]:flex [&_.swiper-slide>*]:flex-col`}
          >
            {products.slice(0, limit).map(product => (
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

import { MobileHomeFooter } from '@/components/mobile-footer';

export default function HomeClient() {
  const router = useRouter();
  const featuredCategories = useCategoriesStore(state => state.featuredCategories);

  // Fetch banners for hero carousel
  const { data: bannersResponse, isLoading: bannersLoading } = useBanners();
  const banners = bannersResponse?.data || [];

  // Map banners to carousel items
  const carouselItems = banners.map(banner => ({
    id: banner.id,
    title: banner.title || '',
    subtitle: banner.title || '',
    discount: banner.description || '',
    link: banner.linkUrl || '#',
    imageMobile: banner.imageMobile,
    imageDesktop: banner.imageDesktop,
  }));

  const handleItemClick = (link: string) => {
    router.push(link);
  };

  // Preload first hero image for LCP optimization
  const firstCarouselImage = carouselItems[0]?.imageMobile || carouselItems[0]?.imageDesktop;
  useEffect(() => {
    if (firstCarouselImage && typeof document !== 'undefined') {
      const existingPreload = document.querySelector(
        `link[rel="preload"][href="${firstCarouselImage}"]`,
      );
      if (!existingPreload) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = firstCarouselImage;
        link.setAttribute('fetchpriority', 'high');
        link.setAttribute(
          'imagesizes',
          '(max-width: 640px) 128px, (max-width: 1024px) 160px, 192px',
        );
        document.head.appendChild(link);
      }
    }
  }, [firstCarouselImage]);

  // Swiper navigation fix: update navigation after DOM rendered
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.querySelectorAll('.swiper').forEach(swiperEl => {
        const instance = (swiperEl as any)['swiper'];
        if (instance && instance.navigation && typeof instance.navigation.update === 'function') {
          instance.navigation.update();
        }
      });
    }
  }, [bannersLoading, carouselItems.length]);

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      <main>
        <section className="relative overflow-hidden text-primary-foreground">
          <div className="relative">
            {!bannersLoading && carouselItems.length > 0 ? (
              <div className="relative hero-carousel">
                <div className="hero-carousel relative w-full max-w-7xl mx-auto aspect-[4/3] sm:aspect-[16/9] min-h-[300px] sm:h-[400px] lg:h-[500px]">
                  {carouselItems.length > 1 && (
                    <>
                      <button
                        className="hero-swiper-prev cursor-pointer absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 border border-gray-100"
                        aria-label="Өмнөх слайд"
                        style={{ top: '50%', transform: 'translateY(-50%)' }}
                      >
                        <ChevronLeft
                          className="w-4 h-4 sm:w-5 sm:h-5 text-gray-100"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        className="hero-swiper-next cursor-pointer absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 border border-gray-100"
                        aria-label="Дараагийн слайд"
                        style={{ top: '50%', transform: 'translateY(-50%)' }}
                      >
                        <ChevronRight
                          className="w-4 h-4 sm:w-5 sm:h-5 text-gray-100"
                          aria-hidden="true"
                        />
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
                          {item.imageMobile && item.imageDesktop ? (
                            <>
                              <Image
                                src={item.imageMobile}
                                alt={item.title}
                                className="object-cover w-full h-full absolute inset-0 block sm:hidden bg-gradient-to-r from-black/60 via-black/20 to-transparent"
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

                          {item.link && (
                            <div className="absolute z-10 flex flex-col items-center text-white h-full w-full ">
                              {item.link &&
                                item.link !== '#' &&
                                (item.link.startsWith('/') ? (
                                  <Link
                                    href={item.link}
                                    onClick={e => e.stopPropagation()}
                                    scroll={true}
                                  ></Link>
                                ) : (
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                  ></a>
                                ))}
                            </div>
                          )}
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
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

        <div className="pt-6 sm:pt-10 bg-white">
          {featuredCategories.length > 0
            ? featuredCategories.map(feature => (
                <FeatureProductSection
                  key={feature.id}
                  featureId={feature.id}
                  featureName={feature.name}
                />
              ))
            : // Loading state: show 2-3 skeleton sections while categories are loading
              [1, 2, 3].map(i => (
                <section key={i} className="py-6 sm:py-10 bg-white animate-pulse opacity-80">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-8 w-48 bg-gray-200 rounded" />
                    </div>
                    <div className="flex gap-4 lg:gap-6 pb-4 overflow-hidden">
                      {[...Array(6)].map((_, j) => (
                        <div key={j} className="shrink-0 w-44 sm:w-48 md:w-56 lg:w-64">
                          <div className="border border-gray-200 rounded-lg overflow-hidden h-full bg-white">
                            <div
                              className="relative bg-gray-200 w-full"
                              style={{ aspectRatio: '4/3' }}
                            >
                              <div className="w-full h-full bg-gray-200 animate-pulse" />
                            </div>
                            <div className="p-4 space-y-3">
                              <div className="h-4 w-3/4 bg-gray-200 rounded" />
                              <div className="h-4 w-1/2 bg-gray-200 rounded" />
                              <div className="flex gap-2">
                                <div className="h-6 w-20 bg-gray-200 rounded" />
                                <div className="h-6 w-16 bg-gray-200 rounded" />
                              </div>
                              <div className="h-9 w-full bg-gray-200 rounded" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
        </div>

        <div className="gap-4 pt-12 pb-8 md:flex mx-auto items-center flex-row justify-center max-w-7xl mt-4 border-t border-gray-200 px-8">
          <div className="flex flex-col items-center mb-12 mt-4 gap-2">
            <h2 className="font-semibold text-2xl text-center">Та манай сайтад бүртгүүлээрэй</h2>
            <p className="text-sm max-w-lg text-gray-500 mt-4 text-center">
              Бүртгэлтэй хэрэглэгч болсноор захиалгаа хурдан баталгаажуулах, өмнөх захиалгаа харах,
              дуртай бараагаа хадгалах болон хүргэлтийн хаягаа автоматаар ашиглах боломжтой.
            </p>
            <RegisterSectionButton />
          </div>
        </div>
      </main>
      <div className="block md:hidden">
        <MobileHomeFooter />
      </div>
    </div>
  );
}
