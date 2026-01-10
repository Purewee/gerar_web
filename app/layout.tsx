import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Providers } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Gerar",
  description:
    "Gerar-д тавтай морил! Тавилга, гэрийн чимэглэл, гэрэлтүүлэг, орны даавуу, гал тогооны хэрэгсэл болон гэрийн тавилгын бүх хэрэгцээнд хамгийн сайн хямд үнэ, санал болголттой.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className="font-roboto">
        <Providers>
          <Navigation />
          {children}
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
