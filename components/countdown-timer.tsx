"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: Date | string;
  title?: string;
  subtitle?: string;
}

interface TimeRemaining {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({
  targetDate,
  title = "Style countdowns your way",
  subtitle = "Completely flexible",
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const targetDateObj = typeof targetDate === 'string' 
        ? new Date(targetDate)
        : targetDate;
      const target = targetDateObj.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeRemaining({
          months: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      // Calculate months (approximate, using average days per month)
      const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44));
      const monthsRemainder = difference % (1000 * 60 * 60 * 24 * 30.44);

      // Calculate days
      const days = Math.floor(monthsRemainder / (1000 * 60 * 60 * 24));
      const daysRemainder = monthsRemainder % (1000 * 60 * 60 * 24);

      // Calculate hours
      const hours = Math.floor(daysRemainder / (1000 * 60 * 60));
      const hoursRemainder = daysRemainder % (1000 * 60 * 60);

      // Calculate minutes
      const minutes = Math.floor(hoursRemainder / (1000 * 60));
      const minutesRemainder = hoursRemainder % (1000 * 60);

      // Calculate seconds
      const seconds = Math.floor(minutesRemainder / 1000);

      setTimeRemaining({
        months,
        days,
        hours,
        minutes,
        seconds,
      });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, "0");
  };

  return (
    <div className="w-full bg-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
        <Image
                src="/logo3.svg"
                alt="Gerar"
                width={120}
                height={40}
                priority
                className="w-auto h-7 md:h-10"
              />
          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm md:text-base text-gray-500 mb-2 mt-5">
              {subtitle}
            </p>
          )}

          {/* Title */}
          {title && (
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-8 md:mb-12 text-center">
              {title}
            </h2>
          )}

          {/* Countdown Segments */}
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 lg:gap-8">
            
            {/* Days */}
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2">
                {formatNumber(timeRemaining.days)}
              </div>
              <div className="text-sm md:text-base text-gray-500 font-medium">
                Хоног
              </div>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2">
                {formatNumber(timeRemaining.hours)}
              </div>
              <div className="text-sm md:text-base text-gray-500 font-medium">
                Цаг
              </div>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2">
                {formatNumber(timeRemaining.minutes)}
              </div>
              <div className="text-sm md:text-base text-gray-500 font-medium">
                Минут
              </div>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2">
                {formatNumber(timeRemaining.seconds)}
              </div>
              <div className="text-sm md:text-base text-gray-500 font-medium">
                Секунд
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
