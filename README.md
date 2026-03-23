# 📍 SpotFinder

**Mark your spot. Walk away. Find your way back.**

A zero-dependency, mobile-first web app for marking your location at large venues — beaches, festivals, stadiums, parks — and navigating back to it with a compass and distance guide.

![SpotFinder](https://img.shields.io/badge/version-1.0.0-38bdf8) ![License](https://img.shields.io/badge/license-MIT-4ade80) ![Dependencies](https://img.shields.io/badge/dependencies-0-a78bfa)

---

## 🎯 The Problem

You're at a huge beach. You lay down your towel, then walk 400m to get food. Now you can't find your friends. Sound familiar?

SpotFinder solves this for **any large venue** — beaches, music festivals, parks, airports, convention centers, and more.

---

## 🚀 How It Works

### Step 1: Choose Your Venue
Open the app and select from **40+ real-world venues** with accurate dimensions, or create a custom area with your own measurements.

**Categories:** Beaches · Festivals · Stadiums · Parks · Expos · Theme Parks · Airports

### Step 2: Mark Your Spot
Tap the map to set your position (or let GPS do it automatically on mobile). Hit **"Mark This Spot"** — a green marker drops at your exact location.

### Step 3: Walk Away
Go get food, explore, use the restroom — whatever you need. The app remembers where you were.

### Step 4: Navigate Back
Hit **"Navigate Back"** and follow:
- **Compass arrow** — points toward your saved spot
- **Live distance** — counts down in meters (switches to cm when close)
- **Dashed path line** — visual guide on the map
- **"You've arrived" banner** — triggers when you're within 3m

---

## 📱 Running on Mobile (3 Methods)

### Method 1: GitHub Pages (Recommended — Free, 2 minutes)

1. Push this repo to GitHub (see [Git Setup](#-git-setup) below)
2. Go to your repo → **Settings** → **Pages**
3. Under "Source", select **main** branch, root `/`
4. Click **Save**
5. Your app is live at `https://yourusername.github.io/spotfinder-app/`
6. Open that URL on your phone's browser

> **Pro tip:** On iOS Safari, tap Share → "Add to Home Screen" to make it feel like a native app.

### Method 2: Local Server (For testing)

**Option A — Python (already installed on most systems):**
```bash
cd spotfinder-app
python3 -m http.server 8000
```

**Option B — Node.js:**
```bash
npx serve .
```

**Option C — PHP:**
```bash
php -S localhost:8000
```

Then on your phone:
1. Make sure your phone and computer are on the **same WiFi network**
2. Find your computer's local IP:
   - **Mac:** `ipconfig getifaddr en0`
   - **Windows:** `ipconfig` → look for IPv4 Address
   - **Linux:** `hostname -I`
3. On your phone's browser, go to `http://YOUR_IP:8000`

### Method 3: Direct File (Simplest)

1. Transfer `index.html` to your phone (AirDrop, email, Google Drive, etc.)
2. Open it in your phone's browser
3. GPS will work, but some browsers may restrict Geolocation on `file://` URLs

> ⚠️ **For GPS to work**, the page must be served over **HTTPS** or **localhost**. GitHub Pages gives you HTTPS for free. Local servers work over `http://` on the same network for testing.

---

## 🛠️ Git Setup

### Create a new repo and push:

```bash
# 1. Initialize git
cd spotfinder-app
git init
git add .
git commit -m "Initial commit: SpotFinder v1.0"

# 2. Create repo on GitHub
#    Go to https://github.com/new
#    Name: spotfinder-app
#    Keep it public (required for free GitHub Pages)
#    Do NOT initialize with README (we already have one)

# 3. Connect and push
git remote add origin https://github.com/YOUR_USERNAME/spotfinder-app.git
git branch -M main
git push -u origin main
```

### Enable GitHub Pages:
1. Go to `https://github.com/YOUR_USERNAME/spotfinder-app/settings/pages`
2. Source: **Deploy from a branch**
3. Branch: **main** / **/ (root)**
4. Save
5. Wait ~60 seconds, then visit `https://YOUR_USERNAME.github.io/spotfinder-app/`

---

## 🏗️ Architecture

```
spotfinder-app/
├── index.html          # The entire app — single file, zero dependencies
├── README.md           # This file
├── LICENSE             # MIT License
└── .gitignore          # Git ignore rules
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Rendering** | HTML5 Canvas | No map tile server needed, works offline, pixel-perfect control |
| **Positioning** | Geolocation API (`watchPosition`, `enableHighAccuracy`) | Native GPS access with real-time updates |
| **Compass** | DeviceOrientation API | Real compass heading on mobile (iOS + Android) |
| **Distance** | Haversine formula | Precise great-circle distance calculation |
| **UI** | Vanilla CSS + JS | Zero dependencies, instant load, no build step |
| **Venue data** | Embedded JSON | 40+ venues with real-world dimensions |

### How GPS Accuracy Works
- `enableHighAccuracy: true` forces the device to use GPS/GLONASS (not just cell towers)
- On modern phones outdoors, this typically gives **±2-5m accuracy**
- The app converts GPS lat/lng offsets to meters relative to your first position fix
- Positions are clamped to venue bounds

### Compass Navigation
- **iOS:** Uses `webkitCompassHeading` (requires HTTPS + user permission on iOS 13+)
- **Android:** Uses `DeviceOrientationEvent.alpha`
- **Desktop fallback:** Arrow direction calculated from movement trajectory (last few position taps)

---

## 📋 Feature Checklist

- [x] Venue selection with 40+ real-world venues
- [x] 7 venue categories with search & filtering
- [x] Custom area creation with arbitrary dimensions
- [x] Tap-to-position (manual mode)
- [x] Real GPS tracking (mobile)
- [x] Mark/save spot with visual confirmation
- [x] Compass-based navigation arrow
- [x] Live distance readout (km → m → cm)
- [x] Dashed navigation line on map
- [x] "You've arrived" detection (< 3m)
- [x] Pan & zoom (drag + scroll/pinch)
- [x] Auto-scaling grid with meter labels
- [x] Scale bar + compass rose
- [x] Dark theme optimized for outdoor visibility
- [x] Fully responsive (mobile-first)
- [x] Zero dependencies, single HTML file
- [x] Works offline after first load

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
