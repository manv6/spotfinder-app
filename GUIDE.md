# SpotFinder — How-To Guide

## Quick Start (Under 2 Minutes)

### 1. Get the app running on your phone

**Fastest method — GitHub Pages:**

```
1. Create a GitHub account (if you don't have one): https://github.com/signup
2. Click "+" → "New repository"
3. Name it: spotfinder-app
4. Make it Public
5. Do NOT check "Add a README" (we have our own)
6. Click "Create repository"
```

Then in your terminal:

```bash
cd spotfinder-app
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/YOUR_USERNAME/spotfinder-app.git
git branch -M main
git push -u origin main
```

Then enable Pages:

```
1. Go to: Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: main, folder: / (root)
4. Save → wait 1 minute
5. Open https://YOUR_USERNAME.github.io/spotfinder-app/ on your phone
```

---

## Using the App

### Screen 1: Venue Selection

When you open the app, you see the venue browser:

```
┌─────────────────────────────┐
│  SpotFinder                 │
│  Mark your spot at any...   │
│                             │
│  ⌕ Search venues...        │
│                             │
│  [All] [Beaches] [Festi..] │
│                             │
│  🏖️ Copacabana Beach       │
│     Rio de Janeiro          │
│     4km × 80m          ›   │
│                             │
│  🏖️ Bondi Beach            │
│     Sydney, Australia       │
│     1km × 60m          ›   │
│                             │
│  ...more venues...          │
│                             │
│  ＋ Custom Area             │
│     Define your own space   │
└─────────────────────────────┘
```

**Actions:**
- **Search** — type to filter by name or city
- **Category pills** — filter by type (Beach, Festival, etc.)
- **Tap a venue** — opens the map with that venue's real dimensions
- **Custom Area** — create your own space (enter name + width × height in meters)

### Screen 2: The Map

After selecting a venue, you see a scaled grid map:

```
┌─────────────────────────────┐
│ ← Elafonisi Beach          │
│    800m × 150m              │
│ ● tap to place yourself...  │
│                             │
│    -400m  -200m   0   +200m │
│  ┌──────────────────────┐   │
│  │  · · · · · · · · · · │   │
│  │  · · · · · · · · · · │   │
│  │  · · · ◉ · · · · · · │ ← YOU (blue dot)
│  │  · · · · · · · · · · │   │
│  └──────────────────────┘   │
│         N                   │
│        ╱│               50m │
│       ╱ │              ├──┤ │
│                             │
│  [ ◎ Mark This Spot ]       │
└─────────────────────────────┘
```

**Map controls:**
- **Tap** inside the venue area → places your blue "YOU" dot
- **Drag** → pan the map
- **Scroll / Pinch** → zoom in/out
- Grid auto-scales (5m / 10m / 25m / 50m / 100m / 250m)
- Scale bar (bottom-right) shows current zoom level
- Compass rose (bottom-left) shows North

### Marking Your Spot

1. Tap the map to place yourself (or let GPS position you automatically)
2. The blue "YOU" dot pulses at your location
3. Tap **"Mark This Spot"**
4. A green "YOUR SPOT" marker appears
5. The status bar shows your saved coordinates

```
┌─────────────────────────────┐
│ ...map...                   │
│                             │
│  · · · ● · · · · · ← YOUR SPOT (green)
│  · · · · · · · · ·         │
│  · · · · · · ◉ · · ← YOU moved here
│                             │
│  ● Spot saved    +42, -18m  │
│                             │
│  [▶ Navigate Back]    [✕]   │
└─────────────────────────────┘
```

### Navigation Mode

Hit **"Navigate Back"** and the navigation HUD appears:

```
┌─────────────────────────────┐
│ ...map with dashed line...  │
│                             │
│  · · · ● · · · · ·         │
│  · · ·╱· · · · · ·   ← dashed line
│  · · ◉ · · · · · ·         │
│                             │
│  ┌─────────────────────┐    │
│  │      ╭───╮          │    │
│  │      │ N │          │    │
│  │      │ ▲ │ ← arrow  │    │
│  │      │ · │   points  │    │
│  │      ╰───╯   to spot│    │
│  │                      │    │
│  │     47.3 m           │    │
│  │  to your saved spot  │    │
│  │  follow the arrow    │    │
│  └─────────────────────┘    │
│                             │
│  [■ Stop Navigation]        │
└─────────────────────────────┘
```

**Navigation elements:**
- **Compass arrow** — rotates to point toward your saved spot
- **Distance** — updates in real-time (km → m → cm)
- **Dashed line** — visual path on the map between you and your spot
- **Map auto-fits** — zooms to show both points

**On mobile with GPS:** Your position updates automatically as you walk. The compass uses your phone's magnetometer for the arrow direction.

**On desktop / demo mode:** Tap different spots on the map to simulate walking. The arrow recalculates with each tap.

### Arrival

When you're within 3 meters of your saved spot:

```
  ┌───────────────────────┐
  │        0.8 m          │
  │   to your saved spot  │
  │                       │
  │  ┌─────────────────┐  │
  │  │ ✓ You've arrived │  │
  │  └─────────────────┘  │
  └───────────────────────┘
```

---

## Tips for Best GPS Accuracy

1. **Use outdoors** — GPS needs sky visibility
2. **Wait 10-20 seconds** for the GPS to lock (accuracy improves over time)
3. **HTTPS required** — GPS only works over HTTPS (GitHub Pages provides this)
4. **iOS permission** — Safari will ask for location permission; tap "Allow"
5. **Android Chrome** — may ask for both location and motion sensor permissions
6. **Keep the screen on** — some phones throttle GPS when the screen is off

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| GPS not working | Make sure you're on HTTPS (not http://) and granted location permission |
| Compass not spinning | Enable motion sensors in browser settings; on iOS go to Settings → Safari → Motion & Orientation Access |
| Map looks empty | Tap inside the venue rectangle to set your position |
| Can't zoom | Try scroll wheel on desktop, or pinch gesture on mobile |
| Position jumps around | Normal GPS behavior — stand still for 10s to let it settle |
