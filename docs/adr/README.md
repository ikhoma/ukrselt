# ADR: Ukrselt (Framer → Astro)

Architecture Decision Records. Підстава: `docs/SPEC.md` v0.5, `docs/HANDOFF.md`.
Статуси: **Accepted** — рішення Івана вже є в HANDOFF/SPEC; **Proposed** — пропозиція на затвердження.

| # | Рішення | Статус |
|---|---|---|
| [0001](0001-stack.md) | Стек: Astro + CSS-змінні + GSAP, без Tailwind і React | Accepted |
| [0002](0002-rendering-hosting.md) | Статичні сторінки + один серверний endpoint на Vercel | Proposed |
| [0003](0003-content-i18n.md) | Content collections і i18n з запасом під нові локалі | Proposed |
| [0004](0004-form-telegram.md) | Форма: власний endpoint → Telegram Bot API | Proposed |
| [0005](0005-animations.md) | Анімації: CSS + IntersectionObserver для появ, GSAP для скролу, пружини Framer як криві | Proposed |
| [0006](0006-media-fonts.md) | Картинки WebP через astro:assets, Open Sans self-hosted | Proposed |
| [0007](0007-third-party.md) | GTM, Hotjar, Google Maps | Proposed |
