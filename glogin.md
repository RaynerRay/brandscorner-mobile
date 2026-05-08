# Google Native Login — Setup Guide

End-to-end walkthrough for enabling Google Sign-In in the Expo mobile app backed by the `auth-service`.

---

## Architecture Overview

```
Mobile App (React Native / Expo)
  └── @react-native-google-signin/google-signin
        └── obtains Google ID token natively (no browser redirect)
              └── POST /auth/api/google-mobile-login
                    └── auth-service verifies token with Google tokeninfo API
                          └── finds or creates user in MongoDB
                                └── returns { accessToken, refreshToken, user }
```

The web frontend uses a browser-redirect OAuth flow (`/auth/api/google/callback`).  
The mobile app uses a **token-exchange flow** — the native SDK handles the Google UI and returns an ID token, which the backend verifies server-side.

---

## 1. Google Cloud Console Setup

### 1.1 Create a project (or use an existing one)

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Select or create a project
3. Enable the **Google Identity** API (APIs & Services → Enable APIs → search "Google Identity")

### 1.2 Create OAuth Client IDs

You need **three** client IDs — one per platform.

#### Web Client ID (required for Android token verification)

1. APIs & Services → Credentials → Create Credentials → OAuth client ID
2. Application type: **Web application**
3. Name: `Eshop Web`
4. Authorized redirect URIs: add your backend callback URL  
   e.g. `https://your-api.example.com/auth/api/google/callback`
5. Copy the **Client ID** → this is `GOOGLE_CLIENT_ID` (backend) and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (mobile)

#### Android Client ID

1. Create Credentials → OAuth client ID
2. Application type: **Android**
3. Package name: your `android.package` in `app.json` (e.g. `com.yourcompany.eshop`)
4. SHA-1 fingerprint — get it with:
   ```bash
   # Debug keystore (development)
   keytool -keystore ~/.android/debug.keystore -list -v
   # Default password: android

   # EAS Build (production) — run after first EAS build
   eas credentials
   ```
5. No need to add this Client ID anywhere in the code — Android uses it transparently with the Web Client ID

#### iOS Client ID

1. Create Credentials → OAuth client ID
2. Application type: **iOS**
3. Bundle ID: your `ios.bundleIdentifier` in `app.json` (e.g. `com.yourcompany.eshop`)
4. Copy the **Client ID** → this is `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
5. Copy the **reversed client ID** (format: `com.googleusercontent.apps.XXXXXXXX`) → used in `app.json`

---

## 2. Environment Variables

### Mobile app — `.env`

```env
EXPO_PUBLIC_SERVER_URI=https://your-api.example.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=XXXXXXXXXX.apps.googleusercontent.com
# iOS only (optional — Android only needs the web client ID)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=XXXXXXXXXX.apps.googleusercontent.com
```

### Backend — `.env` (auth-service)

```env
GOOGLE_CLIENT_ID=XXXXXXXXXX.apps.googleusercontent.com      # Web client ID
GOOGLE_CLIENT_SECRET=GOCSPX-XXXXXXXXXX                      # Web client secret
GOOGLE_REDIRECT_URI=https://your-api.example.com/auth/api/google/callback
# Optional — add iOS client ID so the backend also accepts iOS-issued tokens
GOOGLE_IOS_CLIENT_ID=XXXXXXXXXX.apps.googleusercontent.com
```

---

## 3. `app.json` Plugin Configuration

In [app.json](app.json), replace the placeholder with your reversed iOS client ID:

```json
[
  "@react-native-google-signin/google-signin",
  {
    "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID_REVERSED"
  }
]
```

**Where to find the reversed client ID:** Google Cloud Console → your iOS OAuth client → "iOS URL scheme" field.  
It looks like `com.googleusercontent.apps.123456789-abcdefg`.

---

## 4. Install Dependencies

```bash
cd eshop-mobile-app-godfrey
npm install
# or
npx expo install @react-native-google-signin/google-signin
```

> `@react-native-google-signin/google-signin` uses native modules and **cannot run in Expo Go**.  
> You must use a [Development Build](https://docs.expo.dev/develop/development-builds/introduction/) or EAS Build.

---

## 5. Build & Run

### Development build (local)

```bash
# iOS simulator
npx expo run:ios

# Android emulator / device
npx expo run:android
```

### EAS Build (recommended for device testing)

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
eas build --profile development --platform ios
```

Install the resulting build on your device/emulator, then start the dev server:

```bash
npx expo start --dev-client
```

---

## 6. How the Code Works

### Mobile side

| File | Role |
|---|---|
| [hooks/useGoogleAuth.tsx](hooks/useGoogleAuth.tsx) | Configures `GoogleSignin`, calls native sign-in, exchanges ID token with the backend, stores tokens in `expo-secure-store` |
| [components/GoogleSignInButton.tsx](components/GoogleSignInButton.tsx) | Reusable button — shows spinner during sign-in, surfaces errors via `sonner-native` toast |
| [app/(routes)/login/index.tsx](app/(routes)/login/index.tsx) | Renders `<GoogleSignInButton label="Sign In with Google" />` |
| [app/(routes)/signup/index.tsx](app/(routes)/signup/index.tsx) | Renders `<GoogleSignInButton label="Sign Up with Google" />` |

### Backend side

| File | Role |
|---|---|
| [apps/auth-service/src/controller/google.auth.controller.ts](../brandsforless-godfrey/apps/auth-service/src/controller/google.auth.controller.ts) | `googleMobileLogin` — verifies ID token with `oauth2.googleapis.com/tokeninfo`, finds/creates user, returns JWT pair |
| [apps/auth-service/src/routes/auth.router.ts](../brandsforless-godfrey/apps/auth-service/src/routes/auth.router.ts) | `POST /auth/api/google-mobile-login` route |

### Sign-in flow (step by step)

```
1. User taps "Sign In with Google"
2. GoogleSignin.signIn() launches native Google account picker
3. User selects account → Google returns { idToken }
4. POST /auth/api/google-mobile-login  { idToken }
5. Backend fetches https://oauth2.googleapis.com/tokeninfo?id_token=<token>
6. Google validates signature + expiry, returns { email, name, aud, ... }
7. Backend checks `aud` matches GOOGLE_CLIENT_ID (or GOOGLE_IOS_CLIENT_ID)
8. Backend finds user by email, or creates one if new
9. Backend returns { accessToken (15m), refreshToken (7d), user }
10. Mobile stores tokens in expo-secure-store
11. router.replace("/(tabs)") — user is authenticated
```

---

## 7. Token Refresh

The existing [utils/axiosInstance.tsx](utils/axiosInstance.tsx) handles refresh automatically:

- On any `401` response, it POSTs `{ refreshToken }` to `/auth/api/refresh-token`
- The backend now returns `{ success: true, accessToken }` in the body
- The new access token is stored and the original request is retried

No changes needed for Google-authenticated users — the token lifecycle is identical to email/password users.

---

## 8. New User vs Existing User

| Case | Behaviour |
|---|---|
| Email exists (registered via email) | Logs in — password not required |
| Email exists (prior Google login) | Logs in as normal |
| Email not found | Auto-creates account with `name` + `email` from Google profile, no password set |
| First user ever | Assigned `role: "admin"` automatically |

---

## 9. Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `DEVELOPER_ERROR` on Android | SHA-1 mismatch or wrong package name | Re-check SHA-1 in Google Console matches keystore; verify `android.package` in `app.json` |
| `SIGN_IN_CANCELLED` | User dismissed picker | Normal — no action needed |
| `PLAY_SERVICES_NOT_AVAILABLE` | Android emulator without Play Services | Use a Play-enabled emulator or real device |
| `Invalid Google ID token` (backend 401) | Token expired or wrong client ID | Ensure `GOOGLE_CLIENT_ID` in backend `.env` matches the Web Client ID |
| `Google token audience mismatch` | iOS token sent but `GOOGLE_IOS_CLIENT_ID` not set in backend | Add `GOOGLE_IOS_CLIENT_ID` to backend `.env` |
| App crashes on start (iOS) | `iosUrlScheme` not set in `app.json` | Add the reversed iOS client ID to the plugin config |
| Works in simulator, fails on device | Production SHA-1 not registered | Add production SHA-1 fingerprint in Google Console |
