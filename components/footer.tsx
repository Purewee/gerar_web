import React from 'react';
import { Phone, Instagram, Facebook } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const categories = [
    "Тавилга",
    "Гэрийн чимэглэл",
    "Гэрэлтүүлэг",
    "Орны даавуу & Цамц",
    "Гал тогоо & Хоолны өрөө",
    "Угаалгын өрөөний хэрэгсэл",
    "Хавтас & Цамц",
    "Хаалга & Хоолой"
  ];
  
  const services = [
    "Бидний тухай",
    "Нөхцөл ба журам",
    "Түгээмэл асуулт",
    "Нууцлалын бодлого",
    "Цахим хог хаягдлын бодлого",
    "Цуцлах & Буцаах бодлого"
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          
          {/* Left Column - Contact */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Бидэнтэй холбогдох
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Асуулт эсвэл санал хүсэлт байвал бидэнтэй холбогдоорой. Бид танд туслахдаа баяртай байна.
              </p>
            </div>
            
            <div className="space-y-3">
              <a 
                href="https://www.instagram.com/gerarhousehold/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg transition-all duration-200 hover:shadow-sm group"
              >
                <div className="bg-linear-to-br from-purple-600 via-pink-600 to-orange-500 p-2 rounded-lg group-hover:opacity-90 transition-opacity shrink-0">
                  <Instagram className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 font-medium">Instagram</div>
                  <div className="text-sm font-semibold text-gray-900">@gerar.mn</div>
                </div>
              </a>
              
              <a 
                href="https://www.facebook.com/profile.php?id=100064687573143" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all duration-200 hover:shadow-sm group"
              >
                <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors shrink-0">
                  <Facebook className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 font-medium">Facebook</div>
                  <div className="text-sm font-semibold text-gray-900">Gerar.mn</div>
                </div>
              </a>
              
              <a 
                href="tel:+97672227410"
                className="flex items-center gap-3 p-3.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all duration-200 hover:shadow-sm group"
              >
                <div className="bg-green-500 p-2 rounded-lg group-hover:bg-green-600 transition-colors shrink-0">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 font-medium">Дуудлага</div>
                  <div className="text-sm font-semibold text-gray-900">+976 7222-7410</div>
                </div>
              </a>
            </div>
          </div>
          
          {/* Middle Column - Categories */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Их хайлттай ангиллууд
            </h3>
            <ul className="space-y-3">
              {categories.map((category, index) => (
                <li key={index}>
                  <a 
                    href="#" 
                    className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                    <span className="hover:underline">{category}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Right Column - Services */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Үйлчлүүлэгчийн үйлчилгээ
            </h3>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <li key={index}>
                  <a 
                    href="#" 
                    className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-600 transition-colors shrink-0"></span>
                    <span className="hover:underline">{service}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Gerar.mn</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Таны гэрийн хэрэгцээнд зориулсан бүх зүйл нэг дороос.
              </p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-medium text-gray-900">Ажлын цаг:</p>
              <p>Даваа - Баасан: 9:00 - 18:00</p>
              <p>Бямба: 10:00 - 16:00</p>
              <p className="text-gray-500">Ням: Амарна</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-gray-300 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              © {currentYear} <span className="font-semibold text-gray-900">Gerar.mn</span>. Бүх эрх хуулиар хамгаалагдсан.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
                Нууцлал
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
                Үйлчилгээний нөхцөл
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}