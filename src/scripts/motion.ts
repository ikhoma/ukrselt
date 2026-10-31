/**
 * Анімації сайту (SPEC §4, ADR-0005). Підключається з BaseLayout на всіх сторінках.
 *  - Lenis (duration 3, решта за замовчуванням) + GSAP ScrollTrigger на одному RAF (§4.0)
 *  - поява при скролі [data-appear]: поріг 0.5, opacity 0 → 1, tween 0.2 с, ease (0.5, 0, 0.88, 0.77) (§4.4)
 *  - паралакс [data-parallax="0.1"]: фото hero рухається зі швидкістю 0.1 від скролу (заміряно: +20px на 200px)
 *  - Team на головній: AnimationTimeline 1:1 (покадровий замір, docs/reference/stage-4/anim-Team-*.json)
 *  - прелоадер і ротатор слів на головній (§4.1, §4.3)
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { spring } from './springs';

gsap.registerPlugin(ScrollTrigger);

/* ── Оновлення сторінки починається згори (як «Smooth Scroll» у Framer, SPEC §4.0), якщо в адресі немає якоря ── */
// ScrollTrigger сам керує history.scrollRestoration і пам'яттю скролу — тому через його API.
ScrollTrigger.clearScrollMemory('manual');
if (!location.hash) window.scrollTo(0, 0);

/* ── Плавний скрол ─────────────────────────────────────────── */
const smooth = !document.documentElement.hasAttribute('data-no-smooth-scroll');
let lenis: Lenis | null = null;
if (smooth) {
  lenis = new Lenis({ duration: 3, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  for (const el of document.querySelectorAll<HTMLElement>('[data-scrollable]')) el.setAttribute('data-lenis-prevent', '');
  document.addEventListener('ukrselt:scroll-lock', () => lenis!.stop());
  document.addEventListener('ukrselt:scroll-unlock', () => lenis!.start());
}

/* ── Поява при скролі ──────────────────────────────────────── */
const appearItems = document.querySelectorAll<HTMLElement>('[data-appear]');
if (appearItems.length) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-appeared');
        io.unobserve(e.target);
      }
    },
    { threshold: 0.5 },
  );
  appearItems.forEach((el) => io.observe(el));
}

/* ── Паралакс hero ─────────────────────────────────────────── */
for (const el of document.querySelectorAll<HTMLElement>('[data-parallax]')) {
  const speed = Number(el.dataset.parallax) || 0.1;
  const host = el.closest('section') ?? el.parentElement!;
  gsap.to(el, {
    y: () => (host.getBoundingClientRect().bottom + window.scrollY) * speed,
    ease: 'none',
    scrollTrigger: { start: 0, end: () => host.getBoundingClientRect().bottom + window.scrollY, scrub: true, invalidateOnRefresh: true },
  });
}

/* ── Місія на «Про нас»: sticky 900 у секції 1700, текст opacity 0 → 1, scale 0.9 → 1 лінійно за 800 px ── */
for (const el of document.querySelectorAll<HTMLElement>('[data-scrub-reveal]')) {
  gsap.fromTo(
    el,
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1, ease: 'none', scrollTrigger: { trigger: el.closest('section') ?? el, start: 'top top', end: '+=800', scrub: true } },
  );
}

/* ── Team на головній ──────────────────────────────────────── */
/** Кінцеві позиції карток із Framer (doc1, doc2, doc5, doc6). Для 5-ї і далі — повтор по колу (рішення TBD, QUESTIONS п.19). */
const teamEnd = {
  desktop: { from: 1.5, to: 0.8, pos: [[-432, -240], [218, -274], [-217, 275], [540, -200]] },
  phone: { from: 1, to: 0.5, pos: [[-140, -240], [0, -280], [140, 240], [140, -240]] },
};
const team = document.querySelector<HTMLElement>('[data-showcase="team"]');
if (team) {
  const cards = [...team.querySelectorAll<HTMLElement>('[data-card]')];
  const title = team.querySelector<HTMLElement>('[data-title]')!;
  const timeline = team.querySelector<HTMLElement>('.timeline')!;
  team.classList.add('is-animated');
  const mm = gsap.matchMedia();
  const build = (cfg: (typeof teamEnd)['desktop']) => {
    // Sticky висотою 900 закріплений, поки Animation Timeline (800) проходить під ним — це і є діапазон анімації.
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: timeline, start: 'top top+=900', end: 'bottom top+=900', scrub: true },
    });
    cards.forEach((card, i) => {
      const [x, y] = cfg.pos[i % cfg.pos.length];
      tl.fromTo(card, { x: 0, y: 0, scale: cfg.from }, { x, y, scale: cfg.to, duration: 1 }, 0);
    });
    // Заголовок з'являється на останніх 252 з 800 px (opacity 0 → 1, scale 0.9 → 1).
    tl.fromTo(title, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 252 / 800 }, 1 - 252 / 800);
  };
  mm.add('(min-width: 810px)', () => build(teamEnd.desktop));
  mm.add('(max-width: 809.98px)', () => build(teamEnd.phone));
}

/* ── Прелоадер і ротатор (головна) ─────────────────────────── */
const preloader = document.querySelector<HTMLElement>('[data-preloader]');
const loop = document.querySelector<HTMLElement>('[data-text-loop]');

/** Заміряна крива шторки прелоадера (частка шляху від часу), ~520 мс. */
const CURTAIN_EASE = 'linear(0 0%, 0.12 12%, 0.51 24%, 0.79 37%, 0.92 49%, 0.96 61%, 0.99 73%, 1 100%)';
/** Ритм прелоадера (рішення Івана 31.10): хрест заповнюється мінімум 1 с, тримається 1 с, далі шторка. */
const FILL_MIN_MS = 1000;
const HOLD_MS = 1000;
/** Якщо критичне (фото Hero, оверлей, шрифт) не прийшло за цей час — відкриваємо однаково. */
const CRITICAL_TIMEOUT_MS = 6000;

/** cubic-bezier(x1, y1, x2, y2) як функція часу 0..1 → 0..1. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const f = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x: number) => {
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 30; i++) {
      t = (lo + hi) / 2;
      if (f(x1, x2, t) < x) lo = t;
      else hi = t;
    }
    return f(y1, y2, t);
  };
}
const fillEase = bezier(0.5, 0, 0, 1);

/**
 * Прогрес критичних ресурсів 0..1: фото Hero, оверлей, шрифти.
 * Решта сторінки довантажується вже під відкритою шторкою.
 */
function criticalProgress(onChange: (p: number) => void) {
  const tasks: Promise<unknown>[] = [
    ...[...document.querySelectorAll<HTMLImageElement>('img[data-critical]')].map((img) =>
      img.complete ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); }),
    ),
    // Шрифти Hero і меню: явно просимо потрібні накреслення з кирилицею (інакше fonts.ready може спрацювати раніше, ніж їх запитали).
    document.fonts ? Promise.all(['300 96px', '400 16px'].map((f) => document.fonts.load(`${f} "Open Sans"`, 'Змінюємо Ukrselt'))).catch(() => {}) : Promise.resolve(),
  ];
  let done = 0;
  onChange(0);
  tasks.forEach((t) => t.then(() => onChange(++done / tasks.length)));
  setTimeout(() => onChange(1), CRITICAL_TIMEOUT_MS);
}

function startLoop() {
  if (!loop) return;
  const stack = loop.querySelector<HTMLElement>('[data-text-loop-stack]')!;
  const steps = stack.children.length - 1; // остання — копія першої
  const { easing, duration } = spring({ stiffness: 400, damping: 30, mass: 1 });
  let i = -1; // -1: слово ще під маскою
  const go = (n: number, animate = true) => {
    i = n;
    stack.style.transition = animate ? `transform ${duration}ms ${easing}` : 'none';
    stack.style.transform = `translateY(${-i * 100 / (steps + 1)}%)`;
  };
  go(-1, false);
  void stack.offsetWidth;
  setTimeout(() => {
    go(0);
    setInterval(() => {
      if (i === steps) {
        go(0, false);
        void stack.offsetWidth;
      }
      go(i + 1);
    }, 2000);
  }, 1000);
}

if (preloader) {
  lenis?.stop();
  const wipe = preloader.querySelector<SVGElement>('.wipe');
  const logo = preloader.querySelector<HTMLElement>('.logo');
  preloader.style.animation = 'none'; // CSS-запобіжник не потрібен, JS працює
  if (wipe) wipe.style.animation = 'none';
  let target = 0;
  criticalProgress((p) => (target = Math.max(target, p)));
  const t0 = performance.now();
  const tick = (now: number) => {
    // Заповнення не швидше за 1 с по кривій лого і не більше, ніж реально завантажено.
    const shown = Math.min(target, fillEase(Math.min(1, (now - t0) / FILL_MIN_MS)));
    if (wipe) wipe.style.transform = `scaleY(${shown})`;
    if (shown < 1) return requestAnimationFrame(tick);
    setTimeout(() => {
      if (logo) {
        logo.style.transition = 'opacity 200ms ease-out';
        logo.style.opacity = '0';
      }
      preloader.style.transition = `transform 520ms ${CURTAIN_EASE}`;
      preloader.style.transform = 'translateY(-100%)';
      setTimeout(() => preloader.remove(), 600);
      lenis?.start();
      startLoop();
    }, HOLD_MS);
  };
  requestAnimationFrame(tick);
} else {
  startLoop();
}

window.addEventListener('load', () => {
  // Браузер може відновити позицію вже після нашого scrollTo(0, 0) — повертаємо на початок ще раз.
  if (!location.hash) {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }
  ScrollTrigger.refresh();
});
