import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Миний захиалгууд',
};

export default function ProfileOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
