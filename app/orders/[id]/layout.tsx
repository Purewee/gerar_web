import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const orderId = id.padStart(9, '0');
  return {
    title: `Захиалга #${orderId}`,
  };
}

export default async function OrderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await params; // Ensure params are awaited even if not used in layout body
  return <>{children}</>;
}
