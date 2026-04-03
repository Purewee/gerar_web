import { X } from 'lucide-react';
export default function TermsPrivacyModal({ onClose }: { onClose?: () => void }) {
  return (
    <div
      className="relative space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-white rounded-2xl p-4 sm:p-8 mx-2 sm:mx-0"
      style={{
        maxHeight: '70vh',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9',
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute fixed bottom-[-65] text-xl font-semibold shadow:sm md:right-[40%] right-[35%] cursor-pointer transition-all text-gray-900 p-1 bg-white px-6 rounded"
          aria-label="Хаах"
        >
          {/* <X className="w-6 h-6" />
           */}
          Хаах
        </button>
      )}
      <h2 className="text-xl font-bold mb-4">Үйлчилгээний нөхцөл</h2>
      <div>
        <h2 className="text-lg font-bold mb-4">1. Ерөнхий зүйл</h2>
        <div className="text-gray-600 leading-relaxed">
          Энэхүү gerar.mn сайт (цаашид “Сайт” гэх) нь “Герар хаус холд” ХХК (цаашид “Компани”
          гэх)-ийн эзэмшил болно. Хэрэглэгч та Сайтад нэвтэрч, үйлчилгээ ашигласнаар энэхүү
          үйлчилгээний нөхцөлийг бүрэн хүлээн зөвшөөрсөнд тооцогдоно.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">2. Үйлчилгээний хүрээ</h2>
        <div className="text-gray-600 leading-relaxed">
          Компани нь гэр ахуйн бараа бүтээгдэхүүнийг Сайтаар дамжуулан онлайн хэлбэрээр захиалан
          худалдаалах, хүргэлтийн үйлчилгээ үзүүлнэ.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">3. Захиалга хийх</h2>
        <div className="text-gray-600 leading-relaxed">
          Хэрэглэгч захиалга хийхдээ дараах мэдээллийг үнэн зөв, бүрэн бөглөх үүрэгтэй:
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>Нэр</li>
            <li>Утасны дугаар</li>
            <li>И-мэйл хаяг</li>
            <li>Хүргэлтийн хаяг (дүүрэг, хороо, байр, орц, тоот, дэлгэрэнгүй)</li>
            <li>Хүргэлтийн өдөр</li>
            <li>Хүргэлтийн цагийн сонголт</li>
          </ul>
          Хэрэглэгчийн буруу, дутуу мэдээллээс шалтгаалсан аливаа саатал, алдаанд Компани хариуцлага
          хүлээхгүй.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">4. Төлбөрийн нөхцөл</h2>
        <div className="text-gray-600 leading-relaxed">
          Захиалгын төлбөрийг дараах хэлбэрээр гүйцэтгэнэ:
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>QPay (QR код)</li>
            <li>Банкны аппликейшн</li>
          </ul>
          Төлбөр амжилттай баталгаажсанаар захиалга хүчин төгөлдөрт тооцогдоно.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">5. Хүргэлтийн нөхцөл</h2>
        <div className="text-gray-600 leading-relaxed">
          Хэрэглэгч дараах цагийн интервалаас сонгон хүргэлт авах боломжтой:
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>10:00 – 14:00</li>
            <li>14:00 – 18:00</li>
            <li>18:00 – 21:00</li>
            <li>21:00 – 00:00</li>
          </ul>
          Хүргэлт нь сонгосон өдөр, цагийн хуваарийн дагуу хийгдэх бөгөөд замын хөдөлгөөний ачаалал,
          цаг агаар болон бусад нөхцөл байдлаас шалтгаалан тодорхой хэмжээнд хэлбэлзэж болно.
          <br />
          <br />
          Хэрэглэгч хүргэлтийн үед хаяг дээрээ байх, холбоо барих боломжтой байх үүрэгтэй.
          Хэрэглэгчийн буруугаас хүргэлт амжилтгүй болсон тохиолдолд дахин хүргэлтийн зардлыг
          хэрэглэгч хариуцна.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">6. Буцаалт ба солилтын нөхцөл</h2>
        <div className="text-gray-600 leading-relaxed">
          Компани нь буцаалтыг хязгаарласан бодлого баримтална.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">6.1 Буцаалт зөвшөөрөх нөхцөл:</h2>
        <div className="text-gray-600 leading-relaxed">
          Компани нь гэр ахуйн бараа бүтээгдэхүүнийг Сайтаар дамжуулан онлайн хэлбэрээр захиалан
          худалдаалах, хүргэлтийн үйлчилгээ үзүүлнэ.
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>Бараа гэмтэлтэй, эвдрэлтэй хүргэгдсэн</li>
            <li>Захиалсан бараанаас зөрүүтэй бараа хүргэгдсэн</li>
          </ul>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">6.2 Буцаалт хийх хугацаа:</h2>
        <div className="text-gray-600 leading-relaxed">
          Хэрэглэгч барааг хүлээн авснаас хойш 24 цагийн дотор гомдол гаргана. Тус хугацаанаас хойш
          гаргасан хүсэлтийг хүлээн авахгүй.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">6.3 Буцаалт хийх шаардлага:</h2>
        <div className="text-gray-600 leading-relaxed">
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>Ашиглагдаагүй байх</li>
            <li>Анхны сав, баглаа боодол бүрэн байх</li>
            <li>Дагалдах хэрэгсэл, баримт бүрэн байх</li>
          </ul>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">6.4 Буцаалт хийх боломжгүй нөхцөл:</h2>
        <div className="text-gray-600 leading-relaxed">
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>Хэрэглэгчийн буруутай ашиглалт, хадгалалтаас үүдэлтэй гэмтэл</li>
            <li>Сав баглаа боодол задарсан, дахин худалдах боломжгүй болсон</li>
          </ul>
          Компани нь буцаалтын хүсэлтийг баримт, нотолгоонд үндэслэн шийдвэрлэнэ.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">7. Хэрэглэгчийн үүрэг</h2>
        <div className="text-gray-600 leading-relaxed">
          Хэрэглэгч дараах үүргийг хүлээнэ:
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>Үнэн зөв мэдээлэл өгөх</li>
            <li>Захиалсан барааг хугацаанд нь хүлээн авах</li>
            <li>Холбоо барих боломжтой байх</li>
          </ul>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">8. Хариуцлага</h2>
        <div className="text-gray-600 leading-relaxed">
          Компанийн хяналтаас гадуурх нөхцөл буюу давагдашгүй хүчин зүйл (үүнд: байгалийн гамшиг,
          цаг агаарын ноцтой нөхцөл, зам тээврийн саатал, гэнэтийн осол, төрийн байгууллагын
          шийдвэр, цахилгаан болон холбооны тасалдал зэрэг)-ийн улмаас үйлчилгээ саатах, хүргэлт
          хойшлох, гүйцэтгэлд өөрчлөлт орох тохиолдолд Компани хариуцлага хүлээхгүй.
          <br />
          <br />
          Ийм нөхцөл үүссэн тохиолдолд Компани боломжит арга хэмжээг авч, хэрэглэгчид тухай бүр
          мэдээлнэ.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">9. Оюуны өмч</h2>
        <div className="text-gray-600 leading-relaxed">
          Сайтад байршуулсан бүх контент, мэдээлэл, зураг, дизайн нь Компанийн өмч бөгөөд холбогдох
          хууль тогтоомжийн дагуу хамгаалагдана. Зөвшөөрөлгүйгээр ашиглах, хуулбарлахыг хориглоно.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">10. Нөхцөлд өөрчлөлт оруулах</h2>
        <div className="text-gray-600 leading-relaxed">
          Компани нь энэхүү үйлчилгээний нөхцөлд нэмэлт, өөрчлөлт оруулах эрхтэй бөгөөд шинэчилсэн
          хувилбарыг Сайтад байршуулснаар хүчин төгөлдөр болно.
        </div>
      </div>
      <h2 className="text-xl font-bold mb-4">Нууцлалын бодлого</h2>
      <div>
        <h2 className="text-lg font-bold mb-4">1. Ерөнхий</h2>
        <div className="text-gray-600 leading-relaxed">
          “Герар хаус холд” ХХК нь хэрэглэгчийн хувийн мэдээллийг Монгол Улсын холбогдох хууль
          тогтоомжийн дагуу цуглуулах, ашиглах, хамгаалах үүрэгтэй.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">2. Цуглуулах мэдээлэл</h2>
        <div className="text-gray-600 leading-relaxed mb-2">Бид дараах мэдээлэл цуглуулна</div>
        <div className="text-gray-600 leading-relaxed">
          Холбоо барих мэдээлэл:
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>Нэр</li>
            <li>Утасны дугаар</li>
            <li>И-мэйл хаяг</li>
          </ul>
        </div>
        <div className="text-gray-600 leading-relaxed">
          Хүргэлтийн мэдээлэл:
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>Хаягийн гарчиг</li>
            <li>Дүүрэг, хороо</li>
            <li>Байр, орц, тоот</li>
            <li>Дэлгэрэнгүй хаяг</li>
            <li>Хүргэлтийн өдөр</li>
            <li>Хүргэлтийн цаг</li>
          </ul>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">3. Мэдээлэл ашиглах зорилго</h2>
        <div className="text-gray-600 leading-relaxed">
          Хэрэглэгчийн мэдээллийг дараах зорилгоор ашиглана:
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>Захиалга боловсруулах</li>
            <li>Хүргэлт гүйцэтгэх</li>
            <li>Хэрэглэгчтэй холбогдох</li>
            <li>Үйлчилгээний чанарыг сайжруулах</li>
          </ul>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">4. Мэдээлэл хамгаалалт</h2>
        <div className="text-gray-600 leading-relaxed">
          Компани нь хэрэглэгчийн мэдээллийн нууцлал, аюулгүй байдлыг хангах зорилгоор зохих техник,
          зохион байгуулалтын арга хэмжээг хэрэгжүүлнэ.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">5. Гуравдагч этгээдэд мэдээлэл дамжуулах</h2>
        <div className="text-gray-600 leading-relaxed">
          Хэрэглэгчийн мэдээллийг дараах этгээдэд зөвхөн шаардлагатай хэмжээнд дамжуулж болно:
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>Төлбөрийн үйлчилгээ үзүүлэгч (QPay, банк)</li>
            <li>Хүргэлтийн үйлчилгээ үзүүлэгч</li>
          </ul>
          Бусад тохиолдолд хэрэглэгчийн зөвшөөрөлгүйгээр гуравдагч этгээдэд дамжуулахгүй.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">6. Cookies ашиглалт</h2>
        <div className="text-gray-600 leading-relaxed">
          Сайт нь хэрэглэгчийн туршлагыг сайжруулах зорилгоор cookies болон ижил төрлийн технологи
          ашиглаж болно.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">7. Хэрэглэгчийн эрх</h2>
        <div className="text-gray-600 leading-relaxed">
          Хэрэглэгч дараах эрхтэй:
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>Өөрийн мэдээллийг шалгах, засах</li>
            <li>Мэдээлэл устгуулах хүсэлт гаргах</li>
            <li>Мэдээлэл боловсруулахыг хязгаарлуулах</li>
          </ul>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">8. Мэдээлэл хадгалах хугацаа</h2>
        <div className="text-gray-600 leading-relaxed">
          Хэрэглэгчийн мэдээллийг үйлчилгээ үзүүлэхэд шаардлагатай хугацаанд хадгалж, дараа нь
          хуульд заасан журмын дагуу устгана.
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">9. Холбоо барих</h2>
        <div className="text-gray-600 leading-relaxed">
          Нууцлалтай холбоотой асуулт, хүсэлт гаргах бол:
          <ul className="list-disc list-inside my-2 space-y-1 text-gray-600 text-sm">
            <li>Имэйл: gerarhousehold@gmail.com</li>
            <li>Утас: 88860134</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
