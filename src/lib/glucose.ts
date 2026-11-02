/*
  The glucose model every chart on the page draws from. It is deliberately
  small: a meal's carbs raise blood glucose in a gamma-shaped curve that peaks
  ~45 minutes after the first bite, falls back and dips a little under
  baseline. Fibre or protein eaten first, and a walk soon after, lower and
  slow that rise. Figures are illustrative, tuned to published ranges.
*/

export const LOW = 70;
export const HIGH = 140;

/** mg/dL above baseline, `t` minutes after the first bite of a meal that would rise by `amp`. */
export function response(t: number, amp: number, peakAt = 45): number {
  if (t <= 0) return 0;
  const x = t / peakAt;
  const rise = amp * x * x * Math.exp(2 * (1 - x));
  const w = peakAt * 0.7;
  const dip = -0.14 * amp * Math.exp(-((t - peakAt * 2.7) ** 2) / (2 * w * w));
  return rise + dip;
}

/* ---------- a whole day, for the hero ---------- */

const MEALS: [hour: number, amp: number][] = [
  [7.6, 72],
  [12.9, 86],
  [16.3, 16],
  [19.7, 94],
];

/** Glucose at an unwrapped hour of the day (13.5 = 1:30 pm, 37.5 = 1:30 pm next day). */
export function dayAt(h: number): number {
  const day = Math.floor(h / 24);
  let v = 84;
  // Dawn phenomenon: a small hormonal rise before waking.
  const hd = h - day * 24;
  v += 9 * Math.exp(-((hd - 6.2) ** 2) / 2.2);
  for (let d = day - 1; d <= day; d++) {
    for (const [m, amp] of MEALS) v += response((h - (m + d * 24)) * 60, amp);
  }
  v += 2.6 * Math.sin(h * 2.7) + 1.7 * Math.sin(h * 5.3 + 1) + 1.1 * Math.sin(h * 11.1 + 2);
  return v;
}

export function clock(h: number): string {
  const m = Math.round((((h % 24) + 24) % 24) * 60);
  const hh = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/* ---------- meal order ---------- */

export type Course = { id: string; name: string; note: string; carbs: number; fibre: number; protein: number; fat: number };

export const COURSES: Course[] = [
  { id: "greens", name: "Greens", note: "Rocket, cucumber, olive oil", carbs: 8, fibre: 5, protein: 2, fat: 11 },
  { id: "salmon", name: "Salmon", note: "Roasted fillet, 140 g", carbs: 0, fibre: 0, protein: 31, fat: 13 },
  { id: "rice", name: "Rice", note: "Jasmine, one cup cooked", carbs: 53, fibre: 1, protein: 4, fat: 0 },
];

export const COURSE_MIN = 15;

/** Glucose `t` minutes after sitting down, eating the courses in `order`, one every fifteen minutes. */
export function orderAt(order: Course[], t: number, base = 88): number {
  let v = base;
  let fibre = 0;
  let protein = 0;
  order.forEach((c, i) => {
    const damp = 1 - (fibre >= 4 ? 0.22 : 0) - (protein >= 20 ? 0.16 : 0);
    const peakAt = 42 + (fibre >= 4 ? 14 : 0) + (protein >= 20 ? 12 : 0);
    v += response(t - i * COURSE_MIN, c.carbs * 1.55 * damp, peakAt);
    fibre += c.fibre;
    protein += c.protein;
  });
  return v;
}

/* ---------- a walk after dinner ---------- */

export const WALK_START = 12;
export const WALK_MAX = 20;

export function walkAt(t: number, minutes: number, base = 90): number {
  const amp = 104 * (1 - 0.021 * minutes);
  const peakAt = 48 - minutes * 0.5;
  return base + response(t, amp, peakAt);
}

/* ---------- curve summaries ---------- */

export function sample(fn: (t: number) => number, t0: number, t1: number, n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    out.push([t, fn(t)]);
  }
  return out;
}

export function summarise(pts: [number, number][]) {
  let peak = pts[0];
  for (const p of pts) if (p[1] > peak[1]) peak = p;
  let above = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i][1] > HIGH) above += pts[i][0] - pts[i - 1][0];
  let dip = Infinity;
  for (const p of pts) if (p[0] > peak[0] && p[1] < dip) dip = p[1];
  return { peak: peak[1], peakAt: peak[0], above: Math.round(above), dip };
}

/** Smooth SVG path through points (Catmull-Rom as cubic Béziers). */
export function smoothPath(pts: [number, number][]): string {
  if (!pts.length) return "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Seeded random, so every visitor sees the same fifteen days. */
export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
