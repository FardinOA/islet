"use client";

import { useEffect, useState } from "react";
import { Arrow } from "./icons";
import { Headline, useInView } from "./reveal";

export function Close() {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  const [day, setDay] = useState(0);
  const [sent, setSent] = useState(false);

  // The sensor's fifteen days pass, one dot at a time, ending on the report.
  useEffect(() => {
    if (!seen) return;
    const step = matchMedia("(prefers-reduced-motion: reduce)").matches ? 15 : 1;
    const id = setInterval(() => setDay((d) => Math.min(15, d + step)), 150);
    return () => clearInterval(id);
  }, [seen]);

  return (
    <section className="close stage stage--ink" id="start" aria-labelledby="close-title">
      <div className="wrap close__wrap">
        <Headline text="Fifteen days from now, you'll know." id="close-title" className="close__title" />

        <div className="life" ref={ref} aria-label={`Day ${day} of 15`}>
          <ol className="life__days">
            {Array.from({ length: 15 }, (_, i) => (
              <li key={i} className={`${i < day ? "is-on" : ""} ${i === 14 && day >= 15 ? "is-done" : ""}`}>
                <span className="mono">{i + 1}</span>
              </li>
            ))}
          </ol>
          <p className="life__label mono">{day >= 15 ? "Day 15 · your report is ready" : day ? `Day ${day} · recording` : "Day 0 · sensor on"}</p>
        </div>

        <form
          className="close__form"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label className="sr" htmlFor="close-email">
            Email
          </label>
          <input id="close-email" type="email" required placeholder="you@email.com" autoComplete="email" disabled={sent} />
          <button className="btn btn--rasp" type="submit" disabled={sent}>
            {sent ? "Sensor reserved" : "Get my sensor · $89"}
            {!sent && <Arrow />}
          </button>
        </form>
        <p className="close__fine">
          {sent ? "Demo form: nothing was sent. Connect your own handler before launch." : "Ships in two days. Free returns on unopened sensors."} Islet is a wellness product,
          not for diagnosing or managing diabetes.
        </p>
      </div>
    </section>
  );
}
