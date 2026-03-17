import { Metadata } from 'next';
import ProductsClient from './products-client';

async function getCategory(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  try {
    const res = await fetch(`${apiUrl}/categories/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data;
  } catch (error) {
    console.error('Failed to fetch category for metadata:', error);
    return null;
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const categoryId = params.categoryId;

  if (typeof categoryId === 'string') {
    const category = await getCategory(categoryId);
    if (category) {
      return {
        title: category.name,
      };
    }
  }

  if (params.onSale === 'true') {
    return {
      title: 'Хямдралтай бараа',
    };
  }

  if (typeof params.search === 'string') {
    return {
      title: `Хайлт: ${params.search}`,
    };
  }

  return {
    title: 'Бүх бүтээгдэхүүн',
  };
}

export default function ProductsPage() {
  return <ProductsClient />;
}
