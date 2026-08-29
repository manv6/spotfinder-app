# Shipping SpotFinder to the App Store and Google Play

Everything needed to get this app from the repo onto both stores, in order.
Written against the app as it stands today: Expo SDK 57, React Native 0.86,
`react-native-maps`, `expo-location`, `expo-sensors`.

Build and submit with **EAS** (Expo Application Services). It compiles in the
cloud, so you do not need a Mac for Android and you do not need to babysit
Xcode/Gradle for either. `eas-cli` 21.0.2 is already available via `npx`.

---

## 0. Blockers to clear first

Three things in this repo will stop a store build. Fix them before anything else.

### 0.1 `android.package` is missing — hard blocker

`app.json` has no Android application ID. Android cannot build without one, and
**it can never be changed after your first Play Store upload.** Add it to match
the iOS bundle identifier:

```jsonc
// app.json → expo.android
"package": "com.manv6.spotfinder"
```

### 0.2 Google Maps API key — Android map renders grey without it

On iOS `react-native-maps` uses Apple Maps and needs no key. **On Android it uses
Google Maps and needs a Maps SDK for Android key**, or the app installs fine and
shows a blank grey grid where the map should be — an instant review rejection.

1. Google Cloud Console → create/select a project
2. Enable **Maps SDK for Android**
3. Credentials → Create credentials → API key
4. Restrict the key: Application restrictions → Android apps → add package name
   `com.manv6.spotfinder` + your release SHA-1 (get it after step 2.1 with
   `eas credentials`), and API restrictions → Maps SDK for Android only
5. Add it:

```jsonc
// app.json → expo.android
"config": { "googleMaps": { "apiKey": "AIza..." } }
```

> The key ships inside the APK and is readable — that is normal and expected for
> Maps SDK keys. The package-name + SHA-1 restriction is what actually protects
> it. Do not skip the restriction.

### 0.3 No `eas.json`

Create it in `mobile/` — see step 1.2.

---

## 1. One-time setup

### 1.1 Accounts

| | Cost | Sign up | Notes |
|---|---|---|---|
| **Apple Developer Program** | **$99 / year** | [developer.apple.com/programs](https://developer.apple.com/programs/) | Approval takes 24–48h, sometimes longer. Start this first — it is the long pole. |
| **Google Play Console** | **$25 once** | [play.google.com/console/signup](https://play.google.com/console/signup) | Personal accounts opened after Nov 2023 need **12 testers running a closed test for 14 consecutive days** before you may apply for production. Plan around this. |
| **Expo account** | free | [expo.dev/signup](https://expo.dev/signup) | Free tier queues builds; paid tiers skip the queue. |

### 1.2 Create `mobile/eas.json`

```json
{
  "cli": { "version": ">= 21.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true,
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "you@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

- `appVersionSource: "remote"` + `autoIncrement` means EAS owns the build
  numbers, so you never hand-bump `ios.buildNumber` / `android.versionCode`
  (neither is set in `app.json` today — that is fine with this setting).
- `preview` gives you an installable APK for real-device testing without a store.
- Fill in the `submit` values after steps 2.2 and 3.2.

### 1.3 Log in and link the project

```bash
cd mobile
npx eas-cli login
npx eas-cli init          # creates the EAS project, writes extra.eas.projectId
```

### 1.4 Bump the marketing version

`app.json` is at `"version": "1.0.0"`. That is the number users see. Set it
deliberately for each release; EAS handles the internal build counters.

---

## 2. iOS — App Store

### 2.1 Credentials

Let EAS generate and hold the distribution certificate and provisioning profile:

```bash
npx eas-cli credentials -p ios
```

Choose to let EAS manage them. It creates the App ID for
`com.manv6.spotfinder` in your Apple account automatically.

### 2.2 Create the App Store Connect listing

[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → My Apps → **+**

- Platform iOS, Name `SpotFinder` (must be globally unique — have a fallback ready)
- Bundle ID `com.manv6.spotfinder`
- SKU: anything internal, e.g. `spotfinder-001`

Copy the **Apple ID** number it assigns into `eas.json` as `ascAppId`.

### 2.3 Build

```bash
npx eas-cli build -p ios --profile production
```

~15–30 min in the cloud. Produces an `.ipa`.

> **The Xcode 26 / Swift 6.2 patch is already handled.** Expo SDK 57's
> `expo-modules-jsi` does not compile under Swift 6.2.4; the one-line fix lives in
> `patches/expo-modules-jsi+57.0.4.patch` and reapplies via the `postinstall`
> script, which EAS runs on `npm ci`. Cloud builds pick it up with no extra work.

### 2.4 Submit

```bash
npx eas-cli submit -p ios --latest
```

Then in App Store Connect fill in the listing before you can send it to review:

- **Screenshots** — required at 6.9" (1320×2868) and 6.5" (1242×2688). Simulator
  screenshots are acceptable: `⌘S` in the iOS Simulator.
- **App Privacy** — you collect **Precise Location**. Declare it, used for *App
  Functionality*, **not linked to identity**, **not used for tracking**. This app
  keeps the spot in local state and sends it nowhere, so that answer set is honest.
- Description, keywords, support URL, privacy policy URL (**required** because you
  access location — a plain page on the GitHub Pages site is enough).
- Age rating questionnaire, category (Navigation or Travel).

### 2.5 Review

1–3 days typical. The most likely rejection for this app is **Guideline 5.1.1** —
location permission strings that do not explain the benefit to the user. Yours
already do (`NSLocationWhenInUseUsageDescription` in `app.json`), so keep them
specific if you edit them.

---

## 3. Android — Google Play

### 3.1 Signing key

```bash
npx eas-cli credentials -p android
```

Let EAS generate and store the upload keystore. **Losing this locks you out of
updating your own app.** Back it up:

```bash
npx eas-cli credentials -p android   # → Keystore → Download
```

Store the downloaded `.jks` somewhere durable and private. It is gitignored
(`*.jks`) — keep it that way.

### 3.2 Create the Play Console listing + service account

1. Play Console → **Create app** → name, language, App/Game, Free/Paid
2. Then, for `eas submit` to upload automatically:
   - Play Console → Setup → **API access** → link a Google Cloud project
   - Create a **service account**, grant it the *Service Account User* role
   - In Play Console grant it **Release manager** permissions
   - Download the JSON key → save as `mobile/play-service-account.json`

**Add that file to `.gitignore` before you save it** — it is a credential:

```bash
echo "play-service-account.json" >> mobile/.gitignore
```

### 3.3 Build

```bash
npx eas-cli build -p android --profile production
```

Produces an `.aab` (Android App Bundle) — the format Play requires.

### 3.4 Submit

```bash
npx eas-cli submit -p android --latest
```

Lands on the **internal** track per `eas.json`. Promote through
internal → closed → open → production in the Play Console.

### 3.5 Play listing requirements

- **Data safety form** — declare **Location (approximate + precise)**, collected
  for App Functionality, **not shared**, and state whether it is processed
  ephemerally (for this app it is — nothing leaves the device).
- **Privacy policy URL** — mandatory when you request location permission.
- Screenshots (min 2, 16:9 or 9:16), 512×512 icon, 1024×500 feature graphic.
- Content rating questionnaire, target audience, ads declaration (none here).
- **Foreground/background location:** you only ever request
  `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` while in use, so you do **not**
  need the background-location review form. Do not add `ACCESS_BACKGROUND_LOCATION`
  unless you truly need it — it triggers a heavy separate review.
- **Closed testing rule:** new personal accounts must run a closed test with
  **12+ testers for 14 continuous days** before applying for production access.

---

## 4. Release checklist

```bash
cd mobile
npx tsc --noEmit                                     # typecheck
npx eas-cli build -p all --profile production        # both platforms at once
npx eas-cli submit -p ios --latest
npx eas-cli submit -p android --latest
```

Before each release:

- [ ] `expo.version` bumped in `app.json`
- [ ] Tested on a real device via the `preview` profile (the map, GPS, and compass
      cannot be meaningfully tested in a simulator)
- [ ] Android map renders actual tiles, not a grey grid (verifies the Maps key)
- [ ] Location permission prompt appears and its text reads correctly
- [ ] Privacy policy URL live and reachable

---

## 5. Shipping JS-only updates without a store review

For changes that touch only JS/TS — which is most work in this app — add
`expo-updates` and push over the air:

```bash
npx expo install expo-updates
npx eas-cli update --branch production --message "Fix compass drift"
```

Users get it on next launch, no review. **Native changes still need a full
rebuild and resubmit:** new native dependencies, permission changes, anything in
`app.json` under `ios`/`android`, or an Expo SDK upgrade.

---

## 6. Cost and time summary

| Item | Cost | Time |
|---|---|---|
| Apple Developer Program | $99/year | 24–48h approval |
| Google Play Console | $25 once | ~1h, then the 14-day closed test |
| EAS builds | free tier (queued) | 15–30 min/build |
| App Store review | — | 1–3 days |
| Play review | — | hours to 7 days (first submission is slowest) |

**Realistic first-launch estimate:** ~1 week for iOS, ~3 weeks for Android if the
14-day closed-testing rule applies to your account.
