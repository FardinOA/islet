"use client";

import { Fragment, useEffect, useRef, useState, type RefObject } from "react";

/** True once the element has come into view (and stays true). */
export function useInView<T extends Element>(threshold = 0.25): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}

/** Calls `fn(progress)` every frame while the element is near the viewport. Progress runs 0 → 1 as its top travels from `from` to `to` (fractions of the viewport height). */
export function useScrollProgress<T extends HTMLElement>(fn: (p: number, el: T) => void, from = 0.9, to = 0.3) {
  const ref = useRef<T>(null);
  const cb = useRef(fn);
  useEffect(() => {
    cb.current = fn;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cb.current(1, el);
      return;
    }
    let near = false;
    const io = new IntersectionObserver(([e]) => (near = e.isIntersecting), { rootMargin: "20% 0px" });
    io.observe(el);
    let frame = requestAnimationFrame(function tick() {
      frame = requestAnimationFrame(tick);
      if (!near) return;
      const top = el.getBoundingClientRect().top / innerHeight;
      cb.current(Math.min(1, Math.max(0, (from - top) / (from - to))), el);
    });
    cb.current(0, el);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, [from, to]);
  return ref;
}

/**
  Section headline. A short glucose trace draws beneath it from left to right,
  and each word rises as the trace passes under it.
*/
export function Headline({ text, id, as: Tag = "h2", className = "" }: { text: string; id?: string; as?: "h2" | "h3"; className?: string }) {
  const [ref, seen] = useInView<HTMLHeadingElement>(0.6);
  const words = text.split(" ");
  return (
    <Tag ref={ref} id={id} className={`h2 hl ${seen ? "in" : ""} ${className}`} style={{ "--n": words.length } as React.CSSProperties}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="hl__w" style={{ "--i": i } as React.CSSProperties}>
            <span>{w}</span>
          </span>{" "}
        </Fragment>
      ))}
      <svg className="hl__trace" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength={1} d="M0 18C60 18 80 17 110 16S150 4 180 4s40 13 70 14 50-2 80-2 40 2 70 2" />
      </svg>
    </Tag>
  );
}
