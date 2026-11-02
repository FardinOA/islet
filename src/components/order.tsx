"use client";

import { useMemo, useRef, useState } from "react";
import { COURSES, COURSE_MIN, HIGH, orderAt, smoothPath, summarise, type Course } from "@/lib/glucose";
import { Axes, scale, useCompact, useMorph } from "./chart";
import { Chevron, Grip } from "./icons";
import { Headline, useInView } from "./reveal";

const T1 = 180;
const N = 90;
const ORDINAL = ["First", "Then", "Last"];

const byId = (id: string) => COURSES.find((c) => c.id === id)!;
const curve = (order: Course[]) => Array.from({ length: N + 1 }, (_, i) => orderAt(order, (T1 * i) / N));
function frame(compact: boolean) {
  const W = compact ? 480 : 1000;
  const H = compact ? 340 : 380;
  const x = scale(0, T1, compact ? 34 : 52, W - 12);
  const y = scale(60, 200, H - 40, 16);
  const pts = (vals: number[]): [number, number][] => vals.map((v, i) => [x((T1 * i) / N), y(v)]);
  return { W, H, x, y, pts };
}

const WORST = [byId("rice"), byId("salmon"), byId("greens")];
const BEST = [byId("greens"), byId("salmon"), byId("rice")];

function Macro({ c }: { c: Course }) {
  const parts: [string, number][] = [
    ["carbs", c.carbs],
    ["fibre", c.fibre],
    ["protein", c.protein],
    ["fat", c.fat],
  ];
  return (
    <div className="macro">
      <div className="macro__bar">
        {parts.map(([k, g]) => (
          <i key={k} className={`macro--${k}`} style={{ flexGrow: Math.max(g, 0.001) }} />
        ))}
      </div>
      <dl className="macro__nums">
        {parts.map(([k, g]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd className="mono">{g} g</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Order() {
  const [ids, setIds] = useState(WORST.map((c) => c.id));
  const order = useMemo(() => ids.map(byId), [ids]);
  const [drag, setDrag] = useState<{ id: string; d: number; step: number } | null>(null);
  const vertical = useCompact();
  const { W, H, x, y, pts } = useMemo(() => frame(vertical), [vertical]);
  const track = useRef<HTMLDivElement>(null);
  const [tableRef, served] = useInView<HTMLDivElement>(0.3);

  const target = useMemo(() => curve(order), [order]);
  const vals = useMorph(target, 0.12);
  const stats = summarise(target.map((v, i) => [(T1 * i) / N, v]));
  const isWorst = ids.join() === WORST.map((c) => c.id).join();
  const ghostOrder = isWorst ? BEST : WORST;
  const ghost = useMemo(() => curve(ghostOrder), [ghostOrder]);
  const ghostStats = summarise(ghost.map((v, i) => [(T1 * i) / N, v]));
  const delta = Math.round(stats.peak - summarise(curve(WORST).map((v, i) => [(T1 * i) / N, v])).peak);

  const move = (id: string, to: number) => {
    setIds((cur) => {
      const next = cur.filter((c) => c !== id);
      next.splice(Math.max(0, Math.min(2, to)), 0, id);
      return next;
    });
  };

  // Drag: the card follows the pointer, and its neighbours step aside as it crosses them.
  const onDown = (e: React.PointerEvent, id: string) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const el = track.current;
    if (!el) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const start = vertical ? e.clientY : e.clientX;
    const from = ids.indexOf(id);
    const step = vertical ? el.clientHeight / 3 : el.clientWidth / 3;
    let d = 0;
    const onMove = (ev: PointerEvent) => {
      d = (vertical ? ev.clientY : ev.clientX) - start;
      setDrag({ id, d, step });
    };
    const onUp = () => {
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      removeEventListener("pointercancel", onUp);
      setDrag(null);
      move(id, from + Math.round(d / step));
    };
    addEventListener("pointermove", onMove);
    addEventListener("pointerup", onUp);
    addEventListener("pointercancel", onUp);
    setDrag({ id, d: 0, step });
  };

  // While dragging, show where the others will land.
  const slots = useMemo(() => {
    if (!drag) return ids;
    const from = ids.indexOf(drag.id);
    const to = Math.max(0, Math.min(2, from + Math.round(drag.d / drag.step)));
    const next = ids.filter((c) => c !== drag.id);
    next.splice(to, 0, drag.id);
    return next;
  }, [drag, ids]);

  const line = smoothPath(pts(vals));
  const areaD = `${line}L${x(T1)},${H}L${x(0)},${H}Z`;
  const peakI = vals.indexOf(Math.max(...vals));

  return (
    <section className="order" id="order" aria-labelledby="order-title">
      <div className="wrap">
        <header className="order__head">
          <Headline text="Same lunch. Eat it in a different order." id="order-title" className="order__title" />
          <p className="lead">
            Fibre and protein first slow how fast the rice reaches your blood. Nothing on the plate changes, only the order. Drag the courses
            and watch your afternoon.
          </p>
        </header>

        <div className={`table ${served ? "is-served" : ""}`} ref={tableRef}>
          <div className={`courses ${vertical ? "courses--v" : ""}`} ref={track} role="list" aria-label="Lunch, in the order you eat it">
            {ids.map((id) => {
              const c = byId(id);
              const at = slots.indexOf(id);
              const dragging = drag?.id === id;
              const offset = dragging ? `${drag.d}px` : "0px";
              const pos = vertical ? `translate3d(0, calc(${at * 100}% + ${at * 12}px + ${offset}), 0)` : `translate3d(calc(${at * 100}% + ${at * 14}px + ${offset}), 0, 0)`;
              const i = ids.indexOf(id);
              return (
                <div
                  key={id}
                  role="listitem"
                  className={`slot ${dragging ? "is-dragging" : ""}`}
                  style={{ transform: dragging ? (vertical ? `translate3d(0, calc(${i * 100}% + ${i * 12}px + ${offset}), 0)` : `translate3d(calc(${i * 100}% + ${i * 14}px + ${offset}), 0, 0)`) : pos, "--k": i } as React.CSSProperties}
                  onPointerDown={(e) => onDown(e, id)}
                >
                  <article className={`course course--${id}`} aria-label={`${ORDINAL[i]}: ${c.name}`}>
                    <div className="course__top">
                      <span className="course__when">{ORDINAL[at]}</span>
                      <span className="course__min mono">{at * COURSE_MIN} min</span>
                      <Grip className="ico course__grip" />
                    </div>
                    <h3 className="course__name">{c.name}</h3>
                    <p className="course__note">{c.note}</p>
                    <Macro c={c} />
                    <div className="course__move">
                      <button type="button" aria-label={`Eat ${c.name} earlier`} disabled={i === 0} onClick={() => move(id, i - 1)}>
                        <Chevron dir={vertical ? "up" : "left"} />
                      </button>
                      <button type="button" aria-label={`Eat ${c.name} later`} disabled={i === 2} onClick={() => move(id, i + 1)}>
                        <Chevron dir={vertical ? "down" : "right"} />
                      </button>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>

          <div className="order__chart">
            <p className="legend">
              <span>
                <i className="legend__solid" /> Your order
              </span>
              <span>
                <i className="legend__dash" /> {isWorst ? "Greens first, rice last" : "Rice first"}
              </span>
            </p>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Glucose after lunch eaten ${order.map((c) => c.name).join(", then ")}: peaks at ${Math.round(stats.peak)} mg/dL.`}>
              <defs>
                <clipPath id="oc-area">
                  <path d={areaD} />
                </clipPath>
                <clipPath id="oc-high">
                  <rect x="0" y="0" width={W} height={y(HIGH)} />
                </clipPath>
              </defs>
              <Axes x={x} y={y} x0={0} x1={T1} yTicks={[60, 100, 140, 180]} xTicks={(vertical ? [0, 60, 120, 180] : [0, 30, 60, 90, 120, 150, 180]).map((v) => ({ v, label: v === 0 ? "first bite" : `${v} min` }))} />
              {order.map((c, i) => (
                <g key={c.id} className="order__bite" style={{ transform: `translateX(${x(i * COURSE_MIN) - x(0)}px)` }}>
                  <line x1={x(0)} x2={x(0)} y1={y(60)} y2={y(60) - 12} />
                  <text x={x(0) + 6} y={y(60) - 4}>
                    {c.name}
                  </text>
                </g>
              ))}
              <path className="order__ghost" d={smoothPath(pts(ghost))} />
              <g clipPath="url(#oc-high)">
                <path className="order__over" d={areaD} />
              </g>
              <path className={`order__line ${served ? "is-drawn" : ""}`} pathLength={1} d={line} />
              <g clipPath="url(#oc-high)">
                <path className="order__line order__line--high" d={line} />
              </g>
              <g className="order__peak" transform={`translate(${x((T1 * peakI) / N)},${y(vals[peakI])})`}>
                <circle r="6" />
                <text y="-16" textAnchor="middle" className="mono">
                  {Math.round(vals[peakI])}
                </text>
              </g>
            </svg>
          </div>

          <dl className="order__stats" aria-live="polite">
            <div>
              <dt>Peak</dt>
              <dd>
                <span className="mono big">{Math.round(stats.peak)}</span>
                <span className="unit">mg/dL</span>
              </dd>
              <dd className={`delta ${delta < 0 ? "is-better" : ""}`}>{delta < 0 ? `−${-delta} mg/dL vs rice first` : `+${Math.round(stats.peak - ghostStats.peak)} mg/dL vs rice last`}</dd>
            </div>
            <div>
              <dt>Above 140</dt>
              <dd>
                <span className="mono big">{stats.above}</span>
                <span className="unit">min</span>
              </dd>
              <dd className="delta">{stats.above === 0 ? "Stayed in range" : "Time spent spiking"}</dd>
            </div>
            <div>
              <dt>Lowest after</dt>
              <dd>
                <span className="mono big">{Math.round(stats.dip)}</span>
                <span className="unit">mg/dL</span>
              </dd>
              <dd className="delta">{stats.dip < 80 ? "The 3 pm slump" : "No crash"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
