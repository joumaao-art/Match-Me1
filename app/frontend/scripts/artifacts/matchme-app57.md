---
modificationDate: September 17, 2026
title: app.json / app.config.js
description: A reference of available properties in Expo app config.
---

This documentation is available as Markdown for AI agents and LLMs. See the [full Markdown index](https://docs.expo.dev/llms.txt) or append .md to any documentation URL.

# app.json / app.config.js

A reference of available properties in Expo app config.

<AgentInstructions>

## Submitting Feedback

If you encounter errors, misleading or outdated information, report it so Expo can be improved:

Preferred command:
npx --yes submit-expo-feedback@latest --category docs --subject "/versions/v57.0.0/config/app/" "<actionable feedback>"

Direct HTTP fallback:
curl -X POST https://api.expo.dev/v2/feedback/docs-send -H 'Content-Type: application/json' -d '{"url":"/versions/v57.0.0/config/app/","feedback":"🤖 Agent feedback for docs: <specific, actionable description> (<model>, <harness>)"}'

Only submit when you have something specific and actionable to report. Try to give the most context.

## Navigation

When answering a related or follow-up question, fetch the relevant page below as Markdown (.md) instead of guessing; use llms.txt for the full map.

You are here: Reference (v57.0.0) > Configuration files
Pages in this section:
- [app.json / app.config.js](https://docs.expo.dev/versions/v57.0.0/config/app.md) (this page)
- [babel.config.js](https://docs.expo.dev/versions/v57.0.0/config/babel.md)
- [metro.config.js](https://docs.expo.dev/versions/v57.0.0/config/metro.md)
- [package.json](https://docs.expo.dev/versions/v57.0.0/config/package-json.md)
Full documentation tree: [llms.txt](https://docs.expo.dev/llms.txt)

</AgentInstructions>

The following is a list of properties that are available for you under the `"expo"` key in **app.json** or **app.config.json**. These properties can be passed to the top level object of **app.config.js** or **app.config.ts**.

[Configuration with app config](https://docs.expo.dev/workflow/configuration.md) — For information on app configuration, the differences between various app config files, and how to use them dynamically.

## Properties

### `name`

Type: `string`

The name of your app as it appears both within Expo Go and on your home screen as a standalone app.

#### Existing React Native app?

To change the name of your app, edit the 'Display Name' field in Xcode and the `app_name` string in `android/app/src/main/res/values/strings.xml`

### `description`

Type: `string`

A short description of what your app is and why it is great.

### `slug`

Type: `string`

A URL-friendly name for your project that is unique across your account.

### `owner`

Type: `string`

The name of the Expo account that owns the project. This is useful for teams collaborating on a project. If not provided, the owner defaults to the username of the current user.

### `currentFullName`

Type: `string`

The auto generated Expo account name and slug used for display purposes. It is not meant to be set directly. Formatted like `@username/slug`. When unauthenticated, the username is `@anonymous`. For published projects, this value may change when a project is transferred between accounts or renamed.

### `originalFullName`

Type: `string`

The auto generated Expo account name and slug used for services like Notifications and AuthSession proxy. It is not meant to be set directly. Formatted like `@username/slug`. When unauthenticated, the username is `@anonymous`. For published projects, this value will not change when a project is transferred between accounts or renamed.

### `sdkVersion`

Type: `string`

The Expo sdkVersion to run the project on. This should line up with the version specified in your package.json.

### `runtimeVersion`

One of types:

-   `string` matching the following pattern: `^[a-zA-Z\d][a-zA-Z\d._+()-]{0,254}$`
-   `string` matching the following pattern: `^exposdk:((\d+\.\d+\.\d+)|(UNVERSIONED))$`
-   An `object` with the following properties:
    
    #### `policy`
    
    Type: `enum` • Path: `runtimeVersion.policy`
    
    Valid values: `nativeVersion`, `sdkVersion`, `appVersion`, `fingerprint`.
    

Property indicating compatibility between a build's native code and an OTA update.

### `version`

Type: `string`

Your app version. In addition to this field, you'll also use `ios.buildNumber` and `android.versionCode` — read more about how to version your app [here](https://docs.expo.dev/build-reference/app-versions.md). On iOS this corresponds to `CFBundleShortVersionString`, and on Android, this corresponds to `versionName`. The required format can be found [here](https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleshortversionstring).

#### Existing React Native app?

To change your app version, edit the 'Version' field in Xcode and the `versionName` string in `android/app/build.gradle`

### `platforms`

Type: `array`

Platforms that your project explicitly supports. If not specified, it defaults to `["ios", "android"]`. If `react-dom` is installed, `web` is also included by default.

Example

`[ "ios", "android", "web" ]`

### `githubUrl`

Type: `string`

If you would like to share the source code of your app on Github, enter the URL for the repository here and it will be linked to from your Expo project page.

Example

`"https://github.com/expo/expo"`

### `orientation`

Type: `enum` • One of: `default`, `portrait`, `landscape`

Locks your app to a specific orientation with portrait or landscape. Defaults to no lock. Valid values: `default`, `portrait`, `landscape`

### `userInterfaceStyle`

Type: `enum` • One of: `light`, `dark`, `automatic`

Configuration to force the app to always use the light or dark user-interface appearance, such as "dark mode", or make it automatically adapt to the system preferences. If not provided, defaults to `light`. Requires `expo-system-ui` be installed in your project to work on Android.

### `backgroundColor`

Type: `string`

The background color for your app, behind any of your React views. This is also known as the root view background color. Requires `expo-system-ui` be installed in your project to work on iOS.

6 character long hex color string, for example, `'#000000'`. Default is white: `'#ffffff'`

### `primaryColor`

Type: `string`

On Android, this will determine the color of your app in the multitasker. Currently this is not used on iOS, but it may be used for other purposes in the future.

6 character long hex color string, for example, `'#000000'`

### `icon`

Type: `string`

Local path or remote URL to an image to use for your app's icon. We recommend that you use a 1024x1024 png file. This icon will appear on the home screen and within the Expo Go app.

#### Existing React Native app?

To change your app's icon, edit or replace the files in `ios/<PROJECT-NAME>/Assets.xcassets/AppIcon.appiconset` (we recommend using Xcode), and `android/app/src/main/res/mipmap-<RESOLUTION>`. Be sure to follow the guidelines for each platform ([iOS](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/), [Android 7.1 and below](https://material.io/design/iconography/#icon-treatments), and [Android 8+](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)) and to provide your new icon in each existing size.

### `androidStatusBar`

Type: `object`

Configuration for the status bar on Android. For more details navigate to [Configuring StatusBar](https://docs.expo.dev/develop/user-interface/system-bars.md). @deprecated Use the `expo-status-bar` plugin configuration instead

#### `barStyle`

Type: `enum` • One of: `light-content`, `dark-content` • Path: `androidStatusBar.barStyle`

Configures the status bar icons to have a light or dark color. Valid values: `light-content`, `dark-content`. Defaults to `dark-content`

#### `backgroundColor`

Type: `string` • Path: `androidStatusBar.backgroundColor`

Specifies the background color of the status bar. Defaults to `#00000000` (transparent) for `dark-content` bar style and `#00000088` (semi-transparent black) for `light-content` bar style

6 character long hex color string `'#RRGGBB'`, for example, `'#000000'` for black. Or 8 character long hex color string `'#RRGGBBAA'`, for example, `'#00000088'` for semi-transparent black.

#### `hidden`

Type: `boolean` • Path: `androidStatusBar.hidden`

Instructs the system whether the status bar should be visible or not. Defaults to `false`

#### `translucent`

Type: `boolean` • Path: `androidStatusBar.translucent`

When false, the system status bar pushes the content of your app down (similar to `position: relative`). When true, the status bar floats above the content in your app (similar to `position: absolute`). Defaults to `true` to match the iOS status bar behavior (which can only float above content). Explicitly setting this property to `true` will add `android:windowTranslucentStatus` to `styles.xml` and may cause unexpected keyboard behavior on Android when using the `softwareKeyboardLayoutMode` set to `resize`. In this case you will have to use `KeyboardAvoidingView` to manage the keyboard layout.

### `developmentClient`

Type: `object`

Settings that apply specifically to running this app in a development client

#### `silentLaunch`

Type: `boolean` • Path: `developmentClient.silentLaunch`

If true, the app will launch in a development client with no additional dialogs or progress indicators, just like in a standalone app.

### `scheme`

One of types:

-   `string` matching the following pattern: `^[a-z][a-z0-9+.-]*$`
`{ "type": "array", "items": { "type": "string", "pattern": "^[a-z][a-z0-9+.-]*$" } }`

URL scheme(s) to link into your app. For example, if we set this to `'demo'`, then demo:// URLs would open your app when tapped. This is a build-time configuration, it has no effect in Expo Go.

String beginning with a **lowercase** letter followed by any combination of **lowercase** letters, digits, "+", "." or "-"

#### Existing React Native app?

To change your app's scheme, replace all occurrences of the old scheme in `Info.plist` and `AndroidManifest.xml`

### `extra`

Type: `object`

Any extra fields you want to pass to your experience. Values are accessible via `Constants.expoConfig.extra` ([Learn more](https://docs.expo.dev/versions/latest/sdk/constants.md#nativeconstants))

### `updates`

Type: `object`

Configuration for the expo-updates library

#### `enabled`

Type: `boolean` • Path: `updates.enabled`

Whether the updates system will run. Defaults to true. If set to false, builds will only use code and assets bundled at time of build.

#### `checkAutomatically`

Type: `enum` • One of: `ON_ERROR_RECOVERY`, `ON_LOAD`, `WIFI_ONLY`, `NEVER` • Path: `updates.checkAutomatically`

By default, expo-updates will check for updates every time the app is loaded. Set this to `ON_ERROR_RECOVERY` to disable automatic checking unless recovering from an error. Set this to `NEVER` to disable automatic checking. Valid values: `ON_LOAD` (default value), `ON_ERROR_RECOVERY`, `WIFI_ONLY`, `NEVER`

#### `useEmbeddedUpdate`

Type: `boolean` • Path: `updates.useEmbeddedUpdate`

Whether to load the embedded update. Defaults to true. If set to false, an update will be fetched at launch. When set to false, ensure that `checkAutomatically` is set to `ON_LOAD` and `fallbackToCacheTimeout` is large enough for the initial remote update to download. This should not be used in production.

#### `fallbackToCacheTimeout`

Type: `number` • Path: `updates.fallbackToCacheTimeout`

How long (in ms) to wait for the app to check for and fetch a new update upon launch before falling back to the most recent update already present on the device. Defaults to 0. Must be between 0 and 300000 (5 minutes). If the startup update check takes longer than this value, any update downloaded during the check will be applied upon the next app launch.

#### `url`

Type: `string` • Path: `updates.url`

URL from which expo-updates will fetch update manifests

#### `codeSigningCertificate`

Type: `string` • Path: `updates.codeSigningCertificate`

Local path of a PEM-formatted X.509 certificate used for verifying codesigned updates. When provided, all updates downloaded by expo-updates must be signed.

#### `codeSigningMetadata`

Type: `object` • Path: `updates.codeSigningMetadata`

Metadata for `codeSigningCertificate`

##### `alg`

Type: `enum` • One of: `rsa-v1_5-sha256` • Path: `updates.codeSigningMetadata.alg`

Algorithm used to generate manifest code signing signature. Valid values: `rsa-v1_5-sha256`

##### `keyid`

Type: `string` • Path: `updates.codeSigningMetadata.keyid`

Identifier for the key in the certificate. Used to instruct signing mechanisms when signing or verifying signatures.

#### `requestHeaders`

Type: `object` • Path: `updates.requestHeaders`

Extra HTTP headers to include in HTTP requests made by `expo-updates` when fetching manifests or assets. These may override preset headers.

#### `assetPatternsToBeBundled`

Type: `array` • Path: `updates.assetPatternsToBeBundled`

Array of glob patterns specifying which files should be included in updates. Glob patterns are relative to the project root. A value of `['**']` will match all asset files within the project root. When not supplied all asset files will be included. Example: Given a value of `['app/images/**/*.png', 'app/fonts/**/*.woff']` all `.png` files in all subdirectories of `app/images` and all `.woff` files in all subdirectories of `app/fonts` will be included in updates.

#### `disableAntiBrickingMeasures`

Type: `boolean` • Path: `updates.disableAntiBrickingMeasures`

Whether to disable the built-in expo-updates anti-bricking measures. Defaults to false. If set to true, this will allow overriding certain configuration options from the JS API, which is liable to leave an app in a bricked state if not done carefully. This should not be used in production.

#### `useNativeDebug`

Type: `boolean` • Path: `updates.useNativeDebug`

Enable debugging of native code with updates enabled. Defaults to false. If set to true, the EX_UPDATES_NATIVE_DEBUG environment variable will be set in Podfile.properties.json and gradle.properties. This causes Xcode and Android Studio debug builds to be built with expo-updates enabled, and JS debugging (with dev client or packager) disabled. This should not be used in production.

#### `enableBsdiffPatchSupport`

Type: `boolean` • Path: `updates.enableBsdiffPatchSupport`

Whether to enable support for downloading and applying bundle diffs using bsdiff. Defaults to true.

### `locales`

Type: `object`

Provide per-locale values for System Dialog prompts such as Permissions Boxes, and create Localizable.strings file to localize (for example) push notifications. Platform-specific locale strings should be nested under `ios` and `android` keys.

#### Existing React Native app?

To add or change language and localization information in your iOS app, you need to use Xcode.

### `plugins`

Type: `array`

Config plugins for adding extra functionality to your project. [Learn more](https://docs.expo.dev/config-plugins/introduction.md).

#### Existing React Native app?

Plugins that add modifications can only be used with [prebuilding](https://expo.fyi/prebuilding) and managed EAS Build

### `buildCacheProvider`

Type: `undefined`

Enable downloading cached builds from remote.

### `ios`

Type: `object`

Configuration that is specific to the iOS platform.

#### `appleTeamId`

Type: `string` • Path: `ios.appleTeamId`

The Apple development team ID to use for all native targets. You can find your team ID in [the Apple Developer Portal](https://developer.apple.com/help/account/manage-your-team/locate-your-team-id/).

#### `publishManifestPath`

Type: `string` • Path: `ios.publishManifestPath`

The manifest for the iOS version of your app will be written to this path during publish.

#### `publishBundlePath`

Type: `string` • Path: `ios.publishBundlePath`

The bundle for the iOS version of your app will be written to this path during publish.

#### `bundleIdentifier`

Type: `string` • Path: `ios.bundleIdentifier`

The bundle identifier for your iOS standalone app. You make it up, but it needs to be unique on the App Store. See [this StackOverflow question](http://stackoverflow.com/questions/11347470/what-does-bundle-identifier-mean-in-the-ios-project).

iOS bundle identifier notation unique name for your app. For example, `host.exp.expo`, where `exp.host` is our domain and `expo` is our app name.

#### Existing React Native app?

Set this value in `info.plist` under `CFBundleIdentifier`

#### `buildNumber`

Type: `string` • Path: `ios.buildNumber`

Build number for your iOS standalone app. Corresponds to `CFBundleVersion` and must match Apple's [specified format](https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleversion). (Note: Transporter will pull the value for `Version Number` from `expo.version` and NOT from `expo.ios.buildNumber`.)

#### Existing React Native app?

Set this value in `info.plist` under `CFBundleVersion`

#### `deploymentTarget`

Type: `string` • Path: `ios.deploymentTarget`

Sets the iOS deployment target (minimum iOS version). The value should be in the format `MAJOR.MINOR` (e.g., `"18.6"`) or just a major version (e.g., `"26"`). This sets the minimum iOS version your app will support.

#### Existing React Native app?

Set this value in your Xcode project's build settings under `IPHONEOS_DEPLOYMENT_TARGET`

#### `backgroundColor`

Type: `string` • Path: `ios.backgroundColor`

The background color for your iOS app, behind any of your React views. Overrides the top-level `backgroundColor` key if it is present. Requires `expo-system-ui` be installed in your project to work on iOS.

6 character long hex color string, for example, `'#000000'`

#### `scheme`

One of types:

-   `string` matching the following pattern: `^[a-z][a-z0-9+.-]*$`
`{ "type": "array", "items": { "type": "string", "pattern": "^[a-z][a-z0-9+.-]*$" } }`

URL scheme(s) to link into your iOS app. Schemes added to this field will be merged with the schemes in the `scheme` key at the top level of the config.

String beginning with a **lowercase** letter followed by any combination of **lowercase** letters, digits, "+", "." or "-"

#### Existing React Native app?

To change your app's scheme, replace all occurrences of the old scheme in `Info.plist` and `AndroidManifest.xml`

#### `icon`

One of types:

-   `string` matching the following pattern: `\.icon$`
-   `string`
-   An `object` with the following properties:
    
    ##### `light`
    
    Type: `string` • Path: `ios.icon.light`
    
    The light icon. It will appear when neither dark nor tinted icons are used, or if they are not provided.
    
    ##### `dark`
    
    Type: `string` • Path: `ios.icon.dark`
    
    The dark icon. It will appear for the app when the user's system appearance is dark. See Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons#iOS-iPadOS) for more information.
    
    ##### `tinted`
    
    Type: `string` • Path: `ios.icon.tinted`
    
    The tinted icon. It will appear for the app when the user's system appearance is tinted. See Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons#iOS-iPadOS) for more information.
    

Local path or remote URL to an image to use for your app's icon on iOS. Alternatively, an object specifying different icons for various system appearances (e.g., dark, tinted) can be provided. You can also provide a path to a .icon directory. If specified, this overrides the top-level `icon` key. Use a 1024x1024 icon which follows Apple's interface guidelines for icons, including color profile and transparency.

Expo will generate the other required sizes. This icon will appear on the home screen and within the Expo Go app.

#### `appStoreUrl`

Type: `string` • Path: `ios.appStoreUrl`

URL to your app on the Apple App Store, if you have deployed it there. This is used to link to your store page from your Expo project page if your app is public.

Example

`"https://apps.apple.com/us/app/expo-client/id982107779"`

#### `bitcode`

Type: `undefined` • Path: `ios.bitcode`

Enable iOS Bitcode optimizations in the native build. Accepts the name of an iOS build configuration to enable for a single configuration and disable for all others, e.g. Debug, Release. Not available in Expo Go. Defaults to `undefined` which uses the template's predefined settings.

#### `config`

Type: `object` • Path: `ios.config`

Note: This property key is not included in the production manifest and will evaluate to `undefined`. It is used internally only in the build process, because it contains API keys that some may want to keep private.

##### `usesNonExemptEncryption`

Type: `boolean` • Path: `ios.config.usesNonExemptEncryption`

Sets `ITSAppUsesNonExemptEncryption` in the standalone ipa's Info.plist to the given boolean value.

##### `googleMapsApiKey`

Type: `string` • Path: `ios.config.googleMapsApiKey`

[Google Maps iOS SDK](https://developers.google.com/maps/documentation/ios-sdk/start) key for your standalone app.

#### `googleServicesFile`

Type: `string` • Path: `ios.googleServicesFile`

[Firebase Configuration File](https://support.google.com/firebase/answer/7015592) Location of the `GoogleService-Info.plist` file for configuring Firebase.

#### `supportsTablet`

Type: `boolean` • Path: `ios.supportsTablet`

Whether your standalone iOS app supports tablet screen sizes. Defaults to `false`.

#### Existing React Native app?

Set this value in `info.plist` under `UISupportedInterfaceOrientations~ipad`

#### `isTabletOnly`

Type: `boolean` • Path: `ios.isTabletOnly`

If true, indicates that your standalone iOS app does not support handsets, and only supports tablets.

#### Existing React Native app?

Set this value in `info.plist` under `UISupportedInterfaceOrientations`

#### `requireFullScreen`

Type: `boolean` • Path: `ios.requireFullScreen`

If true, indicates that your standalone iOS app does not support Slide Over and Split View on iPad. Defaults to `false`

#### Existing React Native app?

Use Xcode to set `UIRequiresFullScreen`

#### `userInterfaceStyle`

Type: `enum` • One of: `light`, `dark`, `automatic` • Path: `ios.userInterfaceStyle`

Configuration to force the app to always use the light or dark user-interface appearance, such as "dark mode", or make it automatically adapt to the system preferences. If not provided, defaults to `light`.

#### `infoPlist`

Type: `object` • Path: `ios.infoPlist`

Dictionary of arbitrary configuration to add to your standalone app's native Info.plist. Applied prior to all other Expo-specific configuration. No other validation is performed, so use this at your own risk of rejection from the App Store.

#### `entitlements`

Type: `object` • Path: `ios.entitlements`

Dictionary of arbitrary configuration to add to your standalone app's native \*.entitlements (plist). Applied prior to all other Expo-specific configuration. No other validation is performed, so use this at your own risk of rejection from the App Store.

#### `privacyManifests`

Type: `object` • Path: `ios.privacyManifests`

Dictionary of privacy manifest definitions to add to your app's native PrivacyInfo.xcprivacy file. [Learn more](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)

##### `NSPrivacyAccessedAPITypes`

Type: `array` • Path: `ios.privacyManifests.NSPrivacyAccessedAPITypes`

A list of required reasons of why your app uses restricted API categories. [Learn more](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files/describing_use_of_required_reason_api)

##### `NSPrivacyAccessedAPIType`

Type: `string` • Path: `ios.privacyManifests.NSPrivacyAccessedAPITypes.NSPrivacyAccessedAPIType`

A string that identifies the category of required reason APIs your app uses

##### `NSPrivacyAccessedAPITypeReasons`

Type: `array` • Path: `ios.privacyManifests.NSPrivacyAccessedAPITypes.NSPrivacyAccessedAPITypeReasons`

A list of reasons for a specific category.

##### `NSPrivacyTrackingDomains`

Type: `array` • Path: `ios.privacyManifests.NSPrivacyTrackingDomains`

A list of domains that your app uses for tracking.

##### `NSPrivacyTracking`

Type: `boolean` • Path: `ios.privacyManifests.NSPrivacyTracking`

A Boolean that indicates whether your app or third-party SDK uses data for tracking.

##### `NSPrivacyCollectedDataTypes`

Type: `array` • Path: `ios.privacyManifests.NSPrivacyCollectedDataTypes`

A list of collected data types that your app uses.

##### `NSPrivacyCollectedDataType`

Type: `string` • Path: `ios.privacyManifests.NSPrivacyCollectedDataTypes.NSPrivacyCollectedDataType`

##### `NSPrivacyCollectedDataTypeLinked`

Type: `boolean` • Path: `ios.privacyManifests.NSPrivacyCollectedDataTypes.NSPrivacyCollectedDataTypeLinked`

##### `NSPrivacyCollectedDataTypeTracking`

Type: `boolean` • Path: `ios.privacyManifests.NSPrivacyCollectedDataTypes.NSPrivacyCollectedDataTypeTracking`

##### `NSPrivacyCollectedDataTypePurposes`

Type: `array` • Path: `ios.privacyManifests.NSPrivacyCollectedDataTypes.NSPrivacyCollectedDataTypePurposes`

#### `associatedDomains`

Type: `array` • Path: `ios.associatedDomains`

An array that contains Associated Domains for the standalone app. [Learn more](https://developer.apple.com/documentation/safariservices/supporting_associated_domains).

Entries must follow the format `applinks:<fully qualified domain>[:port number]`. [Learn more](https://developer.apple.com/documentation/safariservices/supporting_associated_domains).

#### Existing React Native app?

Build with EAS, or use Xcode to enable this capability manually. [Learn more](https://developer.apple.com/documentation/safariservices/supporting_associated_domains).

#### `usesIcloudStorage`

Type: `boolean` • Path: `ios.usesIcloudStorage`

A boolean indicating if the app uses iCloud Storage for `DocumentPicker`. See `DocumentPicker` docs for details.

#### Existing React Native app?

Use Xcode, or ios.entitlements to configure this.

#### `usesAppleSignIn`

Type: `boolean` • Path: `ios.usesAppleSignIn`

A boolean indicating if the app uses Apple Sign-In. See `AppleAuthentication` docs for details.

#### `usesBroadcastPushNotifications`

Type: `boolean` • Path: `ios.usesBroadcastPushNotifications`

A boolean indicating if the app uses Push Notifications Broadcast option for Push Notifications capability. If true, EAS CLI will use the value during capability syncing. If EAS CLI is not used, this configuration will not have any effect unless another tool is used to operate on it, so enable the capability manually on the Apple Developer Portal in that case.

#### `accessesContactNotes`

Type: `boolean` • Path: `ios.accessesContactNotes`

A Boolean value that indicates whether the app may access the notes stored in contacts. You must [receive permission from Apple](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_contacts_notes) before you can submit your app for review with this capability.

#### `runtimeVersion`

One of types:

-   `string` matching the following pattern: `^[a-zA-Z\d][a-zA-Z\d._+()-]{0,254}$`
-   `string` matching the following pattern: `^exposdk:((\d+\.\d+\.\d+)|(UNVERSIONED))$`
-   An `object` with the following properties:
    
    ##### `policy`
    
    Type: `enum` • Path: `ios.runtimeVersion.policy`
    
    Valid values: `nativeVersion`, `sdkVersion`, `appVersion`, `fingerprint`.
    

Property indicating compatibility between an iOS build's native code and an OTA update for the iOS platform. If provided, this will override the value of the top level `runtimeVersion` key on iOS.

#### `version`

Type: `string` • Path: `ios.version`

Your iOS app version. Takes precedence over the root `version` field. In addition to this field, you'll also use `ios.buildNumber` — read more about how to version your app [here](https://docs.expo.dev/build-reference/app-versions.md). This corresponds to `CFBundleShortVersionString`. The required format can be found [here](https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleshortversionstring).

#### Existing React Native app?

To change your app version, edit the 'Version' field in Xcode\`

### `android`

Type: `object`

Configuration that is specific to the Android platform.

#### `publishManifestPath`

Type: `string` • Path: `android.publishManifestPath`

The manifest for the Android version of your app will be written to this path during publish.

#### `publishBundlePath`

Type: `string` • Path: `android.publishBundlePath`

The bundle for the Android version of your app will be written to this path during publish.

#### `package`

Type: `string` • Path: `android.package`

The package name for your Android standalone app. You make it up, but it needs to be unique on the Play Store. See [this StackOverflow question](http://stackoverflow.com/questions/6273892/android-package-name-convention).

Reverse DNS notation unique name for your app. Valid Android Application ID. For example, `com.example.app`, where `com.example` is our domain and `app` is our app. The name may only contain lowercase and uppercase letters (a-z, A-Z), numbers (0-9) and underscores (_), separated by periods (.). Each component of the name should start with a lowercase letter.

#### Existing React Native app?

This is set in `android/app/build.gradle` as `applicationId` as well as in your `AndroidManifest.xml` file (multiple places).

#### `versionCode`

Type: `integer` • Path: `android.versionCode`

Version number required by Google Play. Increment by one for each release. Must be a positive integer. [Learn more](https://developer.android.com/studio/publish/versioning.html)

#### Existing React Native app?

This is set in `android/app/build.gradle` as `versionCode`

#### `backgroundColor`

Type: `string` • Path: `android.backgroundColor`

The background color for your Android app, behind any of your React views. Overrides the top-level `backgroundColor` key if it is present.

6 character long hex color string, for example, `'#000000'`

#### Existing React Native app?

This is set in `android/app/src/main/AndroidManifest.xml` under `android:windowBackground`

#### `userInterfaceStyle`

Type: `enum` • One of: `light`, `dark`, `automatic` • Path: `android.userInterfaceStyle`

Configuration to force the app to always use the light or dark user-interface appearance, such as "dark mode", or make it automatically adapt to the system preferences. If not provided, defaults to `light`. Requires `expo-system-ui` be installed in your project to work on Android.

#### `scheme`

One of types:

-   `string` matching the following pattern: `^[a-z][a-z0-9+.-]*$`
`{ "type": "array", "items": { "type": "string", "pattern": "^[a-z][a-z0-9+.-]*$" } }`

URL scheme(s) to link into your Android app. Schemes added to this field will be merged with the schemes in the `scheme` key at the top level of the config.

String beginning with a **lowercase** letter followed by any combination of **lowercase** letters, digits, "+", "." or "-"

#### Existing React Native app?

To change your app's scheme, replace all occurrences of the old scheme in `Info.plist` and `AndroidManifest.xml`

#### `icon`

Type: `string` • Path: `android.icon`

Local path or remote URL to an image to use for your app's icon on Android. If specified, this overrides the top-level `icon` key. We recommend that you use a 1024x1024 png file (transparency is recommended for the Google Play Store). This icon will appear on the home screen and within the Expo Go app.

#### `adaptiveIcon`

Type: `object` • Path: `android.adaptiveIcon`

Settings for an Adaptive Launcher Icon on Android. [Learn more](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)

##### `foregroundImage`

Type: `string` • Path: `android.adaptiveIcon.foregroundImage`

Local path or remote URL to an image to use for your app's icon on Android. If specified, this overrides the top-level `icon` and the `android.icon` keys. Should follow the [specified guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive). This icon will appear on the home screen.

##### `monochromeImage`

Type: `string` • Path: `android.adaptiveIcon.monochromeImage`

Local path or remote URL to an image representing the Android 13+ monochromatic icon. Should follow the [specified guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive). This icon will appear on the home screen when the user enables 'Themed icons' in system settings on a device running Android 13+.

##### `backgroundImage`

Type: `string` • Path: `android.adaptiveIcon.backgroundImage`

Local path or remote URL to a background image for your app's Adaptive Icon on Android. If specified, this overrides the `backgroundColor` key. Must have the same dimensions as `foregroundImage`, and has no effect if `foregroundImage` is not specified. Should follow the [specified guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive).

##### `backgroundColor`

Type: `string` • Path: `android.adaptiveIcon.backgroundColor`

Color to use as the background for your app's Adaptive Icon on Android. Defaults to white, `#FFFFFF`. Has no effect if `foregroundImage` is not specified.

6 character long hex color string, for example, `'#000000'`

#### `playStoreUrl`

Type: `string` • Path: `android.playStoreUrl`

URL to your app on the Google Play Store, if you have deployed it there. This is used to link to your store page from your Expo project page if your app is public.

Example

`"https://play.google.com/store/apps/details?id=host.exp.exponent"`

#### `permissions`

Type: `array` • Path: `android.permissions`

A list of permissions to add to the app `AndroidManifest.xml` during prebuild. For example: `['android.permission.SCHEDULE_EXACT_ALARM']`

#### Existing React Native app?

To change the permissions your app requests, edit `AndroidManifest.xml` directly. To prevent your app from requesting specific permissions (which may automatically be added through an installed native package), add those permissions to `AndroidManifest.xml` along with a `tools:node="remove"` tag.

#### `blockedPermissions`

Type: `array` • Path: `android.blockedPermissions`

List of permissions to block in the final `AndroidManifest.xml`. This is useful for removing permissions that are added by native package `AndroidManifest.xml` files which are merged into the final manifest. Internally this feature uses the `tools:node="remove"` XML attribute to remove permissions. Not available in Expo Go.

#### `googleServicesFile`

Type: `string` • Path: `android.googleServicesFile`

[Firebase Configuration File](https://support.google.com/firebase/answer/7015592) Location of the `google-services.json` file for configuring Firebase. Including this key automatically enables FCM in your standalone app.

#### Existing React Native app?

Add or edit the file directly at `android/app/google-services.json`

#### `config`

Type: `object` • Path: `android.config`

Note: This property key is not included in the production manifest and will evaluate to `undefined`. It is used internally only in the build process, because it contains API keys that some may want to keep private.

##### `googleMaps`

Type: `object` • Path: `android.config.googleMaps`

[Google Maps Android SDK](https://developers.google.com/maps/documentation/android-api/signup) configuration for your standalone app.

##### `apiKey`

Type: `string` • Path: `android.config.googleMaps.apiKey`

Your Google Maps Android SDK API key

#### `intentFilters`

Type: `array` • Path: `android.intentFilters`

Configuration for setting an array of custom intent filters in Android manifest. [Learn more](https://developer.android.com/guide/components/intents-filters)

#### Existing React Native app?

This is set in `AndroidManifest.xml` directly. [Learn more.](https://developer.android.com/guide/components/intents-filters)

Example

`[ { "autoVerify": true, "action": "VIEW", "data": { "scheme": "https", "host": "*.example.com" }, "category": [ "BROWSABLE", "DEFAULT" ] } ]`

##### `autoVerify`

Type: `boolean` • Path: `android.intentFilters.autoVerify`

You may also use an intent filter to set your app as the default handler for links (without showing the user a dialog with options). To do so use `true` and then configure your server to serve a JSON file verifying that you own the domain. [Learn more](https://developer.android.com/training/app-links)

##### `action`

Type: `string` • Path: `android.intentFilters.action`

##### `data`

Type: `undefined` • Path: `android.intentFilters.data`

##### `category`

Type: `undefined` • Path: `android.intentFilters.category`

#### `allowBackup`

Type: `boolean` • Path: `android.allowBackup`

Allows your user's app data to be automatically backed up to their Google Drive. If this is set to false, no backup or restore of the application will ever be performed (this is useful if your app deals with sensitive information). Defaults to the Android default, which is `true`.

#### `softwareKeyboardLayoutMode`

Type: `enum` • One of: `resize`, `pan` • Path: `android.softwareKeyboardLayoutMode`

Determines how the software keyboard will impact the layout of your application. This maps to the `android:windowSoftInputMode` property. Defaults to `resize`. Valid values: `resize`, `pan`.

#### `runtimeVersion`

One of types:

-   `string` matching the following pattern: `^[a-zA-Z\d][a-zA-Z\d._+()-]{0,254}$`
-   `string` matching the following pattern: `^exposdk:((\d+\.\d+\.\d+)|(UNVERSIONED))$`
-   An `object` with the following properties:
    
    ##### `policy`
    
    Type: `enum` • Path: `android.runtimeVersion.policy`
    
    Valid values: `nativeVersion`, `sdkVersion`, `appVersion`, `fingerprint`.
    

Property indicating compatibility between a Android build's native code and an OTA update for the Android platform. If provided, this will override the value of top level `runtimeVersion` key on Android.

#### `version`

Type: `string` • Path: `android.version`

Your android app version. Takes precedence over the root `version` field. In addition to this field, you'll also use `android.versionCode` — read more about how to version your app [here](https://docs.expo.dev/build-reference/app-versions.md). This corresponds to `versionName`. The required format can be found [here](https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleshortversionstring).

#### Existing React Native app?

To change your app version, edit the `versionName` string in `android/app/build.gradle`

#### `predictiveBackGestureEnabled`

Type: `boolean` • Path: `android.predictiveBackGestureEnabled`

Enable your app to use the [predictive back gesture](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture) on Android 13 (API level 33) and later. Default to false.

#### Existing React Native app?

To change the setting, update the `android:enableOnBackInvokedCallback` value in `AndroidManifest.xml`.

### `web`

Type: `object`

Configuration that is specific to the web platform.

#### `output`

Type: `enum` • One of: `single`, `static`, `server` • Path: `web.output`

Sets the export method for the web app for both `expo start` and `expo export`. `static` statically renders HTML files for every route in the `app/` directory, which is available only in Expo Router apps. `single` outputs a Single Page Application (SPA), with a single `index.html` in the output folder, and has no statically indexable HTML. `server` outputs static HTML, and API Routes for hosting with a custom Node.js server. Defaults to `single`.

#### `favicon`

Type: `string` • Path: `web.favicon`

Relative path of an image to use for your app's favicon.

#### `name`

Type: `string` • Path: `web.name`

Defines the title of the document, defaults to the outer level name

#### `shortName`

Type: `string` • Path: `web.shortName`

A short version of the app's name, 12 characters or fewer. Used in app launcher and new tab pages. Maps to `short_name` in the PWA manifest.json. Defaults to the `name` property.

Maximum 12 characters long

#### `lang`

Type: `string` • Path: `web.lang`

Specifies the primary language for the values in the name and short_name members. This value is a string containing a single language tag.

#### `scope`

Type: `string` • Path: `web.scope`

Defines the navigation scope of this website's context. This restricts what web pages can be viewed while the manifest is applied. If the user navigates outside the scope, it returns to a normal web page inside a browser tab/window. If the scope is a relative URL, the base URL will be the URL of the manifest.

#### `themeColor`

Type: `string` • Path: `web.themeColor`

Defines the color of the Android tool bar, and may be reflected in the app's preview in task switchers.

6 character long hex color string, for example, `'#000000'`

#### `description`

Type: `string` • Path: `web.description`

Provides a general description of what the pinned website does.

#### `dir`

Type: `enum` • One of: `auto`, `ltr`, `rtl` • Path: `web.dir`

Specifies the primary text direction for the name, short_name, and description members. Together with the lang member, it helps the correct display of right-to-left languages.

#### `display`

Type: `enum` • One of: `fullscreen`, `standalone`, `minimal-ui`, `browser` • Path: `web.display`

Defines the developers’ preferred display mode for the website.

#### `startUrl`

Type: `string` • Path: `web.startUrl`

The URL that loads when a user launches the application (e.g., when added to home screen), typically the index. Note: This has to be a relative URL, relative to the manifest URL.

#### `orientation`

Type: `enum` • One of: `any`, `natural`, `landscape`, `landscape-primary`, `landscape-secondary`, `portrait`, `portrait-primary`, `portrait-secondary` • Path: `web.orientation`

Defines the default orientation for all the website's top level browsing contexts.

#### `backgroundColor`

Type: `string` • Path: `web.backgroundColor`

Defines the expected “background color” for the website. This value repeats what is already available in the site’s CSS, but can be used by browsers to draw the background color of a shortcut when the manifest is available before the stylesheet has loaded. This creates a smooth transition between launching the web application and loading the site's content.

6 character long hex color string, for example, `'#000000'`

#### `barStyle`

Type: `enum` • One of: `default`, `black`, `black-translucent` • Path: `web.barStyle`

If content is set to default, the status bar appears normal. If set to black, the status bar has a black background. If set to black-translucent, the status bar is black and translucent. If set to default or black, the web content is displayed below the status bar. If set to black-translucent, the web content is displayed on the entire screen, partially obscured by the status bar.

#### `preferRelatedApplications`

Type: `boolean` • Path: `web.preferRelatedApplications`

Hints for the user agent to indicate to the user that the specified native applications (defined in expo.ios and expo.android) are recommended over the website.

#### `dangerous`

Type: `object` • Path: `web.dangerous`

Experimental features. These will break without deprecation notice.

#### `splash`

Type: `object` • Path: `web.splash`

Configuration for PWA splash screens.

#### Existing React Native app?

Use [expo-splash-screen](https://github.com/expo/expo/tree/main/packages/expo-splash-screen#expo-splash-screen)

##### `backgroundColor`

Type: `string` • Path: `web.splash.backgroundColor`

Color to fill the loading screen background

6 character long hex color string, for example, `'#000000'`

##### `resizeMode`

Type: `enum` • One of: `cover`, `contain` • Path: `web.splash.resizeMode`

Determines how the `image` will be displayed in the splash loading screen. Must be one of `cover` or `contain`, defaults to `contain`.

##### `image`

Type: `string` • Path: `web.splash.image`

Local path or remote URL to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png.

#### `config`

Type: `object` • Path: `web.config`

Firebase web configuration. Used by the expo-firebase packages on both web and native. [Learn more](https://firebase.google.com/docs/reference/js/firebase.html#initializeapp)

##### `firebase`

Type: `object` • Path: `web.config.firebase`

##### `apiKey`

Type: `string` • Path: `web.config.firebase.apiKey`

##### `authDomain`

Type: `string` • Path: `web.config.firebase.authDomain`

##### `databaseURL`

Type: `string` • Path: `web.config.firebase.databaseURL`

##### `projectId`

Type: `string` • Path: `web.config.firebase.projectId`

##### `storageBucket`

Type: `string` • Path: `web.config.firebase.storageBucket`

##### `messagingSenderId`

Type: `string` • Path: `web.config.firebase.messagingSenderId`

##### `appId`

Type: `string` • Path: `web.config.firebase.appId`

##### `measurementId`

Type: `string` • Path: `web.config.firebase.measurementId`

#### `bundler`

Type: `enum` • One of: `webpack`, `metro` • Path: `web.bundler`

Sets the bundler to use for the web platform. Only supported in the local CLI `npx expo`. Defaults to `webpack` if the `@expo/webpack-config` package is installed, if not, it defaults to `metro`.

### `experiments`

Type: `object`

Enable experimental features that may be unstable, unsupported, or removed without deprecation notices.

#### `outOfTreePlatforms`

Type: `boolean` • Path: `experiments.outOfTreePlatforms`

Enable experimental support for select out-of-tree platforms, if their support packages are installed.

#### `onDemandFilesystem`

Type: `boolean` • Path: `experiments.onDemandFilesystem`

Enables Expo's On-Demand Filesystem allowing Metro bundling outside of the watchFolders and with package manager global virtual stores.

#### `autolinkingModuleResolution`

Type: `boolean` • Path: `experiments.autolinkingModuleResolution`

Apply Expo Autolinking's search results to Metro's module resolution. This forces your project's dependencies on `react`, `react-dom`, and `react-native`, and the autolinked versions of any Expo and React Native modules to be resolved when bundling your app. This prevents version misalignment and is useful for monorepos and to prevent conflicts.

#### `baseUrl`

Type: `string` • Path: `experiments.baseUrl`

Export a website relative to a subpath of a domain. The path will be prepended as-is to links to all bundled resources. Prefix the path with a `/` (recommended) to load all resources relative to the server root. If the path **does not** start with a `/` then resources will be loaded relative to the code that requests them, this could lead to unexpected behavior. Example '/subpath'. Defaults to '' (empty string).

#### `buildCacheProvider`

> Deprecated

Type: `undefined` • Path: `experiments.buildCacheProvider`

This field is not longer marked as experimental and will be removed in a future release, use the `buildCacheProvider` field instead.

#### `supportsTVOnly`

Type: `boolean` • Path: `experiments.supportsTVOnly`

If true, indicates that this project does not support tablets or handsets, and only supports Apple TV and Android TV

#### `tsconfigPaths`

Type: `boolean` • Path: `experiments.tsconfigPaths`

Enable tsconfig/jsconfig `compilerOptions.paths` and `compilerOptions.baseUrl` support for import aliases in Metro.

#### `typedRoutes`

Type: `boolean` • Path: `experiments.typedRoutes`

Enable support for statically typed links in Expo Router. This feature requires TypeScript be set up in your Expo Router v2 project.

#### `turboModules`

Type: `boolean` • Path: `experiments.turboModules`

Enables Turbo Modules, which are a type of native modules that use a different way of communicating between JS and platform code. When installing a Turbo Module you will need to enable this experimental option (the library still needs to be a part of Expo SDK already, like react-native-reanimated v2). Turbo Modules do not support remote debugging and enabling this option will disable remote debugging.

#### `reactCanary`

Type: `boolean` • Path: `experiments.reactCanary`

Experimentally use a vendored canary build of React for testing upcoming features.

#### `reactCompiler`

Type: `boolean` • Path: `experiments.reactCompiler`

Experimentally enable React Compiler.

#### `reactServerComponentRoutes`

Type: `boolean` • Path: `experiments.reactServerComponentRoutes`

Experimentally enable React Server Components by default in Expo Router and concurrent routing for transitions.

#### `reactServerFunctions`

Type: `boolean` • Path: `experiments.reactServerFunctions`

Experimentally enable React Server Functions support in Expo CLI and Expo Router.

#### `inlineModules`

Type: `object` • Path: `experiments.inlineModules`

Configuration for inline modules. If defined it enables inline modules functionality in expo cli and expo-modules-autolinking.

##### `watchedDirectories`

Type: `array` • Path: `experiments.inlineModules.watchedDirectories`

List of directories watched for inline modules.

##### `xcodeProjectTargets`

Type: `array` • Path: `experiments.inlineModules.xcodeProjectTargets`

List of targets to which inline modules files are added. If undefined defaults to the main target only.

### `_internal`

Type: `object`

Internal properties for developer tools

#### `pluginHistory`

Type: `object` • Path: `_internal.pluginHistory`

List of plugins already run on the config
