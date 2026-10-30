// Єдине місце, де задаються мови (ADR-0003, SPEC §5).
// Додати EN: дописати 'en' у locales, створити src/i18n/en.json і папки en/ у колекціях.
export const locales = ['uk'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'uk';

// Як мова підписана в перемикачі (Locale Selector). На живому сайті: «Ukrainian».
export const localeLabels: Record<Locale, string> = {
  uk: 'Ukrainian',
};

// Значення для <html lang> і hreflang.
export const localeHtmlLang: Record<Locale, string> = {
  uk: 'uk',
};
