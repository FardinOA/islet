"use client";

import { useEffect, useMemo, useState } from "react";
import { HIGH, LOW, response, rng, smoothPath } from "@/lib/glucose";
import { Axes, scale, useCompact } from "./chart";
import { NavIcon } from "./icons";
import { Headline, useInView } from "./reveal";

const DAYS = 15;
const BINS = 96; // every fifteen minutes
const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Day = { label: string; date: number; vals: number[]; tir: number; peak: number; peakH: number };

/** Fifteen seeded days: three meals each, with Thursday dinners that always run high. */
function record(): Day[] {
  const r = rng(11);
  const out: Day[] = [];
  for (let d = 0; d < DAYS; d++) {
    const wd = (2 + d) % 7; // Oct 6, 2026 is a Tuesday
    const base = 82 + r() * 8;
    const meals: [number, number, number][] = [
      [7 + r() * 1.5, 16 + r() * 26, 40],
      [12.3 + r() * 1.3, 32 + r() * 46, 44],
      [18.8 + r() * 1.6, wd === 4 ? 92 + r() * 8 : 40 + r() * 46, 46],
    ];
    if (r() > 0.6) meals.push([15.5 + r() * 1.5, 10 + r() * 18, 34]);
    const ph = [r() * 6, r() * 6, r() * 6];
    const vals = Array.from({ length: BINS }, (_, i) => {
      const h = i / 4;
      let v = base + 8 * Math.exp(-((h - 6.1) ** 2) / 2.4);
      for (const [m, a, pk] of meals) v += response((h - m) * 60, a, pk);
      v += 2.4 * Math.sin(h * 2.3 + ph[0]) + 1.6 * Math.sin(h * 4.9 + ph[1]) + 1.2 * Math.sin(h * 9.7 + ph[2]);
      return v;
    });
    let peak = 0;
    let peakH = 0;
    vals.forEach((v, i) => {
      if (v > peak) {
        peak = v;
        peakH = i / 4;
      }
    });
    out.push({ label: WEEK[wd], date: 6 + d, vals, tir: vals.filter((v) => v >= LOW && v <= HIGH).length / BINS, peak, peakH });
  }
  return out;
}

function pct(sorted: number[], q: number) {
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  return sorted[lo] + (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo]) * (i - lo);
}

const meal = (h: number) => (h < 10.5 ? "breakfast" : h < 15 ? "lunch" : h < 17.5 ? "snack" : "dinner");

export function Report() {
  const days = useMemo(() => record(), []);
  const compact = useCompact();
  const W = compact ? 480 : 1000;
  const H = compact ? 340 : 380;
  const x = useMemo(() => scale(0, 24, compact ? 34 : 52, W - 12), [compact, W]);
  const y = useMemo(() => scale(40, 220, H - 36, 14), [H]);
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const [count, setCount] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const folded = count >= DAYS;

  // Record the fortnight in, one day at a time.
  useEffect(() => {
    if (!seen) return;
    const step = matchMedia("(prefers-reduced-motion: reduce)").matches ? DAYS : 1;
    const id = setInterval(() => setCount((c) => Math.min(DAYS, c + step)), 130);
    return () => clearInterval(id);
  }, [seen]);

  const { bands, median, stats } = useMemo(() => {
    const qs = [0.05, 0.25, 0.5, 0.75, 0.95];
    const cols = Array.from({ length: BINS }, (_, i) => days.map((d) => d.vals[i]).sort((a, b) => a - b));
    const lines = qs.map((q) => cols.map((c, i) => [x(i / 4), y(pct(c, q))] as [number, number]));
    const band = (lo: [number, number][], hi: [number, number][]) => `${smoothPath(hi)}L${[...lo].reverse().map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}Z`;
    const all = days.flatMap((d) => d.vals);
    const mean = all.reduce((a, b) => a + b, 0) / all.length;
    const sd = Math.sqrt(all.reduce((a, b) => a + (b - mean) ** 2, 0) / all.length);
    const top = days.reduce((a, b) => (b.peak > a.peak ? b : a));
    return {
      bands: { outer: band(lines[0], lines[4]), inner: band(lines[1], lines[3]) },
      median: smoothPath(lines[2]),
      stats: {
        tir: Math.round((all.filter((v) => v >= LOW && v <= HIGH).length / all.length) * 100),
        mean: Math.round(mean),
        cv: Math.round((sd / mean) * 100),
        top: `${top.label} ${meal(top.peakH)}`,
        topV: Math.round(top.peak),
      },
    };
  }, [days, x, y]);

  return (
    <section className="report stage stage--rasp" id="report" aria-labelledby="report-title">
      <div className="wrap">
        <header className="report__head">
          <Headline text="Fifteen days, folded into one day you'll recognise." id="report-title" className="report__title" />
          <p className="lead">
            Each sensor ends with a report. Every day is laid over the others, so the noise falls away and your patterns remain: the steady
            mornings, the one meal that always runs high.
          </p>
        </header>

        <div className={`win report__win ${seen ? "is-seen" : ""} ${folded ? "is-folded" : ""}`} ref={ref}>
          <nav className="side" aria-label="App sections (preview)">
            <span className="side__brand" aria-hidden="true" />
            {(["today", "meals", "report", "coach", "settings"] as const).map((n) => (
              <span key={n} className={`side__item ${n === "report" ? "is-on" : ""}`}>
                <NavIcon name={n} />
                <span>{n[0].toUpperCase() + n.slice(1)}</span>
              </span>
            ))}
          </nav>

          <div className="report__main">
            <div className="report__bar">
              <div>
                <p className="report__name">Sensor 1 report</p>
                <p className="report__range mono">Tue 6 Oct → Tue 20 Oct · 1,440 readings a day</p>
              </div>
              <span className="report__share">Share with my doctor</span>
            </div>

            <dl className="report__stats">
              <div>
                <dt>In range, 70–140</dt>
                <dd className="mono">
                  {stats.tir}
                  <small>%</small>
                </dd>
                <span className="meter" aria-hidden="true">
                  <i style={{ width: `${stats.tir}%` }} />
                </span>
              </div>
              <div>
                <dt>Average</dt>
                <dd className="mono">
                  {stats.mean}
                  <small> mg/dL</small>
                </dd>
              </div>
              <div>
                <dt>Variability</dt>
                <dd className="mono">
                  {stats.cv}
                  <small>% CV</small>
                </dd>
              </div>
              <div className="is-hot">
                <dt>Runs highest</dt>
                <dd>
                  {stats.top}
                  <small className="mono"> · {stats.topV}</small>
                </dd>
              </div>
            </dl>

            <div className="report__chart">
              <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Ambulatory glucose profile over fifteen days: ${stats.tir}% of readings in range, average ${stats.mean} mg/dL.`}>
                <Axes
                  x={x}
                  y={y}
                  x0={0}
                  x1={24}
                  yTicks={compact ? [70, 140, 220] : [40, 70, 140, 180, 220]}
                  xTicks={(compact ? [0, 12, 24] : [0, 6, 12, 18, 24]).map((v) => ({ v, label: `${String(v % 24).padStart(2, "0")}:00` }))}
                />
                <path className="agp__outer" d={bands.outer} />
                <path className="agp__inner" d={bands.inner} />
                {days.map((d, i) => (
                  <path
                    key={d.date}
                    className={`agp__day ${i < count ? "is-on" : ""} ${active === i ? "is-active" : ""}`}
                    pathLength={1}
                    d={smoothPath(d.vals.map((v, k) => [x(k / 4), y(v)]))}
                  />
                ))}
                <path className="agp__median" pathLength={1} d={median} />
                <g className="agp__key">
                  <text x={x(1)} y={y(206)}>
                    Median, with 25–75% and 5–95% of your days
                  </text>
                </g>
              </svg>
            </div>

            <ol className="days" aria-label="Days recorded">
              {days.map((d, i) => (
                <li key={d.date}>
                  <button
                    type="button"
                    className={`days__cell ${i < count ? "is-on" : ""} ${active === i ? "is-active" : ""}`}
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    aria-label={`${d.label} ${d.date} October: ${Math.round(d.tir * 100)}% in range, peak ${Math.round(d.peak)}`}
                  >
                    <span className="days__wd">{d.label}</span>
                    <span className="days__date mono">{d.date}</span>
                    <span className="days__tir" style={{ "--t": d.tir } as React.CSSProperties} />
                    <span className={`days__pct mono ${d.peak > 160 ? "is-hot" : ""}`}>{Math.round(d.tir * 100)}%</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
