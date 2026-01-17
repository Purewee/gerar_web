import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ConditionalNavigation } from "@/components/conditional-navigation";
import { Providers } from "@/lib/providers";
import { CountdownTimer } from "@/components/countdown-timer";

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
  // Set target date for countdown (example: 3 months from now)
  // Convert to ISO string for serialization between server and client
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + 3);
  const targetDateISO = targetDate.toISOString();

  return (
    <html lang="mn">
      <body className="font-roboto flex justify-center items-center h-screen">
        <Providers>
          {/* <ConditionalNavigation> */}
            <CountdownTimer
              targetDate={targetDateISO}
              title="Таны хэрэгцээнд тохируулан бүтээв"
              subtitle="Тун удахгүй"
            />
            {/* {children} */}
          {/* </ConditionalNavigation> */}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
