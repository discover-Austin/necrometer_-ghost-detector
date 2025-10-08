Necrometer Privacy Policy

Last updated: October 8, 2025

Overview
--------
Necrometer ("the App") is published by biblicalandr0id. If you need to contact the developer about privacy matters, please email: built.to.cell@gmail.com

This project is privacy-focused by design. The App ships as a web application (Angular) and is also packaged for Android via Capacitor (Play Store). Below is an accurate, concise summary of what data the App collects, how it is used, and what it does not collect.

What we do NOT collect
----------------------
- No analytics or tracking SDKs are included (for example: Google Analytics, Firebase Analytics, Amplitude, Mixpanel, Sentry). The Angular CLI telemetry setting is disabled.
- No advertisements or advertising SDKs are bundled.
- No user accounts, sign-ups, or persistent server-side user profiles are created by default.

What we DO collect and why
--------------------------
The App minimizes data collection. The following behaviors are present and described so you know what to expect:

- Camera and Microphone Access
  - Why: The App uses the device camera (and optionally microphone for EVP features) to provide live preview, AR overlays, and record EVPs. Camera and microphone access is requested at runtime by the app and only when you trigger features that require them.
  - Where it runs: Permissions are requested on-device (Android) or via the browser permission dialog (Web/PWA). Media streams are used locally for live preview and for capturing photos/audio when you ask the App to perform a scan or an EVP recording.
  - Retention: Captured photos, video frames, and audio are stored locally in app storage (browser localStorage / Capacitor filesystem) unless you explicitly export or upload them.

- AI / Gemini Proxy
  - Why: The App integrates generative AI (Gemini) to analyze imagery, generate entity profiles and temporal echoes, and provide other assisted features.
  - How we handle API keys: No third-party AI API keys are stored in the client mobile or web bundle in production. To avoid exposing an API key in client-side code, the App is designed to call a server-side proxy that holds the real API key.
  - Server-side proxy and JWT issuance: The server proxy exposes an issuance endpoint (POST /issue-token) which requires a short-lived shared issuance token to obtain a short-lived JWT. The client uses that JWT to call protected API endpoints on the proxy. This ensures API secrets are never embedded in the client.
  - What is sent to the proxy: If you choose an AI-powered feature (for example: analyze-scene, generate-glyph, generate-entity-profile), the App will send the minimal data necessary for the requested operation to the proxy (for example: a base64-encoded image or recorded EVP audio). The proxy forwards the request to Gemini and returns responses to the client.
  - Retention: The proxy implementation included with the project does not persist user-submitted images or audio beyond request handling by default (it forwards to the AI provider). If you deploy a proxy, please document any additional persistence and retention policies you enforce on your server.

In-app purchases and billing
---------------------------
- Necro-Credits (consumable)
  - Purpose: Consumable credits used to perform scans, analyses, and other paid actions in the App (labelled as "Necro-Credits" or "NC").
  - How they work: The App UI shows purchasable credit packs (e.g., 20 NC for $0.99, 50 NC for $1.99, 150 NC for $4.99). Purchasing in the Android packaged app should be implemented through Google Play Billing. The in-repo implementation currently simulates credit grants via the `UpgradeService` and does not wire a production billing flow; please use platform billing APIs in production.

- Pro (subscription)
  - Purpose: Optional Pro subscription grants a monthly stipend of NC, an exclusive UI theme, and access to early features.
  - Billing model: The App UI displays a $4.99/month Pro subscription. In production on Android this should be implemented via Google Play Subscriptions. On the web, subscription billing is not wired in the repository and would require integration with a payment processor (Stripe, Paddle, etc.) if you choose to offer subscriptions on the PWA.

- Refunds and consumption
  - Consumable credits are consumed client-side when a paid action is initiated. The current code will refund credits on explicit failure for certain flows (see `vision.component.ts` lines where `addCredits` is called on error). For production, handle refund requests via the chosen store (Google Play refunds are subject to Play Store policies).

Platforms
---------
- Android (Play Store): The project includes a Capacitor Android project (`android/`) and is intended to be published via the Play Store. Google Play Billing should be used for real purchases on Android.
- Web / PWA: The app is a standard Angular web app and can be served as a PWA. The repository includes service worker references (Angular service worker package is present), but payment integrations are not implemented for browser-based purchases.

Third-party services and SDKs
----------------------------
- The App includes client code that uses a server-side proxy to call `@google/genai` on the server (proxy code is in `/server`). This avoids embedding an API key in the client.
- Capacitor plugins used (Camera Preview, Filesystem, Voice Recorder) access device hardware and local filesystem as required to implement features; these plugins do not send data to third parties by themselves.
- No analytics, advertising, or user-tracking third-party SDKs are bundled by default.

Data access, deletion, and export
---------------------------------
- Local data: Photos, recordings, logs, and upgrade (credits/pro) state are stored locally on the device (localStorage or Capacitor filesystem). You control these; delete the app data, clear browser storage, or use the OS-level app settings to remove stored data.
- Server-proxy data: If you run the included server proxy, it is your responsibility to document and implement any data retention or deletion mechanisms. The repository's proxy is intended as a forwarding proxy and does not persist user data by default, but that depends on your deployment choices.
- Export: The App has a diagnostics service to export logs. Exported files are created locally and can be shared using the device sharing sheet (Android) or downloaded from the browser.

Children's privacy
------------------
The App is not intended for children under the age of 13. The App does not knowingly collect information from children under 13. If you are a parent or guardian who becomes aware that your child has provided information without your consent, please contact the developer at built.to.cell@gmail.com and we will take steps to remove that data.

Security
--------
- The App avoids storing API keys on the client and uses a server-side proxy that issues short-lived JWTs to minimize secret exposure.
- Use HTTPS in production for both the web app and the proxy endpoints.
- If you deploy the proxy, secure environment variables (API_KEY, SHARED_ISSUANCE_TOKEN) and do not commit them to source control.

Changes to this policy
----------------------
This privacy policy may be updated from time to time. The "Last updated" date at the top will indicate the most recent change.

Contact
-------
For privacy questions, requests to export or delete data, or other inquiries, contact: built.to.cell@gmail.com

Acknowledgements and notes for deployers
----------------------------------------
- The repository includes simulated purchase flows and local-storage-based upgrade logic. Before publishing to Google Play, integrate Google Play Billing for Android and follow Play Store policies on in-app purchases and refunds.
- If you modify the server proxy to persist images/audio or logs, update this privacy policy and your deployed server's privacy/retention documentation accordingly.

