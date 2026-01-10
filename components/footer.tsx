import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
          {/* Left Column - Gerar & Contact */}
          <div>
            <div className="mb-4 sm:mb-6">
              <Image
                src="/logo_white.jpg"
                alt="Gerar"
                width={120}
                height={40}
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">
                  Бидэнтэй холбогдох
                </h3>
                <div className="space-y-2 text-xs sm:text-sm md:text-base">
                  <div className="flex items-center gap-2">
                    <span>WhatsApp</span>
                  </div>
                  <div>+1 202-918-2132</div>
                  <div className="mt-2">
                    <div className="font-semibold mb-1">Бидэнтэй дуудах</div>
                    <div>+1 202-918-2132</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Most Popular Categories */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">
              Хамгийн алдартай ангиллууд
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm md:text-base">
              {[
                "Тавилга",
                "Гэрийн чимэглэл",
                "Гэрэлтүүлэг",
                "Орны даавуу & Цамц",
                "Гал тогоо & Хоолны өрөө",
                "Угаалгын өрөөний хэрэгсэл",
                "Хавтас & Цамц",
                "Хаалга & Хоолой",
              ].map((category) => (
                <li key={category}>
                  <a href="#" className="hover:underline">
                    • {category}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column - Customer Services */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">
              Үйлчлүүлэгчийн үйлчилгээ
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm md:text-base">
              {[
                "Бидний тухай",
                "Нөхцөл ба журам",
                "Түгээмэл асуулт",
                "Нууцлалын бодлого",
                "Цахим хог хаягдлын бодлого",
                "Цуцлах & Буцаах бодлого",
              ].map((service) => (
                <li key={service}>
                  <a href="#" className="hover:underline">
                    • {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary/20 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center text-xs sm:text-sm md:text-base">
          ©{currentYear} Бүх эрх хуулиар хамгаалагдсан. Gerar.mn
        </div>
      </div>
    </footer>
  );
}
