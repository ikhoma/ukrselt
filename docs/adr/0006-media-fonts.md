# ADR-0006: Картинки WebP через astro:assets, Open Sans self-hosted

**Status:** Accepted (Іван, 30.10.2026)
**Date:** 2026-10-30
**Deciders:** Іван

## Context
62 PNG з framerusercontent (на головній ~11 МБ, найбільша 1,3 МБ). Оригінали збережені в `assets-source/framer/` + `manifest.csv`. Формат — WebP (рішення Івана). Шрифт — тільки Open Sans (бренд), Inter прибираємо.

## Decision
**Картинки:**
- Оригінали лишаються в `assets-source/` (не потрапляють у збірку).
- Для сайту копіюємо потрібні в `src/assets/` з **читабельними іменами** (`team/servinsky-portrait.png`, `home/hero.png`); відповідність хеш-імен фіксує `manifest.csv`.
- `astro:assets` (`<Image>`/`<Picture>`): формат WebP, `width`/`height` завжди, `srcset` під брейкпоінти 1440 / 1200 / 810 / мобільний, `loading="lazy"` для всього, крім LCP-картинки (hero) — для неї `fetchpriority="high"`.
- Alt — з `manifest.csv`; порожні для фото людей дописуємо, декоративним `alt=""`.
- OG-картинку теж конвертуємо, але OG лишаємо в PNG/JPG (соцмережі не всі читають WebP).

**Шрифти:**
- Open Sans 300 / 400 / 700, підмножини cyrillic + latin, WOFF2, self-hosted (через пакет Fontsource або локальні файли).
- `font-display: swap`, preload однієї основної ваги (300 — заголовки, 400 — текст; вирішимо за LCP).
- Fallback з підібраними метриками (`size-adjust`), щоб не стрибав макет при заміні шрифту.

## Options Considered
| | WebP (обрано) | AVIF + WebP | PNG як є |
|---|---|---|---|
| Вага | у рази менша за PNG | ще ~20–30% менша | важко |
| Збірка | швидка | повільніша | — |
| Підтримка | усі актуальні браузери | старий Safari без AVIF | усі |

## Consequences
- Вага сторінок падає в рази; LCP ≤ 2,5 с стає досяжним.

## Risks
- Фото з градієнтами/шкірою на агресивному стисненні дають артефакти — якість підбираємо (~80) і звіряємо візуально.
