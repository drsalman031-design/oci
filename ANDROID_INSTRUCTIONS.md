# Android APK Generation Guide: OCI Offline Clinical Assistant
*Prepared for Dr. Salman MDS Orthodontist*

This guide provides step-by-step instructions to compile the **Orthodontic Compensation Index (OCI) Offline AI Clinical Assistant** (an Expo React Native application) into a production-ready signed Android APK (`.apk`) or Android App Bundle (`.aab`) using **Android Studio**.

---

## 🛠️ Prerequisites
Before starting, ensure you have the following installed on your machine:
1. **Node.js** (v18 or newer) - [Download here](https://nodejs.org/)
2. **Java Development Kit (JDK 17 or 21)** - Required by modern Gradle builds for Android.
3. **Android Studio** - The official IDE for Android development. Make sure you install the **Android SDK** and **Android SDK Command-line Tools** via the SDK Manager.

---

## 🚀 Step 1: Generate the Native Android Project Folder
Because this is a modern **Expo** project, the native `android` codebase is generated dynamically. 

1. Open your terminal in the root folder of the project.
2. Run the following command to generate the `/android` native directory:
   ```bash
   npx expo prebuild --platform android
   ```
   *This command reads `app.json` and automatically sets up your package name (`com.dr.salman.oci`), app name, icons (`/assets/icon.png`), and configurations inside a newly created `/android` directory.*

---

## 📱 Step 2: Open Project in Android Studio
1. Launch **Android Studio**.
2. Select **Open** (or **Import Project**).
3. Browse and select the **`/android`** folder inside your project directory (do NOT open the root project folder, choose the `/android` subdirectory specifically).
4. Wait for Gradle to finish downloading dependencies, indexing, and syncing (usually takes 2–5 minutes on the first launch depending on your internet connection).

---

## 🔑 Step 3: Configure Environment Variables / API Keys (Optional)
This app is designed to work **100% offline** using custom clinical decision algorithms. However, if you want to use the live **Gemini AI Co-pilot**:
1. Copy `.env.example` to `.env` in your root folder.
2. Add your key: `EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key`
3. Expo will bundle this public environment variable during compiling.

---

## 📦 Step 4: Generate Signed Production APK / App Bundle (AAB)
Follow these steps inside Android Studio to build a signed version for your Android phone or Google Play Store deployment:

1. In Android Studio's top menu bar, go to **Build** ➔ **Generate Signed Bundle / APK...**
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
- **No Internet Required**: The app works 100% offline. It reads and writes directly to local client storage via highly robust SQLite/AsyncStorage architecture.
- **HIPAA-Compliant local state**: All database operations (Patient intake, Cephalometric tracking, OCI calculations, treatment plan timelines, clinical reports) are processed locally on the user's secure hardware.
- **Local Backup / Restore**: Use the **Settings Panel** inside the application to download complete encrypted JSON clinical archives as physical backups or migrate records across devices entirely offline!
