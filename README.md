# Vera's Clock

Pick a day and a time to show someone.

Vera has trouble writing. This app lets her choose a date on a big calendar, a
time on an analogue clock and AM or PM on her iPad. She then takes a photo of
the iPad screen with her phone and sends it to family.

It is built for a user who cannot read prose: there are no sentences,
instructions, or browser dialogs anywhere. Every control is an emoji, an icon,
or a colour, touch targets are large, and everything is reachable one-handed.

- Opens on the current date and time and keeps ticking (⏱️). Touching anything
  freezes the time (📌) and the edit applies on top. 🔄 goes back to live.
- Clock: tap the hour, then tap the minute. The active hand switches by itself.
- 🇨🇦 shows the same moment in Vancouver time; 🏠 switches back.
- The background follows the time of day shown: dawn, morning, midday, golden
  hour, dusk, and a starry night.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export into out/
npm run lint
npm run test:e2e   # builds, serves out/, runs the Playwright suite (Pixel 7)
```

`npm run build` produces a fully static site in `out/`. There are no runtime
API calls and no server. Cloudflare Workers builds and deploys it on every push
to `main`.

Expected live site: <https://veras-clock-and-calendar-app.deltadelta.workers.dev/>
