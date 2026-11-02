"use client";

import { useEffect, useRef, useState } from "react";
import { HIGH, LOW, clock, dayAt, smoothPath } from "@/lib/glucose";
import { createPuck } from "@/lib/puck";
import { Arrow, Trend } from "./icons";

/*
  The headline is the chart. Every letter is filled up to the day's glucose
  line: ink where it is in range, raspberry where it runs above 140. The
  line reaches for the pointer, so the visitor fills the letters by hand.
  The trace ends at the sensor, which writes it; scrolling dives into the
  sensor's face until it becomes the white ground of the next section.
*/

type Layout = {
  vbW: number;
  vbH: number;
  fs: number;
  pad: number;
  lines: { text: string; y: number }[];
  span: number; // hours across the trace
  px: number; // sensor centre, viewBox units
  py: number;
  r: number;
  nowX: number;
  y85: number;
  k: number; // viewBox units per mg/dL
  axisY: number; // baseline of the hour labels
};

const DESK = ["What does lunch", "do to you?"];
const PHONE = ["What does", "lunch do", "to you?"];

function makeLayout(vbW: number, lines: string[], widths: number[]): Layout {
  const phone = vbW < 1000;
  const pad = vbW * 0.026;
  const fs = ((vbW - pad * 2) / Math.max(...widths)) * 100;
  const gap = fs * 0.9;
  const y1 = fs * 0.8;
  const ls = lines.map((text, i) => ({ text, y: y1 + i * gap }));
  const yLast = ls[ls.length - 1].y;
  const base = { vbW, fs, pad, lines: ls, y85: yLast - fs * 0.3, k: (fs * 0.62) / 55 };
  if (phone) {
    // No room beside the type: the sensor sits under it and the trace runs the full width.
    const r = vbW * 0.15;
    const top = yLast + fs * 0.24 + 56;
    return { ...base, vbH: top + r * 2.7, span: 10, px: vbW * 0.68, py: top + r * 1.3, r, nowX: vbW - pad, axisY: top - 6 };
  }
  const lastW = (widths[widths.length - 1] / 100) * fs;
  const free = vbW - pad - (pad + lastW);
  const r = Math.min(free * 0.3, fs * 0.58);
  const px = pad + lastW + free * 0.6;
  const vbH = yLast + fs * 0.24 + 56;
  return { ...base, vbH, span: 18, px, py: yLast - fs * 0.36, r, nowX: px - r * 1.55, axisY: vbH - 14 };
}

// Estimated widths (per 100 units of font size), used until the real font is measured.
const INITIAL = makeLayout(1600, DESK, [660, 440]);

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function Hero() {
  const [L, setL] = useState<Layout>(INITIAL);
  const LRef = useRef(L);
  const section = useRef<HTMLElement>(null);
  const stick = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const white = useRef<HTMLDivElement>(null);
  const area = useRef<SVGPathElement>(null);
  const line = useRef<SVGPathElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const tipText = useRef<HTMLSpanElement>(null);
  const nowVal = useRef<HTMLSpanElement>(null);
  const hours = useRef<SVGGElement>(null);
  const [trend, setTrend] = useState<"up" | "down" | "flat">("up");

  // Measure the headline in its real font and fit it to the width.
  useEffect(() => {
    let alive = true;
    const measure = () => {
      const el = svg.current;
      if (!el || !alive) return;
      const phone = innerWidth < 720;
      const lines = phone ? PHONE : DESK;
      const ns = "http://www.w3.org/2000/svg";
      const wrap = document.createElementNS(ns, "g");
      wrap.setAttribute("class", "hero__glyphs");
      const probe = document.createElementNS(ns, "text");
      probe.setAttribute("font-size", "100");
      wrap.appendChild(probe);
      el.appendChild(wrap);
      const widths = lines.map((t) => {
        probe.textContent = t;
        return probe.getBBox().width;
      });
      wrap.remove();
      const next = makeLayout(phone ? 800 : 1600, lines, widths);
      LRef.current = next;
      setL(next);
    };
    document.fonts.ready.then(measure);
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    addEventListener("resize", onResize);
    return () => {
      alive = false;
      removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const host = stick.current!;
    const ptr = { x: 0, y: 0, inside: false };
    const bump = { x: 0, amp: 0, presence: 0 };
    const look = { x: 0, y: 0, tx: 0, ty: 0 };
    let puck: ReturnType<typeof createPuck> | null = null;
    let vw = 0;
    let vh = 0;
    const start = performance.now();
    const t0 = 14.1;

    const onMove = (e: PointerEvent) => {
      const el = svg.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const s = LRef.current.vbW / r.width;
      ptr.x = (e.clientX - r.left) * s;
      ptr.y = (e.clientY - r.top) * s;
      ptr.inside = ptr.x > 0 && ptr.x < LRef.current.nowX && ptr.y > -60 && ptr.y < LRef.current.vbH + 40;
      look.tx = (e.clientX / innerWidth) * 2 - 1;
      look.ty = (e.clientY / innerHeight) * 2 - 1;
    };
    const onLeave = () => (ptr.inside = false);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onMove);
    host.addEventListener("pointerleave", onLeave);

    const size = () => {
      vw = host.clientWidth;
      vh = host.clientHeight;
      puck?.resize(vw, vh);
    };
    if (canvas.current) {
      try {
        const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-inter-tight").trim() || "sans-serif";
        puck = createPuck(canvas.current, fam);
      } catch {
        canvas.current.dataset.gl = "off";
      }
    }
    size();
    const ro = new ResizeObserver(size);
    ro.observe(host);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(section.current!);

    let lastEmit = 0;
    let lastTrend = "";
    let frame = 0;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible) return;
      const L = LRef.current;
      const nowH = reduce ? t0 : t0 + (now - start) / 6000;
      const hourAt = (x: number) => nowH - L.span * (1 - x / L.nowX);
      const yOf = (v: number) => L.y85 - (v - 85) * L.k;
      const vOf = (y: number) => 85 + (L.y85 - y) / L.k;

      // The line reaches for the pointer.
      if (ptr.inside) {
        bump.x = bump.presence < 0.05 ? ptr.x : lerp(bump.x, ptr.x, 0.22);
        const want = Math.max(-30, Math.min(190, vOf(ptr.y) - dayAt(hourAt(bump.x))));
        bump.amp = lerp(bump.amp, want, 0.16);
        bump.presence = lerp(bump.presence, 1, 0.12);
      } else {
        bump.amp = lerp(bump.amp, 0, 0.07);
        bump.presence = lerp(bump.presence, 0, 0.08);
      }
      const sigma = L.vbW * 0.045;
      const at = (x: number) => dayAt(hourAt(x)) + bump.amp * Math.exp(-((x - bump.x) ** 2) / (2 * sigma * sigma));

      const pts: [number, number][] = [];
      for (let i = 0; i <= 150; i++) {
        const x = (L.nowX * i) / 150;
        pts.push([x, yOf(at(x))]);
      }
      const d = smoothPath(pts);
      line.current?.setAttribute("d", d);
      area.current?.setAttribute("d", `${d}L${L.nowX},${L.vbH + 40}L0,${L.vbH + 40}Z`);

      // Hour ticks slide left with the trace.
      const g = hours.current;
      if (g) {
        const first = Math.ceil(nowH - L.span);
        const every = L.span > 12 ? 2 : 3;
        let html = "";
        for (let hh = first; hh < nowH - 0.4; hh++) {
          if (((hh % every) + every) % every) continue;
          const tx = L.nowX * (1 - (nowH - hh) / L.span);
          html += `<line x1="${tx.toFixed(1)}" x2="${tx.toFixed(1)}" y1="${(L.axisY - 32).toFixed(1)}" y2="${(L.axisY - 24).toFixed(1)}"/><text x="${tx.toFixed(1)}" y="${L.axisY.toFixed(1)}">${clock(hh)}</text>`;
        }
        g.innerHTML = html;
      }

      // Reading under the pointer.
      if (tip.current && tipText.current) {
        const show = bump.presence > 0.35;
        tip.current.style.opacity = show ? "1" : "0";
        if (show) {
          const v = at(bump.x);
          tip.current.style.left = `${(bump.x / L.vbW) * 100}%`;
          tip.current.style.top = `${(yOf(v) / L.vbH) * 100}%`;
          tip.current.dataset.high = v > HIGH ? "1" : "0";
          tipText.current.textContent = `${clock(hourAt(bump.x))}  ·  ${Math.round(v)} mg/dL`;
        }
      }

      // The sensor's own reading, and the header's copy of it.
      const nowV = dayAt(nowH);
      const slope = nowV - dayAt(nowH - 0.25);
      const tr = slope > 5 ? "up" : slope < -5 ? "down" : "flat";
      if (nowVal.current) nowVal.current.textContent = String(Math.round(nowV));
      if (tr !== lastTrend) {
        lastTrend = tr;
        setTrend(tr);
      }
      if (now - lastEmit > 1000) {
        lastEmit = now;
        dispatchEvent(new CustomEvent("islet:now", { detail: { v: Math.round(nowV), trend: tr } }));
      }

      // Dive.
      const sr = section.current!.getBoundingClientRect();
      const run = sr.height - vh;
      const p = run > 10 ? Math.min(1, Math.max(0, -sr.top / run)) : 0;
      if (body.current) {
        body.current.style.opacity = String(1 - smooth(0.03, 0.32, p));
        body.current.style.transform = `translate3d(0, ${-p * 90}px, 0) scale(${1 - smooth(0, 0.4, p) * 0.04})`;
      }
      if (white.current) white.current.style.opacity = String(smooth(0.82, 0.97, p));

      look.x = lerp(look.x, look.tx, 0.08);
      look.y = lerp(look.y, look.ty, 0.08);
      const el = svg.current;
      if (puck && el) {
        const r = el.getBoundingClientRect();
        const hr = host.getBoundingClientRect();
        const s = r.width / L.vbW;
        const sx = r.left - hr.left + L.px * s;
        const sy = r.top - hr.top + L.py * s + p * 90;
        const r0 = L.r * s;
        const e = smooth(0.06, 0.95, p);
        const rEnd = (Math.hypot(vw, vh) / 2 / 0.86) * 1.25;
        const c = smooth(0.06, 0.6, p);
        puck.render({
          x: lerp(sx, vw / 2, c),
          y: lerp(sy, vh / 2, c),
          r: r0 * Math.pow(rEnd / r0, e * e),
          tilt: smooth(0.04, 0.55, p),
          lookX: look.x,
          lookY: look.y,
          spin: reduce ? -0.2 : -0.2 + Math.sin((now - start) / 2600) * 0.16 * (1 - p),
          shadow: 1 - smooth(0, 0.3, p),
        });
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onMove);
      host.removeEventListener("pointerleave", onLeave);
      ro.disconnect();
      io.disconnect();
      puck?.dispose();
    };
  }, []);

  const yOf = (v: number) => L.y85 - (v - 85) * L.k;
  const glyphs = (cls: string) => (
    <g className={cls}>
      {L.lines.map((l) => (
        <text key={l.text} x={L.pad} y={l.y} fontSize={L.fs}>
          {l.text}
        </text>
      ))}
    </g>
  );

  return (
    <section className="hero" id="top" ref={section} aria-labelledby="hero-title">
      <div className="hero__stick" ref={stick}>
        <canvas className="hero__puck" ref={canvas} aria-hidden="true" />
        <div className="hero__body" ref={body}>
          <h1 id="hero-title" className="sr">
            What does lunch do to you?
          </h1>
          <div className="hero__type">
            <svg ref={svg} viewBox={`0 0 ${L.vbW} ${L.vbH}`} aria-hidden="true">
              <defs>
                <clipPath id="hz-area" clipPathUnits="userSpaceOnUse">
                  <path ref={area} />
                </clipPath>
                <clipPath id="hz-high" clipPathUnits="userSpaceOnUse">
                  <rect x="0" y="-400" width={L.nowX} height={yOf(HIGH) + 400} />
                </clipPath>
              </defs>
              <rect className="hero__band" x="0" y={yOf(HIGH)} width={L.nowX} height={yOf(LOW) - yOf(HIGH)} />
              <line className="hero__limit" x1="0" x2={L.nowX} y1={yOf(HIGH)} y2={yOf(HIGH)} />
              {glyphs("hero__glyphs hero__glyphs--ghost")}
              <g clipPath="url(#hz-area)">{glyphs("hero__glyphs hero__glyphs--ink")}</g>
              <g clipPath="url(#hz-high)">
                <g clipPath="url(#hz-area)">{glyphs("hero__glyphs hero__glyphs--high")}</g>
              </g>
              <path className="hero__trace" ref={line} />
              <text className="hero__axis" x={L.vbW < 1000 ? L.nowX : L.nowX + 10} y={L.vbW < 1000 ? yOf(HIGH) - 10 : yOf(HIGH) + 5} textAnchor={L.vbW < 1000 ? "end" : "start"}>
                140
              </text>
              <text className="hero__axis" x={L.vbW < 1000 ? L.nowX : L.nowX + 10} y={L.vbW < 1000 ? yOf(LOW) + 24 : yOf(LOW) + 5} textAnchor={L.vbW < 1000 ? "end" : "start"}>
                70
              </text>
              <g className="hero__hours" ref={hours} />
            </svg>
            <div
              className="hero__puck-fallback"
              aria-hidden="true"
              style={{ left: `${(L.px / L.vbW) * 100}%`, top: `${(L.py / L.vbH) * 100}%`, width: `${((L.r * 2) / L.vbW) * 100}%` }}
            />
            <div className="hero__tip" ref={tip} aria-hidden="true">
              <span ref={tipText} />
            </div>
            <div className="hero__now" style={{ left: `${(L.px / L.vbW) * 100}%`, top: `${((L.py + L.r * 1.12) / L.vbH) * 100}%` }}>
              <span className="hero__now-label">Now</span>
              <span className="hero__now-val mono">
                <span ref={nowVal}>112</span>
                <small>mg/dL</small>
              </span>
              <Trend dir={trend} />
            </div>
          </div>
          <div className="hero__foot">
            <p className="hero__lead">
              Islet is a fifteen-day glucose sensor and a coach in your phone. Wear it on your arm, eat the way you already do, and find out which
              meals keep you steady and which ones drop you at 3 pm.
            </p>
            <div className="hero__cta">
              <a className="btn btn--rasp" href="#pricing">
                Get a sensor · $89
                <Arrow />
              </a>
              <a className="link" href="#report">
                See a 15-day report
              </a>
            </div>
            <p className="hero__key">
              <span>
                <i className="key key--ink" /> In range
              </span>
              <span>
                <i className="key key--rasp" /> Above 140 mg/dL
              </span>
              <span className="hero__key-hint">Move through the letters. The line follows you.</span>
            </p>
          </div>
        </div>
        <div className="hero__white" ref={white} aria-hidden="true" />
      </div>
    </section>
  );
}
