import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gerar.mn';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Static routes
  const routes = [
    '',
    '/products',
    '/register',
    '/cart',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic product routes
  try {
    const res = await fetch(`${apiUrl}/products?limit=100&isHidden=0`);
    const data = await res.json();
    const products = data?.data || [];
    
    const productRoutes = products.map((product: any) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date(product.updatedAt || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...routes, ...productRoutes];
  } catch (error) {
    console.error('Failed to generate product sitemap:', error);
    return routes;
  }
}
