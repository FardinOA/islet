import { Mark } from "./icons";

const COLS = [
  {
    h: "Product",
    l: [
      ["Meal order", "#order"],
      ["Your response", "#people"],
      ["Walk it off", "#walk"],
      ["15-day report", "#report"],
      ["Pricing", "#pricing"],
    ],
  },
  {
    h: "Company",
    l: [
      ["Our coaches", "#walk"],
      ["The science", "#report"],
      ["Careers", "#top"],
    ],
  },
  {
    h: "Help",
    l: [
      ["Questions", "#questions"],
      ["Applying a sensor", "#questions"],
      ["Contact", "#start"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__top">
          <div className="foot__brand">
            <a className="brand" href="#top" aria-label="Islet, back to top">
              <Mark />
              <span className="brand__name">islet</span>
            </a>
            <p>A glucose sensor and a coach, for people who want to know what their food does to them.</p>
          </div>
          <nav className="foot__cols" aria-label="Footer">
            {COLS.map((c) => (
              <div key={c.h}>
                <h3>{c.h}</h3>
                {c.l.map(([label, href]) => (
                  <a key={label} href={href}>
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <p className="foot__legal">
          Islet is a wellness product. It is not intended to diagnose, treat or manage diabetes or any other condition. Talk to a clinician
          before changing medication or diet.
        </p>
        <div className="foot__bottom">
          <span>© 2026 Islet. Sample brand; people, readings and prices are placeholder.</span>
          <span>
            Created by{" "}
            <a href="https://fardin.website" target="_blank" rel="noopener">
              Fardin Omor Afnan
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
