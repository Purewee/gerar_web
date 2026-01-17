import Image from "next/image";

interface CountdownTimerProps {
  title?: string;
  subtitle?: string;
}

export function CountdownTimer({
  title = "Style countdowns your way",
  subtitle = "Completely flexible",
}: CountdownTimerProps) {

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
            <p className="text-2xl md:text-3xl lg:text-[45px] font-bold text-gray-900 mb-2 mt-3">
              {subtitle}
            </p>
          )}

          {/* Title */}
          {title && (
            <h2 className="text-xl font-medium text-gray-900 mb-8 md:mb-12 text-center">
              {title}
            </h2>
          )}

        
        </div>
      </div>
    </div>
  );
}
