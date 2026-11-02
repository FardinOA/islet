"use client";

import { useEffect, useState } from "react";
import { Mark, Trend } from "./icons";

const LINKS = [
  ["Order", "#order"],
  ["People", "#people"],
  ["Walk", "#walk"],
  ["Report", "#report"],
  ["Pricing", "#pricing"],
  ["FAQ", "#questions"],
];

/** Flat bar. Its right side carries the hero sensor's live reading next to the one action. */
export function Nav() {
  const [solid, setSolid] = useState(false);
  const [now, setNow] = useState<{ v: number; trend: "up" | "down" | "flat" }>({ v: 112, trend: "up" });

  useEffect(() => {
    const onScroll = () => setSolid(scrollY > 24);
    const onNow = (e: Event) => setNow((e as CustomEvent).detail);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("islet:now", onNow);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("islet:now", onNow);
    };
  }, []);

  return (
    <header className={`nav ${solid ? "is-solid" : ""}`}>
      <a className="brand" href="#top" aria-label="Islet, back to top">
        <Mark />
        <span className="brand__name">islet</span>
      </a>
      <nav className="nav__links" aria-label="Sections">
        {LINKS.map(([l, h]) => (
          <a key={h} href={h}>
            {l}
          </a>
        ))}
      </nav>
      <div className="nav__end">
        <span className="nav__read" title="Live reading from the sensor in the hero (demo)">
          <span className="mono">{now.v}</span>
          <small>mg/dL</small>
          <Trend dir={now.trend} />
        </span>
        <a className="btn btn--ink btn--sm" href="#pricing">
          Get a sensor
        </a>
      </div>
    </header>
  );
}
