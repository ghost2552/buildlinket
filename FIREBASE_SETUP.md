# Firebase Setup Guide for BuildLink

This guide will walk you through setting up Firebase step by step. We'll do this together - you set up, I'll verify and help you continue.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** (or select an existing project)
3. Enter project name: `buildlink-production` (or your preferred name)
4. Click **Continue**
5. **Disable Google Analytics** for now (or enable if you want it)
6. Click **Create project**
7. Wait for project creation (takes ~30 seconds)

**✅ When done, tell me: "Step 1 complete"**

---

## Step 2: Enable Authentication

1. In your Firebase project, click **Authentication** in the left menu
2. Click **Get started**
3. Go to the **Sign-in method** tab
4. Click on **Email/Password**
5. Toggle **Enable** to ON
6. Click **Save**

**✅ When done, tell me: "Step 2 complete"**

---

## Step 3: Create Firestore Database

1. Click **Firestore Database** in the left menu
2. Click **Create database**
3. Select **Start in production mode** (we'll add rules later)
4. Choose a **location** closest to your users (e.g., `us-central1` or `europe-west1`)
5. Click **Enable**
6. Wait for database creation (~1 minute)

**✅ When done, tell me: "Step 3 complete"**

---

## Step 4: Set Up Cloud Storage

1. Click **Storage** in the left menu
2. Click **Get started**
3. Select **Start in production mode**
4. Choose the **same location** as your Firestore database
5. Click **Done**
6. Wait for storage setup (~30 seconds)

**✅ When done, tell me: "Step 4 complete"**

---

## Step 5: Get Your Firebase Config

1. Click the **gear icon** (⚙️) next to "Project Overview" at the top
2. Click **Project settings**
3. Scroll down to **"Your apps"** section
4. Click the **web icon** (`</>`) to add a web app
5. Register your app:
   - App nickname: `BuildLink Web`
   - Check "Also set up Firebase Hosting" (optional)
   - Click **Register app**
6. **Copy the config object** that appears (it looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX"
};
```

**✅ When done, send me your config values and I'll help you add them to .env.local**

---

## Step 6: Add Config to Your Project

Once you send me your config, I'll:
1. Create/update your `.env.local` file
2. Add all the Firebase credentials
3. Restart the dev server

**✅ After I update the file, tell me: "Config added"**

---

## Step 7: Set Up Security Rules

After the config is added, I'll provide you with security rules to paste into Firebase.

### Firestore Rules:
1. Go to **Firestore Database** > **Rules** tab
2. I'll give you the rules to paste
3. Click **Publish**

### Storage Rules:
1. Go to **Storage** > **Rules** tab
2. I'll give you the rules to paste
3. Click **Publish**

**✅ When done, tell me: "Rules added"**

---

## Step 8: Test the App

After everything is set up:
1. The app should automatically reload
2. Try creating an account
3. Test the features

**✅ When done, tell me: "Everything works!"**

---

## Quick Reference

- **Firebase Console**: https://console.firebase.google.com/
- **Your Project**: [Your project name]

## Need Help?

If you get stuck at any step, just tell me which step and what error you're seeing, and I'll help you fix it!



