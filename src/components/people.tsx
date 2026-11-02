"use client";

import { useMemo, useRef, useState } from "react";
import { HIGH, response, smoothPath } from "@/lib/glucose";
import { scale, useMorph } from "./chart";
import { Arrow } from "./icons";
import { Headline, useScrollProgress } from "./reveal";

type Food = { id: string; name: string; serving: string; kcal: number; fat: number; carbs: number; fibre: number; sugars: number; protein: number };

const FOODS: Food[] = [
  { id: "banana", name: "Banana", serving: "1 medium (118 g)", kcal: 105, fat: 0.4, carbs: 27, fibre: 3, sugars: 14, protein: 1.3 },
  { id: "toast", name: "Sourdough toast", serving: "2 slices (96 g)", kcal: 250, fat: 1.6, carbs: 49, fibre: 2, sugars: 2, protein: 10 },
  { id: "rice", name: "White rice", serving: "1 cup cooked (158 g)", kcal: 205, fat: 0.4, carbs: 45, fibre: 0.6, sugars: 0, protein: 4.3 },
  { id: "latte", name: "Oat-milk latte", serving: "1 grande (473 ml)", kcal: 190, fat: 7, carbs: 27, fibre: 2, sugars: 17, protein: 3 },
  { id: "dates", name: "Medjool dates", serving: "2 dates (48 g)", kcal: 133, fat: 0.1, carbs: 36, fibre: 3.2, sugars: 32, protein: 0.9 },
];

const PEOPLE = [
  { name: "Ana", age: 34, trait: "Runs 5k, desk job", base: 84, peakAt: 38, hue: "#f1e4a6", rise: { banana: 22, toast: 48, rice: 66, latte: 30, dates: 34 } },
  { name: "Theo", age: 41, trait: "Works night shifts", base: 92, peakAt: 52, hue: "#fde4eb", rise: { banana: 71, toast: 29, rice: 50, latte: 58, dates: 66 } },
  { name: "Priya", age: 29, trait: "Vegetarian, lifts", base: 80, peakAt: 44, hue: "#e2efe6", rise: { banana: 38, toast: 63, rice: 40, latte: 22, dates: 27 } },
  { name: "Sam", age: 52, trait: "Sleeps six hours", base: 96, peakAt: 48, hue: "#e8e6e0", rise: { banana: 54, toast: 72, rice: 88, latte: 46, dates: 49 } },
] as const;

const T1 = 150;
const N = 60;
const W = 320;
const H = 150;
const x = scale(0, T1, 4, W - 4);
const y = scale(70, 200, H - 6, 6);
const DECK = [-7, -2.5, 2.5, 7];

function Label({ f }: { f: Food }) {
  return (
    <div className="label">
      <p className="label__title">Nutrition Facts</p>
      <p className="label__food">{f.name}</p>
      <p className="label__row label__row--rule">
        <span>Serving size</span>
        <b>{f.serving}</b>
      </p>
      <p className="label__cal">
        <span>Calories</span>
        <b>{f.kcal}</b>
      </p>
      <p className="label__row">
        <b>Total Fat</b>
        <span>{f.fat} g</span>
      </p>
      <p className="label__row label__row--hot">
        <b>Total Carbohydrate</b>
        <span>{f.carbs} g</span>
      </p>
      <p className="label__row label__row--in">
        <span>Dietary Fiber</span>
        <span>{f.fibre} g</span>
      </p>
      <p className="label__row label__row--in">
        <span>Total Sugars</span>
        <span>{f.sugars} g</span>
      </p>
      <p className="label__row label__row--end">
        <b>Protein</b>
        <span>{f.protein} g</span>
      </p>
    </div>
  );
}

export function People() {
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState<string | null>(null);
  const food = FOODS[idx];
  const grid = useRef<HTMLDivElement>(null);

  const next = () => {
    if (leaving) return;
    setLeaving(food.id);
    setIdx((i) => (i + 1) % FOODS.length);
    setTimeout(() => setLeaving(null), 640);
  };

  const target = useMemo(
    () => PEOPLE.flatMap((p) => Array.from({ length: N + 1 }, (_, i) => p.base + response((T1 * i) / N, p.rise[food.id as keyof typeof p.rise], p.peakAt))),
    [food.id],
  );
  const flat = useMorph(target, 0.12);
  const rises = PEOPLE.map((p) => p.rise[food.id as keyof typeof p.rise]);
  const max = Math.max(...rises);
  const min = Math.min(...rises);

  // The member cards are dealt from a deck in the middle of the grid as the section scrolls in.
  const dealRef = useScrollProgress<HTMLDivElement>(
    (p) => {
      const g = grid.current;
      if (!g) return;
      const e = 1 - Math.pow(1 - p, 3);
      const cards = Array.from(g.children) as HTMLElement[];
      const gw = g.clientWidth;
      const gh = g.clientHeight;
      cards.forEach((c, i) => {
        if (getComputedStyle(g).gridTemplateColumns.split(" ").length < 2) {
          c.style.transform = "";
          return;
        }
        const dx = gw / 2 - (c.offsetLeft + c.offsetWidth / 2);
        const dy = gh / 2 - (c.offsetTop + c.offsetHeight / 2) + i * -4;
        c.style.transform = `translate3d(${dx * (1 - e)}px, ${dy * (1 - e)}px, 0) rotate(${DECK[i] * (1 - e)}deg)`;
        c.style.zIndex = String(10 - i);
      });
    },
    1,
    0.45,
  );

  return (
    <section className="people stage stage--butter" id="people" aria-labelledby="people-title">
      <div className="wrap">
        <header className="people__head">
          <Headline text="Same banana. Four different answers." id="people-title" className="people__title" />
          <p className="lead">
            The internet will tell you what&rsquo;s healthy. Your blood will tell you what&rsquo;s healthy for you. Flip the label and compare four
            members on one scale.
          </p>
        </header>

        <div className="people__body" ref={dealRef}>
          <div className="labels">
            <div className="labels__stack" aria-live="polite">
              {FOODS.map((f, k) => {
                const pos = (k - idx + FOODS.length) % FOODS.length;
                return (
                  <button
                    key={f.id}
                    type="button"
                    className={`labels__card ${leaving === f.id ? "is-leaving" : ""}`}
                    data-pos={Math.min(pos, 3)}
                    style={{ "--pos": Math.min(pos, 3), zIndex: leaving === f.id ? undefined : 10 - pos } as React.CSSProperties}
                    tabIndex={pos === 0 ? 0 : -1}
                    aria-hidden={pos !== 0}
                    aria-label={pos === 0 ? `${f.name} nutrition label. Show the next food.` : undefined}
                    onClick={pos === 0 ? next : undefined}
                  >
                    <Label f={f} />
                  </button>
                );
              })}
            </div>
            <button type="button" className="labels__next" onClick={next}>
              Next label: {FOODS[(idx + 1) % FOODS.length].name}
              <Arrow />
            </button>
          </div>

          <div className="members" ref={grid}>
            {PEOPLE.map((p, pi) => {
              const vals = flat.slice(pi * (N + 1), (pi + 1) * (N + 1));
              const d = smoothPath(vals.map((v, i) => [x((T1 * i) / N), y(v)]));
              const rise = rises[pi];
              const peak = p.base + rise;
              const tag = rise === max ? "Biggest rise" : rise === min ? "Smallest rise" : null;
              return (
                <article key={p.name} className="member">
                  <header className="member__head">
                    <span className="member__face" style={{ background: p.hue }}>
                      {p.name[0]}
                    </span>
                    <div>
                      <h3>
                        {p.name}, {p.age}
                      </h3>
                      <p>{p.trait}</p>
                    </div>
                    {tag && <span className={`member__tag ${rise === max ? "is-max" : ""}`}>{tag}</span>}
                  </header>
                  <div className="member__read">
                    <span className={`mono member__rise ${peak > HIGH ? "is-high" : ""}`}>+{rise}</span>
                    <span className="member__unit">
                      mg/dL rise
                      <br />
                      peak {peak} at {p.peakAt} min
                    </span>
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} className="member__chart" role="img" aria-label={`${p.name}: rises ${rise} mg/dL after ${food.name}`}>
                    <rect className="axes__band" x={x(0)} y={y(140)} width={x(T1) - x(0)} height={y(70) - y(140)} />
                    <line className="axes__limit" x1={x(0)} x2={x(T1)} y1={y(140)} y2={y(140)} />
                    <path className={`member__line ${peak > HIGH ? "is-high" : ""}`} d={d} />
                  </svg>
                  <div className="member__axis mono">
                    <span>0</span>
                    <span>1 h</span>
                    <span>2 h</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <p className="foot-note">
          Illustrative member responses on one shared scale (70–200 mg/dL). Large person-to-person differences in response to the same food are
          well documented (Zeevi et al., <i>Cell</i>, 2015).
        </p>
      </div>
    </section>
  );
}
