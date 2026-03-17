import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/profile/', '/orders/', '/cart/', '/register/'],
    },
    sitemap: 'https://gerar.mn/sitemap.xml',
  };
}
