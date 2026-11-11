/**
 * POST /api/contact — заявка з форми запису → Telegram Bot API (ADR-0004, SPEC §7.1).
 * Секрети тільки з env: BOT_TOKEN, TELEGRAM_LEADS_CHAT_ID. Телефони в логах маскуємо.
 * Приймає multipart/form-data або application/x-www-form-urlencoded (і з fetch, і без JS).
 * Відповідь: JSON, якщо клієнт просить JSON; інакше проста HTML-сторінка (форма без JS).
 */
import type { APIRoute } from 'astro';

export const prerender = false;

/** Мінімальний час від першої взаємодії з формою до відправки (мс). Швидше — позначка «можливо бот» (автозаповнення теж швидке, тож не відкидаємо). */
const MIN_FILL_MS = 2500;

type Result = { ok: boolean; status: number; dryRun?: boolean; error?: 'phone' | 'send' };

const env = (k: string): string | undefined => (typeof process !== 'undefined' ? process.env[k] : undefined) ?? (import.meta.env as Record<string, string | undefined>)[k];

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Лише цифри; українські номери без коду країни (0XXXXXXXXX) доповнюємо до 380XXXXXXXXX. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const full = digits.length === 10 && digits.startsWith('0') ? `38${digits}` : digits;
  if (full.startsWith('380')) return full.length === 12 ? full : null; // Україна: рівно 12 цифр
  return full.length >= 10 && full.length <= 15 ? full : null;
}

const maskPhone = (p: string) => p.slice(0, 5) + '*'.repeat(Math.max(0, p.length - 7)) + p.slice(-2);

function kyivTime(d = new Date()) {
  return new Intl.DateTimeFormat('uk-UA', { timeZone: 'Europe/Kyiv', dateStyle: 'short', timeStyle: 'short' }).format(d);
}

export function buildMessage({ name, phone, service, page, fastMs }: { name: string; phone: string; service: string; page: string; fastMs?: number }) {
  return [
    '<b>Нова заявка з сайту</b>',
    ...(fastMs !== undefined ? [`⚠️ Заповнено за ${(fastMs / 1000).toFixed(1)} с — можливо бот або автозаповнення`] : []),
    `Ім'я: ${name ? escapeHtml(name) : '—'}`,
    `Телефон: <a href="tel:+${phone}">+${phone}</a>`,
    `Сторінка: ${escapeHtml(service || page || '—')}`,
    `Час: ${kyivTime()} (Київ)`,
  ].join('\n');
}

async function sendTelegram(text: string): Promise<boolean> {
  const token = env('BOT_TOKEN');
  const chatId = env('TELEGRAM_LEADS_CHAT_ID');
  if (!token || !chatId) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!res.ok) console.error('[contact] telegram', res.status);
  return res.ok;
}

async function handle(form: FormData): Promise<Result> {
  const get = (k: string) => String(form.get(k) ?? '').trim();

  // Антиспам. Honeypot (приховане поле, людина його не бачить) → тихо «успіх», нічого не шлемо.
  // Швидке заповнення НЕ відкидаємо: автозаповнення телефону теж займає < 2.5 с, а втрачена заявка гірша за спам.
  // Таку заявку надсилаємо з позначкою (код-рев'ю 01.11, п.1).
  if (get('company')) return { ok: true, status: 200 };
  const elapsed = Number(get('elapsed'));
  const fastMs = get('elapsed') && Number.isFinite(elapsed) && elapsed < MIN_FILL_MS ? elapsed : undefined;

  const phone = normalizePhone(get('phone'));
  if (!phone) return { ok: false, status: 400, error: 'phone' };
  const name = get('name').slice(0, 100);
  const service = get('service').slice(0, 100);
  const page = get('page').slice(0, 200);
  const text = buildMessage({ name, phone, service, page, fastMs });

  if (!env('BOT_TOKEN') || !env('TELEGRAM_LEADS_CHAT_ID')) {
    const deployment = env('VERCEL_ENV');
    const local = !deployment || deployment === 'development';
    console.warn('[contact] BOT_TOKEN/TELEGRAM_LEADS_CHAT_ID не задані', local ? '(dry run)' : '', maskPhone(phone));
    return local ? { ok: true, status: 200, dryRun: true } : { ok: false, status: 502, error: 'send' };
  }

  try {
    const sent = await sendTelegram(text);
    console.info('[contact]', sent ? 'sent' : 'failed', maskPhone(phone), service);
    return sent ? { ok: true, status: 200 } : { ok: false, status: 502, error: 'send' };
  } catch (e) {
    console.error('[contact] telegram error', (e as Error).message);
    return { ok: false, status: 502, error: 'send' };
  }
}

function htmlPage(r: Result) {
  const msg = r.ok ? 'Дякуємо! Скоро зателефонуємо' : r.error === 'phone' ? 'Вкажіть номер телефону' : 'Не вдалося надіслати. Спробуйте ще раз або зателефонуйте +38 (063) 076-3022';
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Ukrselt</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#202021;color:#fefefe;font:16px/1.4 'Open Sans',sans-serif;text-align:center;padding:24px}a{color:#009ddc}</style></head><body><main><p>${msg}</p><p><a href="javascript:history.back()">Повернутися</a> · <a href="/">На головну</a></p></main></body></html>`;
}

export const POST: APIRoute = async ({ request }) => {
  let result: Result;
  try {
    result = await handle(await request.formData());
  } catch {
    result = { ok: false, status: 400, error: 'send' };
  }
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  if (wantsJson) {
    return new Response(JSON.stringify({ ok: result.ok, error: result.error, dryRun: result.dryRun }), {
      status: result.status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  return new Response(htmlPage(result), { status: result.status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
};

export const GET: APIRoute = () => new Response(null, { status: 405, headers: { allow: 'POST' } });
