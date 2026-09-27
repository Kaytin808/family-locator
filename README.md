# Family Locator

A private, bare React Native iOS app for a small family circle. It shares live and recent location, places, battery state, check-ins, SOS alerts, basic driving/speed signals, and an intentionally conservative crash-candidate countdown.

This project is designed for personal sideloading. It is not an emergency service and must not be relied on to contact emergency responders.

## What is implemented

The app is organized in the requested build order:

1. Email/password accounts, automatic first circle, real-time MapKit member pins, foreground updates, iOS significant-location-change background updates, and 48-hour breadcrumbs.
2. Named places and server-side arrival/departure transitions.
3. One-time, 24-hour invite codes, a Firebase Hosting landing page, custom-scheme deep links, and the native iOS share sheet.
4. Battery sharing, low-battery state transitions, “I’m OK,” and SOS alerts.
5. A configurable speeding threshold with debounce/cooldown.
6. Experimental crash-candidate detection using GPS deceleration plus an accelerometer spike, followed by a 15–30 second cancel countdown.

Cloud Functions deliver FCM notifications to the other circle members and prune history after 48 hours. Firestore rules restrict circle data to authenticated members and only allow a user to publish their own location.

## Repository layout

```text
src/                 App UI, navigation, context, and services
functions/src/       Firebase callable/background/scheduled functions
public/              Hosted invite redirect page
ios/                 Native React Native project and entitlements
.github/workflows/   Signed IPA build
```

## Important account constraints

Two assumptions in the original brief do not match the current platform requirements:

- Firebase Cloud Functions require a Cloud Billing account, which upgrades a project from Spark to Blaze. The Blaze plan retains no-cost quotas, and two users should normally remain inside them, but billing must be enabled. Firestore, email/password Auth, FCM itself, and Hosting have no-cost allowances. See [Firebase’s serverless billing requirement](https://firebase.google.com/docs/hosting/serverless-overview#choosing_a_serverless_option) and [Firebase pricing](https://firebase.google.com/pricing).
- A free Apple Personal Team can install up to three apps on up to three devices, but its provisioning profiles expire after seven days. Apple lists the free-account limits in its [developer account overview](https://developer.apple.com/help/account/basics/about-your-developer-account). APNs push notifications are not available to Personal Teams; Apple’s own distribution guidance calls out push as unavailable there. A paid Apple Developer Program membership is therefore required for remote FCM/APNs alerts. The app still shares data through Firestore and shows incoming alerts while open without APNs.

The default `FamilyLocator.entitlements` deliberately omits `aps-environment` so a Personal Team profile can sign it. Paid-program builds set the GitHub secret `ENABLE_PUSH_NOTIFICATIONS=true`, which selects `FamilyLocatorPush.entitlements`.

LiveContainer can reduce how often inner apps are re-signed, depending on how LiveContainer itself is installed, but it does not make an expired Personal Team provisioning profile valid. Treat it as an alternate runtime rather than an APNs or signing entitlement workaround.

## Firebase setup

1. Create a Firebase project and add an iOS app. Its bundle ID must match the one you will sign (for example `com.yourname.FamilyLocator`).
2. Enable **Authentication → Email/Password** and create a Firestore database.
3. Download `GoogleService-Info.plist` and put it at `ios/FamilyLocator/GoogleService-Info.plist`. The checked-in `.example` is only a shape reference.
4. Install the Firebase CLI, sign in, and associate this directory with the project:

   ```sh
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```

5. Replace `YOUR_FIREBASE_PROJECT` in `src/navigation/linking.ts` with the Firebase project ID.
6. Enable billing if deploying Cloud Functions, then deploy the backend:

   ```sh
   npm --prefix functions install
   npm run functions:build
   firebase deploy --only firestore,functions,hosting
   ```

7. For a paid Apple Developer Program account, create an APNs authentication key and upload it under **Firebase project settings → Cloud Messaging → Apple app configuration**. Set `ENABLE_PUSH_NOTIFICATIONS=true` in GitHub Actions. Firebase’s current [Apple FCM setup guide](https://firebase.google.com/docs/cloud-messaging/ios/get-started) covers the console steps.

The invite page will be `https://YOUR_FIREBASE_PROJECT.web.app/invite/<code>` and redirects to `familylocator://invite/<code>`.

## Local iOS build

Use macOS with Xcode and CocoaPods:

```sh
npm ci
cd ios
bundle install
bundle exec pod install
cd ..
npx react-native run-ios --device
```

Open `ios/FamilyLocator.xcworkspace` for signing. Set the target’s bundle identifier and team. For a Personal Team, keep `FamilyLocator.entitlements`; for a paid account with Push Notifications enabled on the App ID and provisioning profile, use `FamilyLocatorPush.entitlements`.

On both phones, choose **Always Allow** when iOS offers the location upgrade and allow Motion/Notifications if prompted. Create one account, share an invite, create the second account, and accept the invite.

## GitHub Actions IPA

`ios-unsigned-ipa.yml` runs automatically on pushes to `main` and produces an unsigned IPA that Sideloadly can sign locally. It can compile without secrets by using the placeholder Firebase plist, but that artifact will not connect to Firebase until `GOOGLE_SERVICE_INFO_PLIST_BASE64` is configured.

The optional `ios-ipa.yml` workflow archives and exports a development-signed IPA when manually dispatched. Add these repository secrets:

| Secret | Value |
|---|---|
| `GOOGLE_SERVICE_INFO_PLIST_BASE64` | Base64 of the real Firebase plist |
| `IOS_CERTIFICATE_BASE64` | Base64 of the exported Apple Development `.p12` |
| `IOS_CERTIFICATE_PASSWORD` | Password used when exporting that `.p12` |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64 of the matching `.mobileprovision` |
| `KEYCHAIN_PASSWORD` | A random temporary CI keychain password |
| `APPLE_TEAM_ID` | Signing team ID |
| `IOS_BUNDLE_ID` | Exact App ID/bundle ID in the profile |
| `ENABLE_PUSH_NOTIFICATIONS` | `true` only when the profile contains `aps-environment` |

Run **Build signed iOS IPA** manually and download the `FamilyLocator-ipa` artifact. A sample schedule is left commented out because a workflow can rebuild with an existing profile but cannot renew an expired seven-day Personal Team profile; export and upload a fresh profile first.

## Validation

On any development machine:

```sh
npm run typecheck
npm run lint
npm test -- --runInBand
npm run functions:build
```

An actual iOS archive/pod integration must run on macOS. Test background movement, geofence transitions, speed thresholds, and crash candidates on physical devices. Simulator results are not representative for GPS, background execution, battery readings, accelerometer behavior, or APNs.

## Safety and privacy notes

- Crash detection is heuristic. Tune thresholds with controlled, non-dangerous tests; never stage a real crash or hard-stop test on public roads.
- A dropped phone, pothole, stale GPS point, force-quit app, disabled Background App Refresh, Low Power Mode, lost connectivity, or iOS scheduling can create false positives or delayed/missed alerts.
- No third-party monitoring or emergency calling is implemented.
- Firebase configuration files identify a project but are not server-admin credentials. Signing certificates, provisioning profiles, APNs keys, service-account keys, and CI secrets must never be committed.
- For a two-person project, review Firestore usage after the first week. A 45-second foreground interval on two devices is small, but history writes and listeners still count toward quota.
