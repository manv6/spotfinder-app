# SpotFinder — Expo (React Native) app

Open a **real map**, mark where you're standing, walk away, then get guided back
to that spot with a compass arrow + live distance. No venue picking — it just uses
your actual GPS location on real map tiles.

## Stack

| Concern | Tech |
|---|---|
| Map | [`react-native-maps`](https://github.com/react-native-maps/react-native-maps) (Apple Maps on iOS, Google on Android) |
| GPS + heading | `expo-location` (`watchPositionAsync` + `watchHeadingAsync`) |
| Distance / direction | Haversine + great-circle bearing (`src/geo.ts`) |
| Compass-arrow animation | `react-native-reanimated` v4 |
| Navigation | React state in `src/screens/MapScreen.tsx` |

## Run it

```bash
cd mobile
npx expo run:ios       # or: npx expo run:android
```

> Uses native modules that are **not in Expo Go** (react-native-maps, Reanimated 4).
> Use a **dev build** (`expo run:ios` / `run:android`), not the Expo Go client.
> Add `--configuration Release` to build a standalone binary with no Metro dependency.

Typecheck: `npx tsc --noEmit`

## Deploying the web build

The web export is a static SPA. `npm run build` writes it to `dist/`; `node server.js`
serves that on `$PORT`.

**The one thing to get right is the base path.** Asset URLs are baked in at build
time, so it's set by `EXPO_BASE_URL` at build time (see `app.config.js`) — a wrong
value doesn't fail the build, it just 404s every asset:

| Target | Served at | `EXPO_BASE_URL` |
|---|---|---|
| GitHub Pages | `/spotfinder-app` | `/spotfinder-app` (set in the workflow) |
| Railway / any root domain | `/` | leave unset |

### GitHub Pages

Automatic — `.github/workflows/deploy-web.yml` rebuilds on every push to `master`
that touches `mobile/`.

### Railway

`railpack.json` sets the start command. Because the app lives in `mobile/` and not
at the repo root, you must point the service at it:

> Railway → your service → **Settings** → **Source** → set **Root Directory** to `mobile`

Without that, Railpack inspects the repo root, finds no recognizable app, and fails
with *"Railpack could not determine how to build the app."* Everything else is
detected from `mobile/package.json`: `npm ci` → `npm run build` → `node server.js`.

Leave `EXPO_BASE_URL` unset there so assets resolve at the domain root.

## Shipping to the stores

See **[SHIPPING.md](./SHIPPING.md)** for the full App Store / Google Play walkthrough
— accounts and costs, EAS build + submit, store listing requirements, and the three
blockers in this repo that must be cleared before a store build will succeed.

**iOS** uses Apple Maps and needs no API key. **Android** uses Google Maps — add a
Maps SDK key to `app.json` (`android.config.googleMaps.apiKey`) before building there.

### Xcode 26 / Swift 6.2 build patch

Expo SDK 57's `expo-modules-jsi` has one Swift source line that the Swift 6.2.4
compiler (Xcode 26.x) rejects as ambiguous. It's patched via
[`patch-package`](https://github.com/ds300/patch-package) in
`patches/expo-modules-jsi+57.0.4.patch` (a one-token `abs(x)` → `x.magnitude`
change) and reapplied automatically by the `postinstall` script — so a fresh
`npm install` keeps building. Remove the patch once Expo ships a version that
compiles under Swift 6.2.

## Where things live

```
mobile/
├── App.tsx                       # root: renders the map screen
├── src/
│   ├── geo.ts                    # LatLng, Haversine distance, bearing, formatDistance
│   ├── theme.ts                  # colors (ported from the web app's CSS variables)
│   ├── screens/
│   │   └── MapScreen.tsx         # the map, mark/navigate flow, status ribbon, nav HUD
│   ├── components/
│   │   └── NavCompass.tsx        # the rotating compass arrow
│   └── hooks/
│       └── useUserLocation.ts    # real GPS position + accuracy + compass heading
```

## Flow

1. **Open** → map centers on your GPS location (blue dot).
2. **Mark My Spot** → drops a green pin at where you are and saves it.
3. Walk away.
4. **Navigate Back** → draws a line to the spot and shows a compass arrow + live
   distance; **"You've arrived"** fires within ~8 m.

## Notes / known approximations

- **Compass heading** comes from `expo-location`'s heading stream. On the simulator
  there's no magnetometer, so the arrow falls back to *heading-of-travel* estimated
  from your recent GPS fixes (simulate movement with `xcrun simctl location … set`).
- The arrival threshold is ~8 m to absorb normal GPS noise (the old grid demo used 3 m).
- The green "spot" marker uses `tracksViewChanges={false}` so it doesn't re-render
  every frame — flip it to `true` if you animate the marker's contents.
