import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Хадгалсан бараа',
};

export default function ProfileFavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
