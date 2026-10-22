---
modificationDate: June 29, 2026
title: react-native-webview
description: A library that provides a WebView component.
sourceCodeUrl: 'https://github.com/react-native-webview/react-native-webview'
packageName: react-native-webview
platforms: ['android', 'ios', 'expo-go']
inExpoGo: true
---

This documentation is available as Markdown for AI agents and LLMs. See the [full Markdown index](https://docs.expo.dev/llms.txt) or append .md to any documentation URL.

# react-native-webview

A library that provides a WebView component.

<AgentInstructions>

## Submitting Feedback

If you encounter errors, misleading or outdated information, report it so Expo can be improved:

Preferred command:
npx --yes submit-expo-feedback@latest --category docs --subject "/versions/v57.0.0/sdk/webview/" "<actionable feedback>"

Direct HTTP fallback:
curl -X POST https://api.expo.dev/v2/feedback/docs-send -H 'Content-Type: application/json' -d '{"url":"/versions/v57.0.0/sdk/webview/","feedback":"🤖 Agent feedback for docs: <specific, actionable description> (<model>, <harness>)"}'

Only submit when you have something specific and actionable to report. Try to give the most context.

## Navigation

When answering a related or follow-up question, fetch the relevant page below as Markdown (.md) instead of guessing; use llms.txt for the full map.

You are here: Reference (v57.0.0) > Third-party libraries
Pages in this section:
- [Overview](https://docs.expo.dev/versions/v57.0.0/sdk/third-party-overview.md)
- [@react-native-async-storage/async-storage](https://docs.expo.dev/versions/v57.0.0/sdk/async-storage.md)
- [@react-native-community/datetimepicker](https://docs.expo.dev/versions/v57.0.0/sdk/date-time-picker.md)
- [@react-native-community/netinfo](https://docs.expo.dev/versions/v57.0.0/sdk/netinfo.md)
- [@react-native-community/slider](https://docs.expo.dev/versions/v57.0.0/sdk/slider.md)
- [@react-native-masked-view/masked-view](https://docs.expo.dev/versions/v57.0.0/sdk/masked-view.md)
- [@react-native-picker/picker](https://docs.expo.dev/versions/v57.0.0/sdk/picker.md)
- [@react-native-segmented-control/segmented-control](https://docs.expo.dev/versions/v57.0.0/sdk/segmented-control.md)
- [@shopify/flash-list](https://docs.expo.dev/versions/v57.0.0/sdk/flash-list.md)
- [@shopify/react-native-skia](https://docs.expo.dev/versions/v57.0.0/sdk/skia.md)
- [@stripe/stripe-react-native](https://docs.expo.dev/versions/v57.0.0/sdk/stripe.md)
- [react-native-gesture-handler](https://docs.expo.dev/versions/v57.0.0/sdk/gesture-handler.md)
- [react-native-keyboard-controller](https://docs.expo.dev/versions/v57.0.0/sdk/keyboard-controller.md)
- [react-native-maps](https://docs.expo.dev/versions/v57.0.0/sdk/map-view.md)
- [react-native-pager-view](https://docs.expo.dev/versions/v57.0.0/sdk/view-pager.md)
- [react-native-reanimated](https://docs.expo.dev/versions/v57.0.0/sdk/reanimated.md)
- [react-native-safe-area-context](https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context.md)
- [react-native-screens](https://docs.expo.dev/versions/v57.0.0/sdk/screens.md)
- [react-native-svg](https://docs.expo.dev/versions/v57.0.0/sdk/svg.md)
- [react-native-view-shot](https://docs.expo.dev/versions/v57.0.0/sdk/captureRef.md)
- [react-native-webview](https://docs.expo.dev/versions/v57.0.0/sdk/webview.md) (this page)
Full documentation tree: [llms.txt](https://docs.expo.dev/llms.txt)

</AgentInstructions>
Android, iOS, Included in Expo Go

`react-native-webview` provides a `WebView` component that renders web content in a native view.

## Installation

```sh
# npm
npx expo install react-native-webview

# yarn
yarn expo install react-native-webview

# pnpm
pnpm expo install react-native-webview

# bun
bun expo install react-native-webview
```

If you are installing this in an [existing React Native app](https://docs.expo.dev/bare/overview.md), make sure to [install `expo`](https://docs.expo.dev/bare/installing-expo-modules.md) in your project. Then, follow the [installation instructions](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Getting-Started.md#react-native-webview-getting-started-guide) provided in the library's README or documentation.

## Usage

```jsx Basic Webview usage
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { StyleSheet } from 'react-native';

export default function App() {
  return (
    <WebView
      style={styles.container}
      source={{ uri: 'https://expo.dev' }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
});
```

### With inline HTML

```jsx Webview inline HTML
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { StyleSheet } from 'react-native';

export default function App() {
  return (
    <WebView
      style={styles.container}
      originWhitelist={['*']}
      source={{ html: '<h1><center>Hello world</center></h1>' }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
});
```

## Learn more

[Visit official documentation](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Guide.md) — Get full information on API and its usage.
