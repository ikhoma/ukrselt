/**
 * Тексти сторінок за мовами: src/content/pages/<locale>/<slug>.json (ADR-0003).
 * Нова мова = нова папка з тими самими файлами.
 */
import type { Locale } from '../i18n/config';
import { defaultLocale } from '../i18n/config';

const files = import.meta.glob<{ default: Record<string, any> }>('./pages/*/*.json', { eager: true });

export function getPage<T = any>(locale: Locale, slug: string): T {
  const hit = files[`./pages/${locale}/${slug}.json`] ?? files[`./pages/${defaultLocale}/${slug}.json`];
  if (!hit) throw new Error(`Немає контенту сторінки: ${locale}/${slug}`);
  return hit.default as T;
}
