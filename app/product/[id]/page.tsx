import { Metadata } from 'next';
import ProductClient from './product-client';

async function getProduct(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  try {
    const res = await fetch(`${apiUrl}/products/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data;
  } catch (error) {
    console.error('Failed to fetch product for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Бүтээгдэхүүн олдсонгүй',
    };
  }

  const title = product.name;
  const description = product.description || `Gerar Household - ${product.name} худалдаж авах`;
  const imageUrl = product.images?.[0] || '/logo3.svg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = parseInt(id);

  return (
    <>
      <ProductClient productId={productId} />
      <ProductSchema id={id} />
    </>
  );
}

async function ProductSchema({ id }: { id: string }) {
  const product = await getProduct(id);
  if (!product) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.id.toString(),
    offers: {
      '@type': 'Offer',
      url: `https://gerar.mn/product/${product.id}`,
      priceCurrency: 'MNT',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
