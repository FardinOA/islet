# Islet

A landing-page template for a sample brand: a fifteen-day glucose sensor with a coach in the app, for people who want to know what their food does to them.

Every section is a different way your blood answers a meal, and every curve on the page comes from one small glucose model (`src/lib/glucose.ts`), so nothing is a drawn illustration.

Built with Next.js 16, React 19, Tailwind CSS 4, three.js and Lenis.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## What's on the page

| Section | What it does |
|---|---|
| Hero | The headline is the chart: letters fill to the day's glucose line, ink in range and raspberry above 140 mg/dL. The line reaches for the pointer, so visitors fill the letters themselves. The trace ends at a real 3D sensor, and scrolling dives into its face until it becomes the next section's white ground. |
| Order | Drag (or use the arrow buttons on) three lunch courses into a new order. The response re-forms with its peak, minutes above 140 and the afternoon dip. |
| People | Flip through a stack of nutrition labels and compare four members' responses to the same food on one scale. The member cards are dealt from a deck as you scroll. |
| Walk | Hold the button to walk after dinner. Minutes and steps add up, and the spike shrinks live. |
| Report | Fifteen days are recorded one by one, then folded into an ambulatory glucose profile (median with 25–75% and 5–95% bands). Hover a day to lift it out. |
| Pricing | Each plan is drawn as sensor coverage on a 90-day calendar. |
| Questions | A phone lock screen: notification stacks by topic fan open, and each notification expands into its answer. |
| Close | Fifteen days fill in, one at a time, ending on "report ready", next to the order form. |

## Customise

- **Brand and copy.** Section copy lives in each component in `src/components/`. The page title is in `src/app/layout.tsx`.
- **Colours.** Tokens are at the top of `src/app/globals.css`. Raspberry means "above 140" in every chart, so if you change it, keep it distinct from ink.
- **Glucose model.** `src/lib/glucose.ts` holds the meal response curve, the hero's day, the lunch courses and the walk effect. Change meal sizes or timings there and every chart follows.
- **The sensor.** `src/lib/puck.ts` builds the 3D sensor (shell profile, face mark, adhesive patch, lighting).
- **People, foods and plans.** Arrays at the top of `people.tsx`, `pricing.tsx` and `questions.tsx`.
- **Form.** The sign-up form in `close.tsx` is a demo. Connect your own handler before launch.

## Notes

- Readings, people, coaches, accuracy figures and prices are placeholders. Curves come from a simplified illustrative model, not from measurements.
- The page says Islet is a wellness product, not for diagnosing or managing diabetes. Have any health claims reviewed for your market.
- Motion respects `prefers-reduced-motion`: the dive is skipped and reveals show straight away.
- The design direction and the motion plan are in `docs/design-dna.md`.

## License

See `LICENSE.md`. Created by [Fardin Omor Afnan](https://fardin.website).
