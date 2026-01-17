"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export function ConditionalNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname?.startsWith("/orders/create");

  return (
    <>
      {!hideNavbar && <Navigation />}
      {children}
      {!hideNavbar && <Footer />}
    </>
  );
}
