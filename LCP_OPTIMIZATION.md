# LCP (Largest Contentful Paint) Breakdown & Optimization Guide

## What is LCP?

**Largest Contentful Paint (LCP)** measures when the largest content element becomes visible in the viewport. It's a Core Web Vital metric that impacts user experience and SEO.

**Good LCP**: < 2.5 seconds  
**Needs Improvement**: 2.5 - 4.0 seconds  
**Poor**: > 4.0 seconds

## Current LCP Element Analysis

### Primary LCP Element: Hero Carousel Image

- **Location**: `/app/page.tsx` - First carousel slide image
- **Size**: ~192px × 192px (desktop), ~128px × 128px (mobile)
- **Current Status**:
  - ✅ Using Next.js Image component
  - ✅ Priority loading enabled for first image
  - ✅ Modern formats (WebP/AVIF) enabled
  - ⚠️ Client-side rendered (delays initial paint)
  - ⚠️ No preload hint

### Secondary LCP Candidates:

1. **Hero Text** (`<h2>` with product title)
2. **Navigation Logo** (if visible above fold)
3. **First Product Card** (if carousel doesn't load)

## LCP Breakdown by Phase

### 1. **Time to First Byte (TTFB)**

- **Current**: Depends on server/CDN
- **Optimization**:
  - ✅ Using Next.js (good server performance)
  - ✅ Image CDN configured (cdn.emartmall.mn)
  - ⚠️ Consider edge caching

### 2. **Resource Load Delay**

- **Issue**: Fonts loaded via `@import` (render-blocking)
- **Impact**: ~200-500ms delay
- **Solution**:
  - ✅ Added preconnect to Google Fonts
  - ✅ Added font preload
  - ⚠️ Consider `next/font` for better optimization

### 3. **Resource Load Time**

- **Hero Image**:
  - ✅ Optimized formats (WebP/AVIF)
  - ✅ Proper sizing
  - ✅ Priority loading
  - ⚠️ Could add preload link in `<head>`

### 4. **Element Render Delay**

- **Issue**: Entire page is client-side rendered
- **Impact**: ~300-800ms delay for React hydration
- **Solution**: Consider SSR for critical content

## Implemented Optimizations

### ✅ Image Optimization

- Modern formats (AVIF, WebP) enabled
- Responsive image sizes
- Priority loading for hero images
- Lazy loading for below-fold images
- Quality optimization (90% for hero, 75-85% for others)

### ✅ Resource Hints

- Preconnect to Google Fonts
- Preconnect to CDN
- DNS prefetch for external domains

### ✅ Font Loading

- Font-display: swap (prevents invisible text)
- Preload for critical fonts

## Remaining Optimizations

### ✅ Completed

1. **Preload Hero Image** ✅

   - Added dynamic preload link in useEffect
   - Includes fetchpriority="high"
   - Includes imagesizes attribute
   - Reduces LCP by 200-500ms

2. **fetchPriority="high" on LCP Image** ✅
   - Added to first hero carousel image
   - Added to main product image on detail pages
   - Ensures browser prioritizes LCP element

### 🔄 High Priority

1. **Server-Side Preload (Future Enhancement)**

   - Currently preload is added client-side
   - For maximum benefit, add to server-rendered HTML
   - Would require SSR or static generation for home page

2. **Optimize Font Loading**

   - Migrate to `next/font` for automatic optimization
   - Self-host fonts to reduce external requests
   - Load only required font weights

3. **Reduce Client-Side JavaScript**
   - Consider SSR for hero section
   - Code split non-critical components
   - Lazy load Swiper.js

### 🔄 Medium Priority

4. **Optimize CategoriesProvider**

   - Use Suspense boundaries
   - Don't block initial render
   - Show skeleton while loading

5. **Add Image Placeholders**

   - Blur placeholders for hero images
   - Prevents layout shift
   - Improves perceived performance

6. **Optimize CSS**
   - Remove unused CSS
   - Critical CSS inlining
   - Defer non-critical CSS

### 🔄 Low Priority

7. **Service Worker for Caching**

   - Cache hero images
   - Cache fonts
   - Offline support

8. **HTTP/2 Server Push**
   - Push critical resources
   - Reduce round trips

## Measurement Tools

1. **Chrome DevTools**

   - Performance tab → Record → Check LCP marker
   - Lighthouse → Performance audit

2. **Web Vitals Extension**

   - Real-time LCP measurement
   - Field data collection

3. **PageSpeed Insights**

   - Lab and field data
   - Specific recommendations

4. **Next.js Analytics**
   - Real User Monitoring (RUM)
   - Core Web Vitals tracking

## Expected Improvements

| Optimization        | Expected LCP Improvement |
| ------------------- | ------------------------ |
| Preload hero image  | -200 to -500ms           |
| Optimize fonts      | -100 to -300ms           |
| SSR hero section    | -300 to -800ms           |
| Image optimization  | -100 to -300ms           |
| **Total Potential** | **-700 to -1900ms**      |

## Monitoring

Track LCP in production:

- Google Search Console (Core Web Vitals report)
- Vercel Analytics (if deployed on Vercel)
- Custom analytics with Web Vitals API

## Next Steps

1. ✅ Image optimization (DONE)
2. ✅ Resource hints (DONE)
3. ⏳ Preload hero image (TODO)
4. ⏳ Font optimization with next/font (TODO)
5. ⏳ SSR for critical content (TODO)
