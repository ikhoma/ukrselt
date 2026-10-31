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
      // Ті, що стали видимі одночасно (напр. ряд відгуків на десктопі), з'являються по черзі з кроком 0.2 с, як у Framer.
      let i = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        if (el.dataset.appear === 'slow') el.style.setProperty('--appear-delay', `${i++ * 200}ms`);
        el.classList.add('is-appeared');
        io.unobserve(el);
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

// Шторкою керує інлайн-скрипт у Preloader.astro (стартує раніше за цей модуль). Тут лише чекаємо, поки вона піде.
if (preloader && !(window as unknown as { __preloaderDone?: boolean }).__preloaderDone) {
  lenis?.stop();
  document.addEventListener(
    'ukrselt:preloader-done',
    () => {
      lenis?.start();
      startLoop();
    },
    { once: true },
  );
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
