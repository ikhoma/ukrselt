// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { locales, defaultLocale } from './src/i18n/config.ts';

// Редиректи: SPEC §1. www → ukrselt.com налаштовується в доменах Vercel, не тут.
const redirects = {
  '/success': { status: 301, destination: '/' },
  '/team/demyanchuk': { status: 301, destination: '/team' },
  '/team/berehova': { status: 301, destination: '/team' },
  '/team/brusova': { status: 301, destination: '/team' },
  '/team/marahovich': { status: 301, destination: '/team' },
  // На живому сайті sitemap лежить на /sitemap.xml (вказаний у robots.txt і, ймовірно, у Search Console).
  '/sitemap.xml': { status: 301, destination: '/sitemap-index.xml' },
};

export default defineConfig({
  site: 'https://ukrselt.com',
  trailingSlash: 'never', // як у Framer (ADR-0002)
  // build.format ігнорується: @astrojs/vercel завжди збирає у format 'directory' (about-us/index.html).
  // Astro 7 за замовчуванням ріже пробіли між inline-елементами ('jsx'); лишаємо HTML-правила.
  compressHTML: true,
  output: 'static', // усе prerender; /api/contact отримає prerender = false (етап 5)
  adapter: vercel(),
  redirects,
  // HTML сторінки підтягується при наведенні / дотику до посилання (рішення Івана 31.10). Astro сам пропускає «економію трафіку» і 2G.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  i18n: {
    locales: [...locales],
    defaultLocale,
    routing: { prefixDefaultLocale: false }, // uk без префікса, нові локалі на /<code>/ (ADR-0003)
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !/\/(404|success)$/.test(page) && !Object.keys(redirects).some((r) => page.endsWith(r)),
    }),
  ],
});
