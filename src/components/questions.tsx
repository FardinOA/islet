"use client";

import { useState } from "react";
import { Mark, Trend } from "./icons";
import { Headline, useInView } from "./reveal";

const GROUPS = [
  {
    id: "wear",
    name: "Wearing it",
    qs: [
      ["Does putting it on hurt?", "Most people feel a click and nothing after. A short, flexible filament sits just under the skin in the fluid between cells, not in a vein. The applicator does it in under a second."],
      ["Can I shower, swim and train with it?", "Yes. It's water-resistant to 1 m for 30 minutes and the patch is made to hold through sweat. For contact sports, add the overpatch that comes in the box."],
      ["Where does it go?", "The back of your upper arm. Switch arms between sensors so the skin gets a rest."],
      ["What if it falls off early?", "Tell the app. If a sensor doesn't last its fifteen days, we send a new one free."],
    ],
  },
  {
    id: "read",
    name: "Accuracy",
    qs: [
      ["How accurate is it?", "On average, readings land within about 9% of a lab blood test. Islet is built to show patterns across days, not to make one-off medical decisions."],
      ["Why does it lag a finger prick?", "Glucose reaches the fluid under your skin five to ten minutes after it reaches your blood. The trend is what matters, and Islet draws it every minute."],
      ["Do I need to calibrate it?", "No. Every sensor is calibrated at the factory. Put it on, pair it, and wait an hour for it to warm up."],
    ],
  },
  {
    id: "data",
    name: "Your data",
    qs: [
      ["Who can see my readings?", "You, and anyone you invite: a coach, a partner, your doctor. We never sell health data or use it for ads."],
      ["Can I take my data with me?", "Any time. Export a CSV or the PDF report, and sync both ways with Apple Health and Health Connect."],
      ["Is this for diabetes?", "No. Islet is a wellness product and isn't for diagnosing or managing diabetes. If you have diabetes, ask your clinician about a prescription CGM."],
    ],
  },
  {
    id: "bill",
    name: "Billing",
    qs: [
      ["Can I cancel?", "Any time, from the app, in two taps. Sensors already shipped are yours to use."],
      ["Can I use my HSA or FSA card?", "Yes, in the US. Use it at checkout like any other card, and we email an itemised receipt."],
    ],
  },
];

const ago = ["now", "2m ago", "9m ago", "14m ago"];

export function Questions() {
  const [group, setGroup] = useState<string | null>("wear");
  const [open, setOpen] = useState<string | null>(null);
  const [ref, seen] = useInView<HTMLDivElement>(0.35);
  const clock = "9:41";

  return (
    <section className="questions stage stage--grey" id="questions" aria-labelledby="questions-title">
      <div className="wrap questions__wrap">
        <header className="questions__head">
          <Headline text="Questions, the way Islet would answer them." id="questions-title" className="questions__title" />
          <p className="lead">They arrive as notifications. Tap a stack to open it, then tap a question for the answer.</p>
          <ul className="questions__topics">
            {GROUPS.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className={group === g.id ? "is-on" : ""}
                  onClick={() => {
                    setGroup(g.id);
                    setOpen(null);
                  }}
                >
                  {g.name}
                  <span className="mono">{g.qs.length}</span>
                </button>
              </li>
            ))}
          </ul>
        </header>

        <div className={`phone ${seen ? "is-seen" : ""}`} ref={ref}>
          <div className="phone__screen">
            <span className="phone__island" aria-hidden="true" />
            <div className="phone__status mono" aria-hidden="true">
              <span>{clock}</span>
              <span className="phone__sig">
                <i />
                <i />
                <i />
                <i />
              </span>
            </div>
            <p className="phone__date">Monday 2 November</p>
            <p className="phone__time" aria-hidden="true">
              {clock}
            </p>
            <div className="widget" aria-label="Islet widget: 104 mg/dL, steady">
              <Mark className="widget__mark" />
              <span className="widget__val mono">104</span>
              <span className="widget__unit">
                mg/dL
                <br />
                steady
              </span>
              <Trend dir="flat" className="ico widget__trend" />
              <svg className="widget__spark" viewBox="0 0 80 28" aria-hidden="true">
                <path d="M0 20c8 0 10-1 14-4s6-12 12-12 8 9 13 12 9 4 14 4 10-2 14-3 9 0 13 0" />
              </svg>
            </div>

            <div className="notes" data-lenis-prevent>
              {GROUPS.map((g, gi) => {
                const expanded = group === g.id;
                return (
                  <div key={g.id} className={`stack ${expanded ? "is-open" : ""}`} style={{ "--g": gi } as React.CSSProperties}>
                    {expanded && (
                      <div className="stack__head">
                        <span>{g.name}</span>
                        <button type="button" onClick={() => setGroup(null)}>
                          Show less
                        </button>
                      </div>
                    )}
                    {expanded ? (
                      g.qs.map(([q, a], qi) => {
                        const key = `${g.id}${qi}`;
                        const isOpen = open === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`note ${isOpen ? "is-open" : ""}`}
                            style={{ "--q": qi } as React.CSSProperties}
                            aria-expanded={isOpen}
                            onClick={() => setOpen(isOpen ? null : key)}
                          >
                            <span className="note__app">
                              <Mark className="note__icon" />
                              ISLET
                              <span className="note__time">{ago[qi] ?? "1h ago"}</span>
                            </span>
                            <span className="note__q">{q}</span>
                            <span className="note__a">
                              <span>{a}</span>
                            </span>
                            {!isOpen && <span className="note__hint">Tap to read the answer</span>}
                          </button>
                        );
                      })
                    ) : (
                      <button type="button" className="note note--stacked" onClick={() => (setGroup(g.id), setOpen(null))} aria-label={`${g.name}: ${g.qs.length} questions. Open stack.`}>
                        <span className="note__app">
                          <Mark className="note__icon" />
                          ISLET · {g.name.toUpperCase()}
                          <span className="note__time">{ago[gi]}</span>
                        </span>
                        <span className="note__q">{g.qs[0][0]}</span>
                        <span className="note__more">
                          {g.qs.length - 1} more {g.qs.length - 1 === 1 ? "question" : "questions"}
                        </span>
                        <span className="note__layer note__layer--1" aria-hidden="true" />
                        <span className="note__layer note__layer--2" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="phone__home" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
