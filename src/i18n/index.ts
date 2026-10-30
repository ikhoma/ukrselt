import { defaultLocale, locales, type Locale } from './config';
import uk from './uk.json';

const dictionaries: Record<Locale, Record<string, string>> = { uk };

export type UiKey = keyof typeof uk;

/** Мова з URL: /en/... → 'en', інакше мова за замовчуванням. */
export function getLocale(url: URL): Locale {
  const first = url.pathname.split('/')[1];
  return (locales as readonly string[]).includes(first) ? (first as Locale) : defaultLocale;
}

/** Перекладач для конкретної мови. Якщо ключа немає — береться значення мови за замовчуванням. */
export function useTranslations(locale: Locale) {
  return (key: UiKey): string => dictionaries[locale]?.[key] ?? dictionaries[defaultLocale][key];
}
