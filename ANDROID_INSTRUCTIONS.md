# Android APK Generation Guide: OCI Offline Clinical Assistant
*Prepared for Dr. Salman MDS Orthodontist*

This guide provides step-by-step instructions to compile the **Orthodontic Compensation Index (OCI) Offline AI Clinical Assistant** into a production-ready signed Android APK using Capacitor.

---

## 🛠️ Prerequisites
Before starting, ensure you have the following installed on your machine:
1. **Node.js** (v18 or newer) - [Download here](https://nodejs.org/)
2. **Java Development Kit (JDK 17)** - Required by modern Gradle builds for Android.
3. **Android Studio** - The official IDE for Android development. Make sure you install the **Android SDK** and **Android SDK Command-line Tools** via the SDK Manager.

---

## 🚀 Step 1: Install Dependencies & Build Web Assets
If you are running this project locally for the first time:

1. Open your terminal in the root folder of the project.
2. Install all the npm packages:
   ```bash
   npm install
   ```
3. Compile the production web assets:
   ```bash
   npm run build
   ```
   *This creates the optimized static build files inside the `/dist` directory.*

---

## 🔄 Step 2: Sync Web Assets to Android Wrapper
Capacitor acts as a modern bridge that wraps the web application in a native container. To sync the compiled web assets into the Android native wrapper:

```bash
npx cap sync
```
*This command copies all assets from `/dist` into the native Android structure under `android/app/src/main/assets/public`.*

---

## 📱 Step 3: Open Project in Android Studio
You can launch Android Studio directly with the configured native project:

```bash
npx cap open android
```
Alternatively:
1. Open **Android Studio**.
2. Select **Open an Existing Project**.
3. Browse and select the `/android` folder from your project directory.
4. Wait for Gradle to finish indexing and syncing (usually takes 1–3 minutes on the first launch).

---

## 🎨 Step 4: Customize App Icon & Splash Screens (Optional)
To replace the default Capacitor placeholder icons and splash screens with your own:
1. Prepare a high-resolution square image: `resources/icon.png` (1024x1024 px).
2. Prepare a high-resolution splash image: `resources/splash.png` (2732x2732 px).
3. Use the official Capacitor Assets CLI to automatically generate all required densities and place them in the correct directories:
   ```bash
   npx cordova-res android --skip-config --copy
   ```
   *Or use the modern community utility:*
   ```bash
   npm install @capacitor/assets -D
   npx capacitor-assets generate
   ```

---

## 🔑 Step 5: Generate Signed Production APK / App Bundle (AAB)
Follow these steps inside Android Studio to build a signed version for your Android phone or Google Play Store deployment:

1. In the top menu bar, go to **Build** ➔ **Generate Signed Bundle / APK...**
2. Choose **APK** (for direct phone installation) or **Android App Bundle** (for uploading to Google Play), then click **Next**.
3. **Create or Load a Key Store**:
   - If you don't have one, click **Create new...**
   - Choose a file path for your new Keystore (e.g., `my-release-key.jks`).
   - Enter password credentials and fill in your developer certificate information (e.g., *Dr. Salman MDS*).
4. Click **Next**.
5. Select the **Release** build variant.
6. Check **V4 (Resettable)** or **V1 (JAR Signature) / V2 (Full APK Signature)** if prompted, to ensure compatibility with older Android versions.
7. Click **Finish**.

Android Studio will compile the production-optimized native files. Once completed, a notification bubble will appear on the bottom-right corner with a **"locate"** link. Click it to find your finalized `app-release.apk`!

---

## 📡 Verification & Offline Integrity
- **No Internet Required**: The app works 100% offline. It reads and writes directly to local client storage via highly robust IndexedDB architecture.
- **HIPAA-Compliant local state**: All database operations (Patient intake, Cephalometric tracking, OCI calculations, treatment plan timelines, clinical reports) are processed locally on the user's secure hardware.
- **Local Backup / Restore**: Use the **Settings Panel** inside the application to download complete encrypted JSON clinical archives as physical backups or migrate records across devices entirely offline!
