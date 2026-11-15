# Web Push notifications

Expensify uses the standard Web Push API. It does not use Firebase or a native wrapper.

## Setup

Install dependencies from `backend`:

```powershell
npm install web-push @nestjs/schedule @nestjs/throttler
npm install -D @types/web-push
```

`@nestjs/schedule` is already present in this repository. Generate VAPID keys once:

```powershell
npx web-push generate-vapid-keys
```

Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT=mailto:...` in the backend runtime environment. Never commit the private key. Set `RUN_CRON=true` on exactly one backend instance.

The frontend must run on HTTPS in production (localhost is allowed for development). Add these placeholder icon files to `frontend/public`: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, and `badge-72.png`.

## Manual checklist

1. Open the app over HTTPS (or localhost) and verify the service worker and manifest in DevTools > Application.
2. Enable notifications, then use **Send test notification**.
3. Install the site from Android Chrome, close it fully, send a test, and tap the notification to verify deep linking.
4. Test denied permission, an expired subscription, two devices, and logout/login as another user.
5. Cross a budget's 80% and 100% thresholds and invoke the recurring/cron jobs manually.

WebView wrappers generally do not support Web Push; Chrome-installed PWAs/TWAs do. Users who installed an old shortcut must remove and reinstall it. iOS requires 16.4+ and adding the app to the Home Screen. Some Android vendors delay delivery because of battery optimization. Permission denial must be reversed in browser site settings.
