/**
 * Пружини Framer (модель Motion) → CSS `linear()` easing + тривалість.
 * ADR-0005: замість вгадування кривих обчислюємо ту саму фізику, що у Framer.
 *
 * Два способи задати пружину у Framer:
 *  - фізичний: { stiffness, damping, mass }
 *  - «візуальний»: { duration, bounce } → перераховується у stiffness/damping
 *    так само, як у framer-motion (findSpring: dampingRatio = 1 - bounce,
 *    undampedFreq шукається методом Ньютона).
 */

export type PhysicalSpring = { stiffness: number; damping: number; mass?: number };
export type DurationSpring = { duration: number; bounce: number };
export type SpringConfig = PhysicalSpring | DurationSpring;

const SAFE_MIN = 0.001;

function angularFreq(undamped: number, ratio: number) {
  return undamped * Math.sqrt(1 - ratio * ratio);
}

/** framer-motion findSpring (velocity = 0, mass = 1). */
function fromDuration({ duration, bounce }: DurationSpring): PhysicalSpring {
  const ratio = Math.min(Math.max(1 - bounce, 0.05), 1);
  const d = Math.min(Math.max(duration, 0.01), 10);
  let envelope: (f: number) => number;
  let derivative: (f: number) => number;
  if (ratio < 1) {
    envelope = (f) => {
      const decay = f * ratio;
      const delta = decay * d;
      const a = decay;
      const b = angularFreq(f, ratio);
      const c = Math.exp(-delta);
      return SAFE_MIN - (a / b) * c;
    };
    derivative = (f) => {
      const decay = f * ratio;
      const delta = decay * d;
      const e = ratio * ratio * f * f * d;
      const ex = Math.exp(-delta);
      const g = angularFreq(f * f, ratio);
      const factor = -envelope(f) + SAFE_MIN > 0 ? -1 : 1;
      return (factor * (0 - e) * ex) / g;
    };
  } else {
    envelope = (f) => -SAFE_MIN + Math.exp(-f * d) * ((f - 0) * d + 1);
    derivative = (f) => Math.exp(-f * d) * (d * d * (0 - f));
  }
  let f = 5 / d;
  for (let i = 0; i < 12; i++) f = f - envelope(f) / derivative(f);
  const stiffness = f * f;
  return { stiffness, damping: ratio * 2 * Math.sqrt(stiffness), mass: 1 };
}

function toPhysical(c: SpringConfig): Required<PhysicalSpring> {
  const p = 'duration' in c ? fromDuration(c) : c;
  return { stiffness: p.stiffness, damping: p.damping, mass: p.mass ?? 1 };
}

/** Положення пружини від 0 до 1 у момент t (с), стартова швидкість 0. */
function position({ stiffness, damping, mass }: Required<PhysicalSpring>, t: number) {
  const w0 = Math.sqrt(stiffness / mass);
  const z = damping / (2 * Math.sqrt(stiffness * mass));
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(z * z - 1);
  return 1 - Math.exp(-z * w0 * t) * (Math.cosh(wd * t) + ((z * w0) / wd) * Math.sinh(wd * t));
}

/**
 * CSS easing `linear(...)` і тривалість у мс.
 * Тривалість — момент, після якого відхилення лишається < restDelta.
 */
export function spring(config: SpringConfig, { samples = 40, restDelta = 0.001 } = {}) {
  const p = toPhysical(config);
  const step = 1 / 120;
  let settled = 0;
  for (let t = 0; t < 10; t += step) {
    if (Math.abs(1 - position(p, t)) > restDelta) settled = t + step;
  }
  const duration = Math.max(settled, step);
  const points: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const v = i === samples ? 1 : position(p, (duration * i) / samples);
    points.push(String(Math.round(v * 10000) / 10000));
  }
  return { easing: `linear(${points.join(', ')})`, duration: Math.round(duration * 1000) };
}
