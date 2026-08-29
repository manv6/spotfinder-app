# 📍 SpotFinder

**Mark your spot. Walk away. Find your way back.**

Mark your location at a large venue — beaches, festivals, stadiums, parks — then
navigate back to it with a compass arrow and live distance readout.

![SpotFinder](https://img.shields.io/badge/version-1.0.0-38bdf8) ![License](https://img.shields.io/badge/license-MIT-4ade80)

**▶ Live: [manv6.github.io/spotfinder-app](https://manv6.github.io/spotfinder-app/)**

One codebase in [`mobile/`](./mobile) ships to three places:

| Target | Map | How |
|---|---|---|
| **Web** | MapLibre GL + raster tiles | `expo export -p web`, auto-deployed to GitHub Pages |
| **iOS** | Apple Maps (real 3D) | `expo run:ios` — see [mobile/SHIPPING.md](./mobile/SHIPPING.md) |
| **Android** | Google Maps | `expo run:android` — see [mobile/SHIPPING.md](./mobile/SHIPPING.md) |

> The original zero-dependency single-file canvas app (v1.0, venue picker, no real
> map) is preserved in [`legacy/`](./legacy). It is no longer the deployed site.

---

## 🎯 The Problem

You're at a huge beach. You lay down your towel, then walk 400m to get food. Now you can't find your friends. Sound familiar?

SpotFinder solves this for **any large venue** — beaches, music festivals, parks, airports, convention centers, and more.

---

## 🚀 How It Works

### Step 1: Open the map
Your real GPS position drops onto a real map — no venue picking. Switch between
**dark**, **satellite**, and **3D** views. On iOS, 3D is Apple Maps' actual
building geometry.

### Step 2: Mark Your Spot
Hit **"Mark This Spot"** and a marker drops at your location. The app runs a
settle-and-sample pass first, keeping the most accurate fix it sees rather than
the first one — which matters, since a cold GPS fix can be 50m off.

### Step 3: Walk Away
Go get food, explore, use the restroom — whatever you need. The app remembers where you were.

### Step 4: Navigate Back
Hit **"Navigate Back"** and follow:
- **Compass arrow** — points toward your saved spot
- **Live distance** — counts down in meters (switches to cm when close)
- **Dashed path line** — visual guide on the map
- **"You've arrived" banner** — triggers when you're within 3m

---

## 🚀 Running it

### Web

Already deployed — open **[manv6.github.io/spotfinder-app](https://manv6.github.io/spotfinder-app/)**
on your phone. On iOS Safari, Share → "Add to Home Screen" for a native feel.

To run locally:

```bash
cd mobile
npm install
npm run web
```

> GPS requires **HTTPS or localhost**. GitHub Pages provides HTTPS.

### iOS / Android

```bash
cd mobile
npm install
npx expo run:ios       # or: npx expo run:android
```

> Uses native modules absent from Expo Go (`react-native-maps`, Reanimated 4), so
> this builds a **dev build** rather than using the Expo Go client. Android needs a
> Google Maps API key first — see [mobile/README.md](./mobile/README.md).

### Shipping to the App Store / Play Store

Step-by-step in **[mobile/SHIPPING.md](./mobile/SHIPPING.md)** — accounts, costs,
EAS build and submit, store listing requirements, and the blockers to clear first.

---

## 🏗️ Architecture

```
spotfinder-app/
├── mobile/                 # the app — Expo, ships to web + iOS + Android
│   ├── src/screens/
│   │   ├── MapScreen.tsx       # native: react-native-maps
│   │   └── MapScreen.web.tsx   # web: MapLibre GL
│   ├── src/geo.ts          # Haversine distance + great-circle bearing
│   ├── SHIPPING.md         # App Store / Play Store guide
│   └── README.md
├── legacy/index.html       # the original v1.0 canvas app (not deployed)
└── .github/workflows/
    └── deploy-web.yml      # builds mobile/ for web → GitHub Pages
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Expo (SDK 57) + React Native | One codebase for web, iOS, and Android |
| **Map (web)** | MapLibre GL + raster tiles | Keyless, no signup, renders under Metro's web bundler |
| **Map (native)** | `react-native-maps` | Apple Maps on iOS (real 3D buildings), Google Maps on Android |
| **Positioning** | `expo-location` (`watchPositionAsync`) | High-accuracy GPS with real-time updates |
| **Compass** | `expo-location` (`watchHeadingAsync`) | True-north heading on both platforms |
| **Distance** | Haversine + great-circle bearing | Precise distance and direction (`mobile/src/geo.ts`) |
| **Animation** | `react-native-reanimated` v4 | Smooth compass-arrow rotation on the UI thread |
| **Offline** | `@react-native-community/netinfo` | Detects unreachable internet, falls back to compass-only radar |

### How GPS Accuracy Works
- High-accuracy mode forces GPS/GLONASS rather than cell-tower trilateration
- On modern phones outdoors this typically gives **±2–5m**
- Marking runs a **settle-and-sample pass**: it watches position for a few seconds
  and keeps the fix with the lowest reported accuracy, instead of trusting the
  first (often badly wrong) cold fix
- On iOS the app detects when **Precise Location** is disabled and prompts for it,
  since coarse location makes navigating back to a towel meaningless

### Offline Behavior
Venues that pack in tens of thousands of people routinely have working WiFi
association but no actual internet. When the app detects that, it drops the map
tiles and switches to a **compass radar** — bearing and distance still work,
because both are computed on-device from GPS.

---

## 📋 Feature Checklist

- [x] Real map with live GPS position (MapLibre on web, native maps on iOS/Android)
- [x] Dark / satellite / 3D map styles
- [x] Accuracy-aware pinpointing — samples and keeps the best fix
- [x] "Precise Location is off" detection with a prompt to fix it
- [x] Mark/save spot with visual confirmation
- [x] Compass-based navigation arrow
- [x] Live distance readout (km → m → cm)
- [x] Dashed navigation line on map
- [x] "You've arrived" detection (< 3m)
- [x] Offline compass mode — works with no connection, common at packed venues
- [x] Dark theme optimized for outdoor visibility
- [x] One codebase → web + iOS + Android

---

## 🔮 Future Ideas

- **Multiple saved spots** — mark parking, friends, etc.
- **Share spot via link** — send coordinates to friends
- **Offline venue maps** — cache SVG layouts for specific venues
- **Indoor positioning** — Bluetooth beacons / WiFi fingerprinting
- **AR mode** — Camera overlay with direction arrow
- **PWA support** — Service worker for full offline + install prompt

---

## 📄 License

MIT — do whatever you want with it.
