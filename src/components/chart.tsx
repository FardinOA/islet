"use client";

import { useEffect, useRef, useState } from "react";

/** A linear scale from a domain to a range. */
export function scale(d0: number, d1: number, r0: number, r1: number) {
  return (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

/** True on narrow screens, where charts switch to a taller, narrower frame so their labels stay readable. */
export function useCompact(query = "(max-width: 760px)") {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = matchMedia(query);
    const set = () => setCompact(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, [query]);
  return compact;
}

/** Eases an array of numbers toward `target` every frame, so curves re-form instead of jumping. */
export function useMorph(target: number[], rate = 0.14): number[] {
  const [cur, setCur] = useState(target);
  const ref = useRef(target);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || ref.current.length !== target.length) {
      ref.current = target;
      setCur(target);
      return;
    }
    let frame = requestAnimationFrame(function tick() {
      let done = true;
      const next = ref.current.map((v, i) => {
        const d = target[i] - v;
        if (Math.abs(d) > 0.05) done = false;
        return v + d * rate;
      });
      ref.current = done ? target : next;
      setCur(ref.current);
      if (!done) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, rate]);
  return cur;
}

type AxesProps = {
  x: (v: number) => number;
  y: (v: number) => number;
  x0: number;
  x1: number;
  yTicks: number[];
  xTicks: { v: number; label: string }[];
  band?: [number, number];
  limit?: number;
};

/** Grid, target band and labels shared by the page's charts. */
export function Axes({ x, y, x0, x1, yTicks, xTicks, band = [70, 140], limit = 140 }: AxesProps) {
  return (
    <g className="axes">
      <rect className="axes__band" x={x(x0)} y={y(band[1])} width={x(x1) - x(x0)} height={y(band[0]) - y(band[1])} />
      {yTicks.map((t) => (
        <g key={t}>
          <line className={t === limit ? "axes__limit" : "axes__grid"} x1={x(x0)} x2={x(x1)} y1={y(t)} y2={y(t)} />
          <text className="axes__label" x={x(x0) - 10} y={y(t) + 4} textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={t.v} className="axes__label" x={x(t.v)} y={y(yTicks[0]) + 24} textAnchor="middle">
          {t.label}
        </text>
      ))}
    </g>
  );
}
