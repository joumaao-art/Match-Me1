# MatchMe mobile architecture

This existing Expo project declares Expo ~57.0.7, React Native 0.86.0 and React 19.2.3. It has not been rebuilt or migrated. Dynamic configuration currently enables **Android only**; an `ios` object in the base configuration is not evidence of a valid iOS application.

## Active runtime

A real `EXPO_PUBLIC_MATCHME_WEB_ORIGIN` loads the canonical MatchMe site in `react-native-webview`. Authentication, candidate records, actions, skills, credits and subscriptions remain owned by the existing web/Supabase implementation. The native shell adds safe areas, Android history Back, native Share and incoming job-link continuation. It does not inject tokens into the WebView.

Missing/invalid origin now displays an honest bilingual configuration error. It no longer opens the old prototype navigator, whose Swipe screen contains mock jobs. Legacy files remain untouched but are not mounted by the root.

Android dynamic configuration preserves the package/domain validation, permits orientation changes, requests keyboard resizing and disables Android backup. All four safe-area edges are applied. These are source changes, **not native build/device certification**.

## Supported shared presentation

The web candidate experience stays mobile in a native WebView even when the window is wider than 768px. A web journey that begins or becomes compact retains its mobile component tree until a full document reload. Expanded Swipe/Dashboard and navigation use bounded widths. Normal wide desktop entry remains desktop; Company/Admin routes are excluded from retained-mobile forcing.

Width changes do not call auth, save, apply, credit or navigation mutations. This prevents the previous mobile/desktop component replacement on unfolding; it does not guarantee survival of OS process termination, or report actual hinge geometry.

## Required release work

See the frontend mobile compatibility report for the eighteen-section audit and test matrix. Native builds/device tests remain BLOCKED. Native iOS development is unavailable in this environment; no iOS configuration was enabled or certified. No new service, billing provider, schema, or production records were introduced.
