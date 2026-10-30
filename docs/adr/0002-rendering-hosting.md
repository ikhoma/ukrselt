# ADR-0002: Рендеринг і хостинг — статичні сторінки + один endpoint на Vercel

**Status:** Accepted (Іван, 30.10.2026)
**Date:** 2026-10-30
**Deciders:** Іван

## Context
Усі сторінки не залежать від запиту користувача. Серверна логіка потрібна лише для форми (секрети `BOT_TOKEN`, `CHAT_ID` не можна віддавати в браузер). Хостинг Vercel вирішено (HANDOFF).

## Decision
- Astro у режимі за замовчуванням (`output: 'static'`) + адаптер `@astrojs/vercel`.
- Усі сторінки prerender (HTML на етапі збірки, CDN Vercel).
- Тільки `src/pages/api/contact.ts` з `export const prerender = false` → серверна функція Vercel.
- `trailingSlash: 'never'`, як у Framer.
- Редиректи 301 (`/success` → `/`, `/team/brusova` і `/team/marahovich` → `/team`, `www` → основний домен) — у конфігу (`redirects` Astro / `vercel.json`), не в коді сторінок.
- Preview-деплой на кожен push у гілку, production — з `main`.
- Секрети тільки в Vercel env (Production + Preview), локально в `.env` (у `.gitignore`).

## Options Considered
| | Static + 1 endpoint (обрано) | Повний SSR (`output: 'server'`) | Static + стороння форма (як зараз) |
|---|---|---|---|
| Швидкість сторінок | максимальна (CDN) | залежить від функцій | максимальна |
| Вартість | мінімальна | більше викликів функцій | + сторонній сервіс |
| Секрети | на сервері | на сервері | у сторонньому сервісі |
| Залежності | Vercel | Vercel | Vercel + невідомий сервіс |

## Consequences
- Будь-яка зміна контенту = нова збірка (секунди–хвилини). Для сайту клініки нормально.
- 404: статична сторінка `/404` з HTTP 404 (Vercel віддає її автоматично).

## Risks
- Перемикання DNS: вікно, коли частина користувачів бачить старий сайт. Мітигація: знизити TTL у реєстратора за добу до запуску.
