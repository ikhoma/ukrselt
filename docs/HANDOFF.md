# Ukrselt: перенос з Framer на Astro (handoff)

## Рішення
- Стек: Astro + CSS (змінні/токени, без Tailwind) + GSAP/ScrollTrigger. Хостинг: Vercel.
- Форма: свій endpoint `src/pages/api/contact.ts` -> Telegram Bot API (BOT_TOKEN, CHAT_ID в env). Без сторонніх сервісів.
- Мови: українська + англійська (Framer localization). Зберегти URL, hreflang, SEO (title/description/OG/canonical/sitemap/Schema.org Dentist).
- Компоненти Astro називаємо як у Framer (брати з `data-framer-name` у DOM), структуру зберегти.
- Спочатку SPEC (write-spec) і ADR, потім розробка.

## Анімації (аудит головної)
- Майже все: простий fade-in при скролі.
- Два паралакс-блоки з плаваючими круглими фото: "Широкий спектр стоматологічних послуг" і "Наша команда кваліфікованих лікарів". Один компонент, використати двічі, на GSAP ScrollTrigger (scrub).
- Параметри (duration, ease, y, speed) зняти з живого DOM і винести в `animations.ts`.

## Прелоадер
- Готово: `logo-preloader.svg` (SMIL, без JS) і демо `preloader.html`.
- Анімується лише синій хрест: маска 40x40, низ фіксований, верх піднімається, 1 с, easing 0.5 0 0 1. Рамка, текст, білий хрест статичні. Збільшення лого немає.
- Джерело: `Frame 100.json` (Jitter, 60fps). У Framer Preloader застряг у Variant 2 (без анімації), тож відновити тригер там, якщо лишаємо Framer.

## Фреймер: що переносити
- Color styles і text styles -> CSS variables.
- Code components (React/TSX): Lottie (замінюється SVG), Google Map (iframe/lazy island).
- Візуальні компоненти -> Astro-компоненти.
- Картинки з framerusercontent.com -> WebP/AVIF, width/height.
- Перевірити: CMS (колекції), аналітика/піксели.

## Нотатки по інструментах
- Sandbox без прямої мережі: дані з сайту брати через Chrome (claude-in-chrome) або web_fetch.
- Папка проєкту: `ukrselt`.

## Стан на 31.10.2026 (автономна робота, етапи 3–7)
Гілки, кожна від попередньої, у `main` нічого не злито; у кожної свій preview на Vercel:
- `stage-3` — /team, /team/<slug> (4 лікарі), /services з колекцій `team`, `services` (`src/content.config.ts`).
- `stage-4` — головна (статичний стан), `VisitUs` спільний з «Контактами».
- `stage-5` — `/api/contact` → Telegram (без токена: dry run на preview, помилка на production), стани форми, `form_submit`, GTM/Hotjar лише на production.
- `stage-6` — `src/scripts/motion.ts`: Lenis, поява, паралакс, прелоадер, ротатор, місія, Team AnimationTimeline.
- `stage-7` — QA: `docs/QA.md`.
Рішення, прийняті без Івана, і відкриті питання: `docs/QUESTIONS.md`.
Не робилось: етап 8 (DNS, запуск, бот Telegram, регіон функцій), етап 9 (анімація Services).
Інструменти перевірки: Playwright у контейнері, порівняння з живим сайтом за позиціями елементів (1440/1024/390); заміри анімацій — `docs/reference/stage-4/anim-*.json`.
