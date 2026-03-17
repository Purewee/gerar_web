import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Төлбөр төлөх',
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
