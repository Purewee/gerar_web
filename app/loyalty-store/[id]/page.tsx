import { Metadata } from 'next';
import LoyaltyProductClient from './loyalty-product-client';

async function getPointProduct(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  try {
    const res = await fetch(`${apiUrl}/point-products/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data;
  } catch (error) {
    console.error('Failed to fetch point product for metadata:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getPointProduct(id);

  if (product) {
    return {
      title: `${product.name} | Онооны дэлгүүр`,
      description: product.description,
    };
  }

  return {
    title: 'Бүтээгдэхүүний дэлгэрэнгүй',
  };
}

export default async function LoyaltyProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  return <LoyaltyProductClient productId={productId} />;
}
