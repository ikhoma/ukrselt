/**
 * Параметри анімацій, зняті з Framer і живого сайту (SPEC §4, ADR-0005).
 * Пружини будуються через springs.ts; там, де джерело — покадровий замір, крива задана точками заміру.
 */
import { spring, type SpringConfig } from './springs';

type Measured = { duration: number; points: Array<[number, number]> };
type Transition = SpringConfig | Measured;

export const transitions: Record<string, Transition> = {
  /** Мобільне меню (main-navigation, Framer): stiffness 500, damping 60, mass 1. Збігається із заміром ±1 кадр. */
  menu: { stiffness: 500, damping: 60, mass: 1 },
  /**
   * Hover кнопки «Записатися», посилань у TopBar і футері.
   * Покадровий замір на ukrselt.com (частка шляху від часу), ~200 мс.
   */
  hover: {
    duration: 200,
    points: [[0, 0], [0.15, 0.13], [0.31, 0.47], [0.45, 0.6], [0.59, 0.8], [0.73, 0.93], [0.87, 0.99], [1, 1]],
  },
  /** Hover пігулок навігації: покадровий замір, ~350 мс. */
  hoverPill: {
    duration: 350,
    points: [[0, 0], [0.1, 0.09], [0.18, 0.34], [0.26, 0.43], [0.34, 0.6], [0.42, 0.74], [0.51, 0.85], [0.6, 0.92], [0.84, 0.98], [1, 1]],
  },
};

function toCss(t: Transition) {
  if ('points' in t) {
    const easing = `linear(${t.points.map(([x, y]) => `${y} ${Math.round(x * 100)}%`).join(', ')})`;
    return { easing, duration: t.duration };
  }
  return spring(t);
}

/** CSS-змінні для <html>: --ease-<name>, --dur-<name>. */
export function transitionCssVars() {
  return Object.entries(transitions)
    .map(([name, cfg]) => {
      const s = toCss(cfg);
      const key = name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `--ease-${key}: ${s.easing}; --dur-${key}: ${s.duration}ms;`;
    })
    .join(' ');
}
