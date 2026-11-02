"use client";

import { useState } from "react";
import { Arrow, Check } from "./icons";
import { Headline, useInView } from "./reveal";

const MONTHS = [
  { name: "November", days: 30, lead: 0 }, // Nov 1, 2026 is a Sunday
  { name: "December", days: 31, lead: 2 },
  { name: "January", days: 31, lead: 5 },
];
const TOTAL = MONTHS.reduce((a, m) => a + m.days, 0);

const PLANS = [
  {
    id: "one",
    name: "One sensor",
    price: "$89",
    per: "once",
    line: "Fifteen days to learn your patterns.",
    starts: [0],
    gets: ["1 sensor, 15 days", "Your 15-day report", "The app, yours to keep", "Meal photos and scores"],
  },
  {
    id: "checkin",
    name: "Check-in",
    price: "$49",
    per: "a month",
    line: "A sensor every other month, to see if changes stick.",
    starts: [0, 61],
    gets: ["1 sensor every 2 months", "A report after each one", "Before-and-after comparisons", "Coach review of every report"],
  },
  {
    id: "always",
    name: "Always on",
    price: "$149",
    per: "a month",
    line: "Never take it off. A coach on call.",
    starts: [0, 15, 30, 45, 60, 75],
    gets: ["2 sensors a month, no gaps", "Weekly reports", "Message your coach any day", "Share live with your doctor"],
  },
];

export function Pricing() {
  const [id, setId] = useState("checkin");
  const plan = PLANS.find((p) => p.id === id)!;
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const worn = (d: number) => plan.starts.some((s) => d >= s && d < s + 15);
  const wornDays = Array.from({ length: TOTAL }, (_, d) => worn(d)).filter(Boolean).length;

  let day = 0;

  return (
    <section className="pricing" id="pricing" aria-labelledby="pricing-title">
      <div className="wrap">
        <header className="pricing__head">
          <Headline text="Wear one. Or never take it off." id="pricing-title" className="pricing__title" />
          <p className="lead">Every plan is drawn on the calendar it buys. Each sensor lasts fifteen days; pick how many of the next ninety you want covered.</p>
        </header>

        <div className="pricing__body">
          <div className="plans" role="radiogroup" aria-label="Plans">
            {PLANS.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={p.id === id} className={`plan ${p.id === id ? "is-on" : ""}`} onClick={() => setId(p.id)}>
                <span className="plan__radio" aria-hidden="true" />
                <span className="plan__text">
                  <span className="plan__name">{p.name}</span>
                  <span className="plan__line">{p.line}</span>
                </span>
                <span className="plan__price">
                  <b>{p.price}</b>
                  <small>{p.per}</small>
                </span>
              </button>
            ))}
            <p className="plans__note">Prices in USD, shipping included. HSA and FSA eligible. Cancel any time from the app.</p>
          </div>

          <div className={`cal win ${seen ? "is-seen" : ""}`} ref={ref}>
            <div className="cal__head">
              <p>
                <b className="mono">{wornDays}</b> of the next {TOTAL} days covered
              </p>
              <p className="cal__legend">
                <span>
                  <i className="cal__dot is-worn" /> Wearing a sensor
                </span>
                <span>
                  <i className="cal__dot is-start" /> New sensor
                </span>
              </p>
            </div>
            <div className="cal__months">
              {MONTHS.map((m) => (
                <div key={m.name} className="cal__month">
                  <p className="cal__name">{m.name}</p>
                  <div className="cal__grid">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <span key={i} className="cal__wd">
                        {d}
                      </span>
                    ))}
                    {Array.from({ length: m.lead }, (_, i) => (
                      <span key={`l${i}`} />
                    ))}
                    {Array.from({ length: m.days }, (_, i) => {
                      const d = day++;
                      const on = worn(d);
                      const start = plan.starts.includes(d);
                      const col = (m.lead + i) % 7;
                      return (
                        <span
                          key={i}
                          className={`cal__day ${on ? "is-worn" : ""} ${start ? "is-start" : ""} ${on && !worn(d - 1) ? "is-first" : ""} ${on && !worn(d + 1) ? "is-last" : ""} ${col === 0 ? "row-start" : ""} ${col === 6 ? "row-end" : ""}`}
                          style={{ "--d": d } as React.CSSProperties}
                        >
                          <span className="mono">{i + 1}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="cal__foot">
              <ul className="cal__gets">
                {plan.gets.map((g) => (
                  <li key={g}>
                    <Check />
                    {g}
                  </li>
                ))}
              </ul>
              <a className="btn btn--rasp" href="#start">
                Start {plan.name.toLowerCase()} · {plan.price}
                <Arrow />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
