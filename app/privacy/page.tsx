import {
  ShieldCheck,
  Database,
  Target,
  Lock,
  Share2,
  MousePointer2,
  UserCheck,
  HardDrive,
  Mail,
  Phone,
  ArrowLeft,
} from 'lucide-react';
import { Metadata } from 'next';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Нууцлалын бодлого',
  description: 'Gerar.mn сайтын хэрэглэгчийн мэдээллийн нууцлал ба аюулгүй байдлын бодлого.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 md:py-12">
      <div className="max-w-4xl mx-auto px-0 md:px-6 sm:pt-0 pt-6">
        <Link href="/" className="inline-block mb-4">
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <span>
              <ArrowLeft className="w-4 h-4" /> Буцах
            </span>
          </Button>
        </Link>
      </div>
      <div className="max-w-4xl mx-auto px-0 md:px-6">
        <div className="bg-white md:rounded-3xl shadow-lg md:border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-emerald-600 to-teal-700 px-6 py-10 md:px-8 md:py-16 text-white text-center">
            <div className="inline-flex items-center justify-center p-2.5 md:p-3 bg-white/20 rounded-2xl mb-4 md:mb-6 backdrop-blur-sm">
              <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <h1 className="text-2xl md:text-5xl font-bold mb-3 tracking-tight">
              Нууцлалын бодлого
            </h1>
            <p className="text-emerald-50 opacity-90 text-sm md:text-lg max-w-2xl mx-auto">
              Бид таны хувийн мэдээллийн аюулгүй байдлыг Монгол Улсын холбогдох хууль тогтоомжийн
              дагуу чандлан хамгаална.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-16 space-y-10 md:space-y-16">
            {/* Section 1 */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 text-emerald-600">
                <ShieldCheck className="w-8 h-8" />
                <h2 className="text-2xl font-bold">1. Ерөнхий</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-lg">
                “Герар хаус холд” ХХК нь хэрэглэгчийн хувийн мэдээллийг Монгол Улсын холбогдох хууль
                тогтоомжийн дагуу цуглуулах, ашиглах, хамгаалах үүрэгтэй.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 text-emerald-600">
                <Database className="w-8 h-8" />
                <h2 className="text-2xl font-bold">2. Цуглуулах мэдээлэл</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-emerald-50/50 p-5 md:p-6 rounded-2xl border border-emerald-100 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-emerald-900 mb-3 md:mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" /> Холбоо барих мэдээлэл:
                  </h3>
                  <ul className="space-y-1.5 md:space-y-2 text-emerald-800 text-sm md:text-base">
                    {['Нэр', 'Утасны дугаар', 'И-мэйл хаяг'].map(item => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-teal-50/50 p-5 md:p-6 rounded-2xl border border-teal-100 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-teal-900 mb-3 md:mb-4 flex items-center gap-2">
                    <Share2 className="w-5 h-5" /> Хүргэлтийн мэдээлэл:
                  </h3>
                  <ul className="space-y-1.5 md:space-y-2 text-teal-800 text-sm md:text-base">
                    {[
                      'Хаягийн гарчиг',
                      'Дүүрэг, хороо',
                      'Байр, орц, тоот',
                      'Хүргэлтийн өдөр/цаг',
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-teal-400 rounded-full"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 & 4 */}
            <div className="grid md:grid-cols-2 gap-12">
              <section className="space-y-6">
                <div className="flex items-center gap-4 text-emerald-600">
                  <Target className="w-8 h-8" />
                  <h2 className="text-2xl font-bold">3. Зорилго</h2>
                </div>
                <div className="space-y-3 md:space-y-4">
                  {[
                    'Захиалга боловсруулах',
                    'Хүргэлт гүйцэтгэх',
                    'Хэрэглэгчтэй холбогдох',
                    'Үйлчилгээг сайжруулах',
                  ].map(item => (
                    <div
                      key={item}
                      className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all text-sm md:text-base"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-4 text-emerald-600">
                  <Lock className="w-8 h-8" />
                  <h2 className="text-2xl font-bold">4. Хамгаалалт</h2>
                </div>
                <p className="text-gray-600 leading-relaxed bg-emerald-50 p-6 rounded-2xl border border-emerald-100 italic">
                  Компани нь хэрэглэгчийн мэдээллийн нууцлал, аюулгүй байдлыг хангах зорилгоор зохих
                  техник, зохион байгуулалтын арга хэмжээг хэрэгжүүлнэ.
                </p>
              </section>
            </div>

            {/* Section 5, 6, 7 */}
            <div className="space-y-12">
              <section className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                  <Share2 className="w-6 h-6" />
                  <h2 className="text-xl font-bold">5. Гуравдагч этгээдэд дамжуулах</h2>
                </div>
                <p className="text-gray-600 leading-relaxed ml-9">
                  Хэрэглэгчийн мэдээллийг зөвхөн шаардлагатай хэмжээнд (Төлбөрийн үйлчилгээ үзүүлэгч
                  QPay/банк болон Хүргэлтийн үйлчилгээ үзүүлэгч) дамжуулна. Бусад тохиолдолд
                  дамжуулахгүй.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                  <MousePointer2 className="w-6 h-6" />
                  <h2 className="text-xl font-bold">6. Cookies ашиглалт</h2>
                </div>
                <p className="text-gray-600 leading-relaxed ml-9">
                  Сайт нь хэрэглэгчийн туршлагыг сайжруулах зорилгоор cookies болон ижил төрлийн
                  технологи ашиглаж болно.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                  <HardDrive className="w-6 h-6" />
                  <h2 className="text-xl font-bold">8. Мэдээлэл хадгалах хугацаа</h2>
                </div>
                <p className="text-gray-600 leading-relaxed ml-9">
                  Хэрэглэгчийн мэдээллийг үйлчилгээ үзүүлэхэд шаардлагатай хугацаанд хадгалж, дараа
                  нь хуульд заасан журмын дагуу устгана.
                </p>
              </section>
            </div>

            {/* Footer / Contact */}
            <div className="bg-gray-50 rounded-3xl p-6 md:p-12 border border-gray-100 mt-12">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8 text-center italic">
                9. Холбоо барих
              </h2>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <a
                  href="mailto:gerarhousehold@gmail.com"
                  className="flex items-center gap-3 md:gap-4 p-4 md:p-6 bg-white rounded-2xl border border-gray-100 hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                  <div className="p-2.5 md:p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Mail className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-sm text-gray-500 font-medium uppercase md:normal-case">
                      Имэйл хаяг
                    </p>
                    <p className="text-gray-900 font-bold text-sm md:text-base">
                      gerarhousehold@gmail.com
                    </p>
                  </div>
                </a>
                <a
                  href="tel:+97688860134"
                  className="flex items-center gap-3 md:gap-4 p-4 md:p-6 bg-white rounded-2xl border border-gray-100 hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                  <div className="p-2.5 md:p-3 bg-teal-100 rounded-xl group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <Phone className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-sm text-gray-500 font-medium uppercase md:normal-case">
                      Утас
                    </p>
                    <p className="text-gray-900 font-bold text-sm md:text-base">88860134</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-emerald-600 py-6 px-10 text-center">
            <p className="text-emerald-100 text-sm font-medium">
              Бид таны мэдээллийн нууцлалыг дээдэлнэ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
