import { FileText, Shield, Clock, CreditCard, Truck, RefreshCcw, UserCheck, AlertTriangle, Copyright, Settings } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Үйлчилгээний нөхцөл',
  description: 'Gerar.mn сайтын үйлчилгээний нөхцөл ба журам.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 md:py-12">
      <div className="max-w-4xl mx-auto px-0 md:px-6">
        <div className="bg-white md:rounded-2xl shadow-sm border-b md:border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-indigo-700 px-6 py-8 md:px-8 md:py-12 text-white text-center">
            <h1 className="text-2xl md:text-4xl font-bold mb-3">Үйлчилгээний нөхцөл</h1>
            <p className="text-blue-100 opacity-90 text-sm md:text-base max-w-2xl mx-auto">
              Gerar.mn сайтыг ашиглахаас өмнө энэхүү үйлчилгээний нөхцөлтэй анхааралтай танилцана уу.
            </p>
          </div>

          {/* Content */}
          <div className="p-5 md:p-12 space-y-8 md:space-y-12">
            {/* Section 1 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-blue-600">
                <Shield className="w-6 h-6" />
                <h2 className="text-xl font-bold">1. Ерөнхий зүйл</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Энэхүү gerar.mn сайт (цаашид “Сайт” гэх) нь “Герар хаус холд” ХХК (цаашид “Компани” гэх)-ийн эзэмшил болно. 
                Хэрэглэгч та Сайтад нэвтэрч, үйлчилгээ ашигласнаар энэхүү үйлчилгээний нөхцөлийг бүрэн хүлээн зөвшөөрсөнд тооцогдоно.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-blue-600">
                <FileText className="w-6 h-6" />
                <h2 className="text-xl font-bold">2. Үйлчилгээний хүрээ</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Компани нь гэр ахуйн бараа бүтээгдэхүүнийг Сайтаар дамжуулан онлайн хэлбэрээр захиалан худалдаалах, хүргэлтийн үйлчилгээ үзүүлнэ.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-blue-600">
                <Clock className="w-6 h-6" />
                <h2 className="text-xl font-bold">3. Захиалга хийх</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Хэрэглэгч захиалга хийхдээ дараах мэдээллийг үнэн зөв, бүрэн бөглөх үүрэгтэй:
              </p>
              <ul className="grid md:grid-cols-2 gap-3 mt-4">
                {['Нэр', 'Утасны дугаар', 'И-мэйл хаяг', 'Хүргэлтийн хаяг', 'Хүргэлтийн өдөр', 'Цагийн сонголт'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-red-500 mt-2 font-medium">
                * Хэрэглэгчийн буруу, дутуу мэдээллээс шалтгаалсан аливаа саатал, алдаанд Компани хариуцлага хүлээхгүй.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-blue-600">
                <CreditCard className="w-6 h-6" />
                <h2 className="text-xl font-bold">4. Төлбөрийн нөхцөл</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Захиалгын төлбөрийг QPay (QR код) эсвэл Банкны аппликейшн ашиглан гүйцэтгэнэ. Төлбөр амжилттай баталгаажсанаар захиалга хүчин төгөлдөрт тооцогдоно.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-blue-600">
                <Truck className="w-6 h-6" />
                <h2 className="text-xl font-bold">5. Хүргэлтийн нөхцөл</h2>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-3">Хүргэлтийн цагийн хуваарь:</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {['10:00 – 14:00', '14:00 – 18:00', '18:00 – 21:00', '21:00 – 00:00'].map((time) => (
                    <div key={time} className="bg-white p-2 text-center rounded shadow-sm text-sm font-medium text-gray-700 border border-blue-200">
                      {time}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed mt-4 text-sm">
                Хүргэлт нь сонгосон өдөр, цагийн хуваарийн дагуу хийгдэх бөгөөд замын хөдөлгөөний ачаалал, цаг агаар болон бусад нөхцөл байдлаас шалтгаалан тодорхой хэмжээнд хэлбэлзэж болно.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <RefreshCcw className="w-6 h-6" />
                <h2 className="text-xl font-bold">6. Буцаалт ба солилтын нөхцөл</h2>
              </div>
              
              <div className="space-y-6">
                <div className="border-l-4 border-amber-400 pl-6 py-2">
                  <h3 className="font-bold text-gray-900 mb-2">6.1 Буцаалт зөвшөөрөх нөхцөл:</h3>
                  <p className="text-gray-600 italic">Бараа гэмтэлтэй, эвдрэлтэй хүргэгдсэн эсвэл захиалсан бараанаас зөрүүтэй бараа хүргэгдсэн тохиолдолд.</p>
                </div>

                <div className="border-l-4 border-blue-400 pl-6 py-2">
                  <h3 className="font-bold text-gray-900 mb-2">6.2 Буцаалт хийх хугацаа:</h3>
                  <p className="text-gray-600 italic">Хэрэглэгч барааг хүлээн авснаас хойш 24 цагийн дотор гомдол гаргана.</p>
                </div>

                <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                  <h3 className="font-bold text-red-800 mb-3">6.4 Буцаалт хийх боломжгүй нөхцөл:</h3>
                  <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                    <li>Хэрэглэгчийн буруутай ашиглалт, хадгалалтаас үүдэлтэй гэмтэл</li>
                    <li>Сав баглаа боодол задарсан, дахин худалдах боломжгүй болсон</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Other Sections */}
            <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
              <section className="space-y-4">
                <div className="flex items-center gap-3 text-blue-600">
                  <UserCheck className="w-5 h-5" />
                  <h2 className="text-lg font-bold">7. Хэрэглэгчийн үүрэг</h2>
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Үнэн зөв мэдээлэл өгөх</li>
                  <li>• Захиалсан барааг хүлээн авах</li>
                  <li>• Холбоо барих боломжтой байх</li>
                </ul>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-blue-600">
                  <AlertTriangle className="w-5 h-5" />
                  <h2 className="text-lg font-bold">8. Хариуцлага</h2>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed italic">
                  Давагдашгүй хүчин зүйлсийн улмаас үйлчилгээ саатах, хүргэлт хойшлох тохиолдолд Компани хариуцлага хүлээхгүй.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-blue-600">
                  <Copyright className="w-5 h-5" />
                  <h2 className="text-lg font-bold">9. Оюуны өмч</h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Сайтад байршуулсан бүх контент, мэдээлэл, зураг, дизайн нь Компанийн өмч болно.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-blue-600">
                  <Settings className="w-5 h-5" />
                  <h2 className="text-lg font-bold">10. Өөрчлөлт оруулах</h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Компани нь энэхүү нөхцөлд өөрчлөлт оруулах эрхтэй бөгөөд шинэчилсэн хувилбар байршуулснаар хүчин төгөлдөр болно.
                </p>
              </section>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 md:p-8 text-center text-gray-500 text-xs md:text-sm border-t border-gray-100 italic">
            Сайтыг ашигласнаар та эдгээр нөхцөлийг хүлээн зөвшөөрч байгаа болно.
          </div>
        </div>
      </div>
    </div>
  );
}
