"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProductCard, ProductCardProps } from "@/components/product-card";

interface CarouselItem {
  id: number;
  subtitle: string;
  title: string;
  discount: string;
  icon: string;
  link: string;
}

const carouselItems: CarouselItem[] = [
  {
    id: 1,
    subtitle: "Дээд зэргийн тавилгаар гэрээ өөрчил",
    title: "ГЭРИЙН ТАВИЛГА.",
    discount: "70% ХЯРТ ХЯМДРАЛТАЙ",
    icon: "🪑",
    link: "/product/2",
  },
  {
    id: 2,
    subtitle: "Орчин үеийн дизайн",
    title: "БУЙДАНГИЙН БАГЦ",
    discount: "56% ХЯРТ ХЯМДРАЛТАЙ",
    icon: "🛋️",
    link: "/product/1",
  },
  {
    id: 3,
    subtitle: "Тохилог унтлагын өрөө",
    title: "ОРНЫ ХҮРЭЭ",
    discount: "56% ХЯРТ ХЯМДРАЛТАЙ",
    icon: "🛏️",
    link: "/product/3",
  },
  {
    id: 4,
    subtitle: "Гэрэлтүүлгийн шинэчлэл",
    title: "LED ГЭРЭЛТҮҮЛЭГ",
    discount: "Онцгой санал",
    icon: "💡",
    link: "/product/5",
  },
  {
    id: 5,
    subtitle: "Гэрийн зочны өрөө",
    title: "КОФЕ ШИРЭЭ",
    discount: "55% ХЯРТ ХЯМДРАЛТАЙ",
    icon: "☕",
    link: "/product/4",
  },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const restartTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
      }, 5000);
    }
  }, [isPaused]);

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

  return (
    <div className="h-full bg-white">
      <main>
        {/* Hero Carousel */}
        <section
          className="bg-primary text-primary-foreground relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="relative">
              {carouselItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`transition-opacity duration-500 ${
                    index === currentSlide
                      ? "opacity-100"
                      : "opacity-0 absolute inset-0"
                  }`}
                >
                  <div
                    className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 cursor-pointer"
                    onClick={() => handleItemClick(item.link)}
                  >
                    <div className="flex-1 text-center lg:text-left z-10">
                      <p className="text-xs sm:text-sm md:text-base mb-2 opacity-90">
                        {item.subtitle}
                      </p>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4">
                        {item.title}
                      </h2>
                      <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold opacity-80">
                        {item.discount}
                      </p>
                    </div>
                    <div className="flex-1 flex justify-center lg:justify-end w-full lg:w-auto">
                      <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                        <div className="absolute inset-0 bg-primary/80 rounded-full flex items-center justify-center">
                          <div className="text-8xl sm:text-9xl">
                            {item.icon}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 hidden lg:block z-20">
              <button
                onClick={goToPrevious}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors cursor-pointer"
                aria-label="Өмнөх слайд"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>
            <div className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 hidden lg:block z-20">
              <button
                onClick={goToNext}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors cursor-pointer"
                aria-label="Дараагийн слайд"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Indicator Dots */}
            <div className="flex justify-center lg:justify-start gap-2 mt-4 sm:mt-6 z-10 relative">
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentSlide
                      ? "bg-white w-8 h-2"
                      : "bg-white/50 w-2 h-2 hover:bg-white/70"
                  }`}
                  aria-label={`Слайд ${index + 1} руу шилжих`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Featured Furniture Section */}
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                Сүүлд нэмэгдсэн бараа
              </h2>
              <a
                href="#"
                className="text-primary hover:underline flex items-center gap-1 text-sm sm:text-base"
              >
                Бүгдийг харах
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
            <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
              <div className="flex gap-3 sm:gap-4 md:gap-6 pb-4 min-w-max">
                {(
                  [
                    {
                      id: 1,
                      name: "Орчин үеийн буйдангийн багц (3+2)",
                      price: 32999,
                      original: 74999,
                      icon: "🛋️",
                    },
                    {
                      id: 2,
                      name: "Модон хоолны ширээний багц",
                      price: 24999,
                      original: 59999,
                      icon: "🪑",
                      featured: true,
                    },
                    {
                      id: 3,
                      name: "Квин хэмжээтэй орны хүрээ",
                      price: 19999,
                      original: 44999,
                      icon: "🛏️",
                    },
                    {
                      id: 4,
                      name: "Хадгалах сонголттой кофе ширээ",
                      price: 8999,
                      original: 19999,
                      icon: "☕",
                    },
                    {
                      id: 5,
                      name: "Орчин үеийн гэрэлтүүлэг",
                      price: 15999,
                      icon: "💡",
                    },
                  ] as ProductCardProps[]
                ).map((item) => (
                  <ProductCard key={item.id} {...item} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
