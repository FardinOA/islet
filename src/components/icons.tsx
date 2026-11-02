type P = { className?: string };

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function Mark({ className = "mark" }: P) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="var(--ink)" />
      <path d="M7 19.5c2.6 0 3.4-.4 4.6-2.6 1.4-2.6 2.4-6.4 4.4-6.4s2.6 5.6 4.4 7.6c1 1.1 2.2 1.4 4.6 1.4" fill="none" stroke="var(--rasp)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Arrow({ className = "ico" }: P) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" {...base}>
      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" />
    </svg>
  );
}

export function Trend({ dir, className = "ico trend" }: P & { dir: "up" | "down" | "flat" }) {
  const rot = dir === "up" ? -45 : dir === "down" ? 45 : 0;
  return (
    <svg className={className} viewBox="0 0 20 20" aria-label={dir === "up" ? "rising" : dir === "down" ? "falling" : "steady"} role="img" {...base} strokeWidth={2.2}>
      <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: "10px 10px", transition: "transform .6s var(--ease-out)" }}>
        <path d="M4 10h11M11 5.5 15.5 10 11 14.5" />
      </g>
    </svg>
  );
}

export function Grip({ className = "ico" }: P) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
      {[6, 10, 14].map((y) => [7, 13].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" />))}
    </svg>
  );
}

export function Chevron({ className = "ico", dir = "right" }: P & { dir?: "left" | "right" | "up" | "down" }) {
  const rot = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" {...base} style={{ transform: `rotate(${rot}deg)` }}>
      <path d="m8 5 5 5-5 5" />
    </svg>
  );
}

export function Check({ className = "ico" }: P) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" {...base} strokeWidth={2}>
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  );
}

export function Steps({ className = "ico" }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <ellipse cx="8" cy="7.5" rx="2.8" ry="4.2" />
      <ellipse cx="8.2" cy="14.6" rx="2" ry="1.7" />
      <g opacity="0.55">
        <ellipse cx="16" cy="10.5" rx="2.8" ry="4.2" />
        <ellipse cx="15.8" cy="17.6" rx="2" ry="1.7" />
      </g>
    </svg>
  );
}

export function NavIcon({ name, className = "ico" }: P & { name: "today" | "meals" | "report" | "coach" | "settings" }) {
  const d = {
    today: "M3.5 13.5c2.2 0 2.8-1 3.8-3.4 1-2.4 1.8-5.1 3.2-5.1s2.1 4.2 3.4 6.1c.8 1.2 1.8 1.6 3.6 1.6",
    meals: "M6 3v6a2 2 0 0 0 4 0V3M8 9v8M14.5 17V3c2 1 3 3.2 3 6.2h-3",
    report: "M3.5 16.5h13M5.5 13V9M9 13V5M12.5 13V8M16 13V10.5",
    coach: "M4 5.5A2.5 2.5 0 0 1 6.5 3h7A2.5 2.5 0 0 1 16 5.5v5A2.5 2.5 0 0 1 13.5 13H9l-3.5 3v-3h0A2.5 2.5 0 0 1 4 10.5Z",
    settings: "M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM10 2.8v2M10 15.2v2M2.8 10h2M15.2 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M4.9 15.1l1.4-1.4M13.7 6.3l1.4-1.4",
  }[name];
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" {...base}>
      <path d={d} />
    </svg>
  );
}
