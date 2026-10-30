# ADR: Ukrselt (Framer → Astro)

Architecture Decision Records. Підстава: `docs/SPEC.md` v0.5, `docs/HANDOFF.md`.
Статус усіх рішень: **Accepted** (затверджено Іваном 30.10.2026).

| # | Рішення | Статус |
|---|---|---|
| [0001](0001-stack.md) | Стек: Astro + CSS-змінні + GSAP, без Tailwind і React | Accepted |
| [0002](0002-rendering-hosting.md) | Статичні сторінки + один серверний endpoint на Vercel | Accepted |
| [0003](0003-content-i18n.md) | Content collections і i18n з запасом під нові локалі | Accepted |
| [0004](0004-form-telegram.md) | Форма: власний endpoint → Telegram Bot API | Accepted |
| [0005](0005-animations.md) | Анімації: CSS + IntersectionObserver для появ, GSAP для скролу, пружини Framer як криві | Accepted |
| [0006](0006-media-fonts.md) | Картинки WebP через astro:assets, Open Sans self-hosted | Accepted |
| [0007](0007-third-party.md) | GTM, Hotjar, Google Maps | Accepted |
