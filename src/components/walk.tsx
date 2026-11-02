"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HIGH, WALK_MAX, WALK_START, smoothPath, summarise, walkAt } from "@/lib/glucose";
import { Axes, scale, useCompact, useMorph } from "./chart";
import { Steps } from "./icons";
import { Headline, useScrollProgress } from "./reveal";

const T1 = 180;
const N = 90;
const RING = 2 * Math.PI * 54;

const curve = (m: number) => Array.from({ length: N + 1 }, (_, i) => walkAt((T1 * i) / N, m));
function frame(compact: boolean) {
  const W = compact ? 480 : 1000;
  const H = compact ? 320 : 360;
  const x = scale(0, T1, compact ? 34 : 52, W - 12);
  const y = scale(70, 220, H - 40, 18);
  const pts = (vals: number[]): [number, number][] => vals.map((v, i) => [x((T1 * i) / N), y(v)]);
  return { W, H, x, y, pts };
}

export function Walk() {
  const [mins, setMins] = useState(0);
  const [holding, setHolding] = useState(false);
  const minsRef = useRef(0);
  const win = useRef<HTMLDivElement>(null);
  const compact = useCompact();
  const { W, H, x, y, pts } = useMemo(() => frame(compact), [compact]);

  // Holding the button walks: about seven minutes per second held.
  useEffect(() => {
    if (!holding) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      minsRef.current = Math.min(WALK_MAX, minsRef.current + ((now - last) / 1000) * 7);
      last = now;
      setMins(minsRef.current);
      if (minsRef.current < WALK_MAX) frame = requestAnimationFrame(tick);
      else setHolding(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [holding]);

  useEffect(() => {
    const up = () => setHolding(false);
    addEventListener("pointerup", up);
    addEventListener("pointercancel", up);
    return () => {
      removeEventListener("pointerup", up);
      removeEventListener("pointercancel", up);
    };
  }, []);

  const m = Math.round(mins);
  const target = useMemo(() => curve(m), [m]);
  const vals = useMorph(target, 0.2);
  const ghost = useMemo(() => curve(0), []);
  const s0 = summarise(ghost.map((v, i) => [(T1 * i) / N, v]));
  const s = summarise(target.map((v, i) => [(T1 * i) / N, v]));
  const line = smoothPath(pts(vals));
  const areaD = `${line}L${x(T1)},${H}L${x(0)},${H}Z`;
  const steps = Math.round(mins * 104);

  // The window unrolls down out of the coach's message as the section arrives.
  const unroll = useScrollProgress<HTMLDivElement>(
    (p) => {
      const el = win.current;
      if (!el) return;
      const e = 1 - Math.pow(1 - p, 3);
      el.style.clipPath = `inset(0 0 ${(1 - e) * 100}% 0 round 24px)`;
      el.style.setProperty("--lift", `${(1 - e) * -40}px`);
    },
    0.85,
    0.25,
  );

  const reset = () => {
    minsRef.current = 0;
    setMins(0);
  };

  return (
    <section className="walk stage stage--ink" id="walk" aria-labelledby="walk-title" ref={unroll}>
      <div className="wrap">
        <header className="walk__head">
          <Headline text="Walk ten minutes after dinner. Watch the spike shrink." id="walk-title" className="walk__title" />
          <p className="lead">
            Working muscles pull glucose out of your blood without waiting for insulin. A short walk soon after eating is one of the cheapest
            changes there is, and Islet shows you it working on your own dinner.
          </p>
        </header>

        <div className="walk__scene">
          <div className="coach">
            <span className="coach__face" aria-hidden="true">
              MO
            </span>
            <div className="coach__bubble">
              <p className="coach__who">
                Maya Osei, RD <span>· your coach · 19:12</span>
              </p>
              <p>Your dinners run highest of the day. Tonight, before dessert, try a loop round the block and see what it does.</p>
            </div>
          </div>

          <div className="win walk__win" ref={win}>
            <div className="walk__bar">
              <div>
                <p className="walk__meal">Dinner · Spaghetti al pomodoro</p>
                <p className="walk__sub mono">19:40 · 78 g carbs · logged by photo</p>
              </div>
              <div className="walk__reads">
                <div>
                  <span>Peak</span>
                  <b className="mono">
                    {Math.round(s.peak)}
                    <small> mg/dL</small>
                  </b>
                </div>
                <div className={m ? "is-better" : ""}>
                  <span>Change</span>
                  <b className="mono">{m ? `−${Math.round(s0.peak - s.peak)}` : "0"}</b>
                </div>
                <div>
                  <span>Above 140</span>
                  <b className="mono">
                    {s.above}
                    <small> min</small>
                  </b>
                </div>
              </div>
            </div>

            <div className="walk__body">
              <svg className="walk__chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Glucose after dinner with a ${m} minute walk: peaks at ${Math.round(s.peak)} mg/dL.`}>
                <defs>
                  <clipPath id="wk-high">
                    <rect x="0" y="0" width={W} height={y(HIGH)} />
                  </clipPath>
                </defs>
                <Axes x={x} y={y} x0={0} x1={T1} yTicks={[70, 140, 200]} xTicks={(compact ? [0, 60, 120, 180] : [0, 30, 60, 90, 120, 150, 180]).map((v) => ({ v, label: v === 0 ? "dinner" : `${v} min` }))} />
                <rect className="walk__span" x={x(WALK_START)} y={y(220)} width={Math.max(0, x(WALK_START + mins) - x(WALK_START))} height={y(70) - y(220)} />
                {m > 0 && (
                  <text className="walk__span-label" x={x(WALK_START) + 8} y={y(220) + 18}>
                    walk · {m} min
                  </text>
                )}
                <path className="order__ghost" d={smoothPath(pts(ghost))} />
                <g clipPath="url(#wk-high)">
                  <path className="order__over" d={areaD} />
                </g>
                <path className="order__line" d={line} />
                <g clipPath="url(#wk-high)">
                  <path className="order__line order__line--high" d={line} />
                </g>
              </svg>

              <div className="hold">
                <button
                  type="button"
                  className={`hold__btn ${holding ? "is-holding" : ""} ${m >= WALK_MAX ? "is-done" : ""}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (minsRef.current < WALK_MAX) setHolding(true);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                      e.preventDefault();
                      if (minsRef.current < WALK_MAX) setHolding(true);
                    }
                  }}
                  onKeyUp={() => setHolding(false)}
                  onContextMenu={(e) => e.preventDefault()}
                  aria-label={`Hold to walk. ${m} of ${WALK_MAX} minutes walked.`}
                >
                  <svg viewBox="0 0 120 120" aria-hidden="true">
                    <circle className="hold__track" cx="60" cy="60" r="54" />
                    <circle className="hold__ring" cx="60" cy="60" r="54" strokeDasharray={RING} strokeDashoffset={RING * (1 - mins / WALK_MAX)} />
                  </svg>
                  <span className="hold__inner">
                    <Steps className="hold__ico" />
                    <span>{m >= WALK_MAX ? "Done" : holding ? "Walking" : m ? "Keep going" : "Hold to walk"}</span>
                  </span>
                </button>
                <dl className="hold__count" aria-live="polite">
                  <div>
                    <dt>Minutes</dt>
                    <dd className="mono">{m}</dd>
                  </div>
                  <div>
                    <dt>Steps</dt>
                    <dd className="mono">{steps.toLocaleString("en-US")}</dd>
                  </div>
                </dl>
                <button type="button" className="hold__reset" onClick={reset} disabled={!m}>
                  Sit back down
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
