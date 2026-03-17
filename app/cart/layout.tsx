import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Сагс',
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
