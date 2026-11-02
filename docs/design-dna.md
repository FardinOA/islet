# Islet: design DNA

Islet is a sample brand: an over-the-counter fifteen-day glucose sensor (a CGM) with a coach in the app. It is aimed at people without diabetes who want to know what their food does to them. The topic is current: in 2026, OTC biosensors and the GLP-1 era have made "what does this meal do to my blood" a mainstream question.

**The one idea:** every section is a different way your blood answers a meal. The page is built on a small glucose model (`src/lib/glucose.ts`), so every curve is computed, not drawn.

## Evidence Binding

| Decision | Evidence | Source | Mechanism |
|---|---|---|---|
| The headline is the chart | Hero type must be set on the visual's geometry | memory: hero-type-with-the-visual | Letters fill to the day's glucose line: ink in range, raspberry above 140 |
| A strong pointer response that reaches the type | A subtle hero read as "no interaction" | memory: hero-pointer-must-be-obvious | The line reaches for the cursor, so the visitor fills the letters by hand |
| A real 3D sensor, not an SVG | Illustrated objects read "noob" | memory: real-subjects-not-illustrations | three.js lathe puck with clearcoat, a fabric patch and a debossed mark |
| Dive into the sensor's face | User loved object-into-surface dives | memory: block-dive-transitions | Scroll turns the puck to camera and grows it until its white face is the next section's ground |
| Light grounds, real product UI | Dark conceptual scenes rejected | memory: light-product-ui-over-concept | Charts with axes, units and range bands, in white windows |
| Inset flat colour stages | One-card-per-white-section read average | memory: premium-means-stages-and-windows | Butter, ink, raspberry and grey stages, ~10 px from the edge, 34 px radius |
| Inter Tight, heavy and tight | Display serifs rejected | memory: type-and-scroll-preferences | Geist Mono only for readings (mg/dL, times) |
| No section kickers, no accordion FAQ | Rejected on Gnomon | memory: no-section-folios-or-accordion-faq | Headlines stand alone; the FAQ is a phone lock screen of notification stacks |
| Scroll moves objects, never data | Scroll-scrubbed data rejected on Scrim | memory: type-and-scroll-preferences | Cards deal, windows unroll, dishes are served; numbers only change when the visitor acts |

## Category Default Analysis

Category: consumer metabolic health (CGM + app). Its five most common visual strategies:

| Strategy | Used by Islet? |
|---|---|
| Teal/blue "medical trust" palette | No: paper, butter and raspberry from food and from the chart's own range colours |
| Lifestyle photography of a sensor on a toned arm | No: a real 3D sensor, and the visitor's own pointer as the subject |
| Phone mockups floating on a gradient blob | No gradients or blobs; one phone, as a working lock screen in the FAQ |
| Neon glucose trace on dark | No: ink trace on paper, filling the headline |
| Icon grid of benefits | No: every benefit is a working chart the visitor drives |

## Territories

| | A. Clinical daylight (selected) | B. Lab-report editorial | C. Night-shift dark |
|---|---|---|---|
| Light / dark | Warm paper and white | Off-white, black rules | Near-black with neon trace |
| Temperature | Warm: butter, raspberry | Neutral | Cold: cyan and violet |
| Register | Consumer product, food-adjacent | Medical paperwork | Sports-tech |
| Type | Inter Tight 800, tight | Condensed grotesk caps | Wide display |
| Motion | The line follows the hand; objects served, dealt, unrolled | Almost none | Glows, pulses |
| Verdict | **Selected.** Food colours keep it about lunch, not illness; light grounds suit the product UI the user prefers | Rejected: reads as a hospital form and makes a lifestyle product feel like a diagnosis | Rejected: dark glow-led scenes are rejected house-wide, and neon traces are the category cliché |

**Anti-bias check.** Health-tech defaults to teal or blue for "trust". Raspberry comes from food (beetroot, berries) and from the meaning of the colour in the charts: above range. Butter is the in-range band's tint, so the stage colour is a chart colour too.

## Tokens

| Token | Value | Use |
|---|---|---|
| paper | `#f4f1ea` | Page ground |
| white | `#ffffff` | Windows, the sensor's face, the dive's landing |
| ink | `#141512` | Type, in-range fill, the trace |
| ink-2 / ink-3 | `#56584f` / `#8b8d84` | Secondary text |
| line | `#e5e1d6` | Hairlines |
| butter | `#f1e4a6` | Stage; the 70–140 band (as `butter-tint #f7efcc`) |
| rasp | `#e2245b` | Above 140; the one primary action per screen |
| rasp-deep | `#b8164a` | Pressed / text on tint |
| rasp-tint | `#fde4eb` | Raspberry backgrounds in windows |
| grey | `#e8e6e0` | FAQ stage |
| leaf | `#2f7d4f` | Improvements (lower peaks) only |

Radii: window 24, pane 16, control 12, stage 34. Gutter `clamp(16px, 4vw, 56px)`.

## Sections and mechanics

| Section | Mechanic | Object |
|---|---|---|
| Hero | Letters fill to the glucose line; the line reaches for the pointer; reading under the cursor; sensor writes the trace; dive into its face | The day's trace + the sensor |
| Order | Drag (or arrow-key) three courses into a new order; the response re-forms with peak, time above 140 and the 3 pm dip. Entrance: dishes are served onto the table one by one | A lunch, eaten in courses |
| People | Flick through a stack of nutrition labels; four members' responses to the same food, on one honest scale. Entrance: member cards are dealt from a deck by scroll | FDA-style nutrition label + small multiples |
| Walk | Hold to walk: minutes and steps accrue, the dinner spike shrinks live, the walk is shaded on the time axis. Entrance: the window unrolls from the coach's message | Coach note + dinner chart |
| Report | Fifteen days recorded one by one, then folded into an ambulatory glucose profile (median, 25–75 and 5–95 bands); hover any day to lift it out | The AGP report, the standard CGM chart |
| Pricing | Three plans drawn as sensor coverage on a 90-day calendar; each sensor is a fifteen-day capsule | Wear calendar |
| Questions | A phone lock screen: notification stacks by topic fan open, and a notification expands into its answer | iOS-style lock screen |
| Close | Fifteen days fill one by one into "report ready" beside the order form | Sensor life |

## Sibling pattern check

| Sibling pattern | Owned by | Islet |
|---|---|---|
| Console window with sidebar and inspector rising from a tilt | Etalon, Pileus, Ashlar, Triode | Only the report uses a window with a sidebar; it unrolls nowhere, its days record in |
| Window leans back / lifts / fills like a meter | Etalon, Mullion, Peel, Ashlar, Triode | Walk window unrolls from a message; Order dishes are served; People cards are dealt |
| Headline rises / catches light / meter-bar letters | Etalon, Gnomon, Triode | Section headlines rise word by word as a trace draws under them, lifting each word as it passes |
| Pinned 3D object turning beside facts | Pileus, Propose, Ashlar | The sensor only appears in the hero and dives once; no facts beside it |
| Slider calculator | Etalon, Mullion, Ashlar, Peel | Pricing is a coverage calendar; the only continuous control is "hold to walk" |
| Physical FAQ / console FAQ / timed comments | Ashlar, Pileus, Etalon, Peel, Gnomon, Triode | Lock-screen notification stacks |
| Scroll = the day passing | Gnomon | No: the hero's clock runs on time, not scroll |
| Floating nav with a sliding pill / scroll progress | Strait, Vireo | Flat bar; the right side carries the sensor's live reading |

## Copy rules

- Plain, specific, second person. Numbers carry units (mg/dL, minutes, grams).
- Wellness claims only: Islet is not for diagnosing or treating diabetes; say so on the page.
- People, readings and prices are placeholders and are labelled as such in the footer.
