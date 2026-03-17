import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Хаяг солих',
};

export default function ProfileAddressesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
