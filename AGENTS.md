<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# About this project

Vera's Clock is a date and time picker for one person: Vera. It is a static Next.js site. It has no server and no API calls.

Vera has trouble writing. She uses this app to tell a person a date and a time. She picks a day on a calendar and a time on an analogue clock. She uses the app on her iPad. Then she takes a photo of the iPad screen with her phone. She sends the photo to a family member, for example in Canada. The app does not make or send the picture. Do not add a send or screen capture feature.

## Who Vera is

Vera is a stroke survivor. She was born in the 1960s. She did not grow up with technology, so her knowledge of it is limited. She is the main user of every system in this project.

Vera has these limits:

- She cannot use her right hand. She uses one hand only.
- She cannot read written text, except simple single words. She can connect one word to one object or one action.
- She cannot understand a sentence.
- She cannot speak, except a few simple, practiced words and sounds.
- She cannot say some letters of the alphabet. She can say most of them.

Vera depends on visual cues. She uses them to remember a flow in a user interface. She also uses them to understand a situation and to connect a word to an object or action.

Vera can do these things:

- She can copy text with the QWERTY keyboard on her phone, if the text is on the screen. If the screen shows "Banana", she can type "Banana".
- She can follow a complex flow after someone teaches her. For example, she learned to touch and hold text to start text-to-speech on her Apple phone.
- She knows some apps after instruction: messages, phone, contacts, Facebook, and WhatsApp.

## Rules for every change

Vera cannot understand text. Therefore, think about her limits before you add or change any feature. For example, do not add an alert pop-up, because she cannot read it. Use buttons with images or emojis that show the action.

You must obey these rules:

- Do not add sentences, instructions, labels, or error messages to the UI.
- Do not use `alert`, `confirm`, `prompt`, or a text dialog.
- Show each action with an emoji, an icon, a picture, or a color.
- Keep each flow short, and keep it the same every time. Vera learns a flow by memory.
- Make each touch target large.
- Make sure that one hand can reach every control on a phone.
- Do not require speech, and do not require a gesture that needs two hands.
- Do not require a complex gesture, such as a pinch or a drag, unless Vera can learn it.
- If a word appears, it must be a single simple word that has a picture next to it.
- Show what happened with a clear visual result, for example a trophy or a sad face.
- Do not remove or rename a control that Vera already knows, unless there is a strong reason.
- Do not assume that Vera knows a common web pattern. Menus, swipes, and hidden controls can confuse her.
- If a new feature needs text to work, change the design. Do not add the text.

Before you finish, ask this question: "Can Vera use this feature with one hand, without reading?" If the answer is no, change the feature.

## How the app works

The app is one screen. Nothing is in a menu. On a landscape tablet, the calendar and the clock are side by side. The parts are:

1. The calendar card. It has big ◀ and ▶ month arrows, the month word and the year, single-letter weekdays, and big day buttons. Today has a blue ring. The selected day is orange.
2. The clock card. The two hand buttons and the ☀️ AM / 🌙 PM switch are on the left, near the left thumb. The analogue clock is on the right.
3. The day bar. It is a tall bar on the right side of the screen, beside the calendar and the clock. See "Day bar" below.
4. The action bar. It is fixed at the bottom of the screen. It has 🇨🇦 Vancouver (nearest the left thumb) and 🔄 reset (furthest from the thumb, so that it is not pressed by mistake).

### Live and frozen

- When the app opens, it shows the current date and time. The clock ticks. A thin seconds hand pulses, and a ⏱️ badge glows.
- When Vera touches the calendar, the clock face, the AM/PM switch, or 🇨🇦, the time freezes at what is on the screen. Her change applies to that time. A 📌 badge shows the frozen state.
- 🔄 returns to live current time in the local zone.

### The clock

- The hour hand is short, thick, and orange. The minute hand is long, thin, and blue. The hand buttons show the same hand in the same colour.
- Vera taps a point on the face. The active hand moves there. The hour snaps to the nearest hour and keeps AM or PM. The minute snaps to the nearest 5 minutes and does not change the hour.
- After the hour is set, the minute hand becomes active. After the minute is set, the hour hand becomes active. So the flow is always: tap the hour, then tap the minute.
- A drag on the face also works, but it is not necessary.
- ☀️ AM and 🌙 PM move the time by 12 hours on the same date.

### Vancouver

- The chosen moment is one absolute instant. The screen shows it in the local zone of the device or in `America/Vancouver`.
- 🇨🇦 shows the same instant in Vancouver time: the calendar, the clock, AM/PM, and the background all change. A 🇨🇦 badge shows on the clock. The button then shows 🏠. 🏠 converts back to the local zone.
- Changes that Vera makes in Vancouver mode are in Vancouver wall time.
- `lib/time.ts` does all zone maths with `Intl.DateTimeFormat`. It handles daylight saving time. `e2e/time.spec.ts` tests it.

### Background

The background is a soft gradient that shows the time of day of the displayed hour: night, dawn, morning, midday, golden hour, and dusk. 8 PM is dusk. Night and dusk have stars. A change of phase cross-fades. The root element has `data-phase`.

### Day bar

The day bar is a wide bar that shows how much of the day has passed. It does not respond to touch.

- Midnight is at the top. The day goes down the bar to the next midnight at the bottom.
- The track is a gradient of the sky over the day: night, dawn, day, golden hour, dusk, and night again (`DAY_STOPS` in `lib/time.ts`).
- A notch on each edge marks each hour. Every third hour has a longer notch.
- The part of the day that has passed is bright. The rest of the day is faded.
- A straight, glowing yellow line across the bar shows the displayed time. It follows the live, frozen, and Vancouver time, like the clock.
- Marks show the moments of Vera's day: 12 AM (midnight, at the top, with no emoji), ☕ 9 AM (breakfast), 🥪 12 PM (lunch), and 😴 9 PM (sleep).
- The emoji marks are on top of the yellow line. The line goes behind them, so it never hides a mark. Do not put a circle or an emoji on the line.
- The bar has `data-progress` (0 at midnight, 1 at the next midnight). The marks have `data-testid="day-mark-<hour>"`.

### Test hooks

The root element (`data-testid="app"`) has `data-time` (wall time, for example `2026-10-15T20:30`), `data-zone`, `data-live`, `data-phase`, and `data-active-hand`. Each control has a `data-testid`.

## Project layout

- `app/`: Next.js entry files (`page.tsx`, `layout.tsx`, `globals.css`, `icon.svg`).
- `components/App.tsx`: the screen and all state (live or frozen, zone, active hand).
- `components/Calendar.tsx`, `components/Clock.tsx`, `components/DayBar.tsx`, `components/Sky.tsx`: the calendar, the clock face, the day bar, and the background.
- `components/icons.tsx`: the arrow and hand icons.
- `lib/time.ts`: zone maths, date helpers, and the time-of-day phases and colours.
- `lib/colors.ts`: the hand colours.
- `lib/useNow.ts`: the current time and the local zone, as React hooks.
- `e2e/app.spec.ts`: Playwright tests of the app. They fix the clock with `page.clock` and the zone with `timezoneId`.
- `e2e/time.spec.ts`: unit tests of `lib/time.ts`.
- `playwright.config.ts`: builds the site, serves `out/` on port 3100, and tests on a Pixel 7 viewport.

## Commands

- `npm run dev`: start the dev server at `http://localhost:3000`.
- `npm run build`: make the static site in `out/`.
- `npm run lint`: run ESLint.
- `npm run test:e2e`: build, serve `out/`, and run the Playwright tests.
- `npm run preview`: build, then serve `out/` at `http://localhost:3000`.
- `npm run cf:preview`: build, then serve `out/` with `wrangler dev`.
- Do not deploy by hand. The Cloudflare GitHub app deploys the site each time a push reaches `main`.

## Static export rules

The site is a static export (`output: "export"`). Next.js runs at build time only. No server runs after the build.

- Keep `output: "export"` and `images: { unoptimized: true }` in `next.config.ts`.
- Keep `build.command`, `assets.directory` (`./out`), and `assets.not_found_handling` (`404-page`) in `wrangler.jsonc`. The `name` in `wrangler.jsonc` must be the same as the Worker name in Cloudflare.
- These work: Server Components (at build time), Client Components, `next/link`, browser data fetching, dynamic routes with `generateStaticParams()`, CSS and Tailwind CSS, and browser APIs inside effects or client-only hooks.
- These do not work: Server Actions, cookies, request headers, Route Handlers that read the request, `rewrites`/`redirects`/`headers`, Proxy (middleware), ISR, Draft Mode, and the default image loader.
- Do not add a database, an API server, or secret keys.
- Put static files in `public/`. Refer to them with a path that starts with `/`.
- Add a new dependency only if it is necessary. Commit the changed `package-lock.json`.
- Keep `public/llms.txt` correct when the site changes.

## Git rules

- Never force-push. Never rewrite history.
- Write clear commit messages.
- Do not commit secrets, `out/`, `node_modules/`, `.next/`, `.wrangler/`, `test-results/`, or `playwright-report/`.
