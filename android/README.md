# Expense Tracker Android shell

This native shell loads the deployed Expense Tracker app and provides a mobile INDmoney capture flow.

## Behavior

- The web app is loaded in the main WebView.
- On Android, `Connect INDmoney` calls the native bridge.
- INDmoney opens inside a second WebView in the APK.
- Log in and complete OTP/2FA normally.
- Tap `Capture portfolio` at the top of the INDmoney screen.
- The native WebView reads visible text, tables, and rows, then uploads the JSON to the deployed importer.
- Passwords, OTPs, cookies, and browser storage are not uploaded.

## Build

Open this `android` folder in Android Studio, allow Gradle sync, and run the `app` configuration on a device or emulator. For a release APK, configure a signing key in Android Studio before generating the APK.

The URLs are configured in `app/src/main/java/com/expensetracker/app/MainActivity.kt`:

- `frontendUrl`: deployed Expense Tracker URL
- `apiUrl`: deployed NestJS API URL

A production APK must be rebuilt whenever those URLs or native capture behavior change.
