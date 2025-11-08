# Firebase Setup Instructions

## ✅ Step 1: Create .env.local File

Create a file named `.env.local` in the project root (same folder as `package.json`) with this content:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyCnlOBqnRG5H3jkzloDm_G17DaJrRSkAbA
REACT_APP_FIREBASE_AUTH_DOMAIN=studio-531461249-2504d.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://studio-531461249-2504d-default-rtdb.asia-southeast1.firebasedatabase.app
REACT_APP_FIREBASE_PROJECT_ID=studio-531461249-2504d
REACT_APP_FIREBASE_STORAGE_BUCKET=studio-531461249-2504d.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=159917021111
REACT_APP_FIREBASE_APP_ID=1:159917021111:web:696c7ef0ef2d2ff0e63a32
REACT_APP_FIREBASE_MEASUREMENT_ID=G-S20R60HCWK
```

**Save the file, then restart your dev server!**

---

## ✅ Step 2: Enable Firebase Services

Check these in your Firebase Console:

### Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** if not already enabled
3. Click **Save**

### Firestore Database
1. Go to **Firestore Database**
2. If not created, click **Create database**
3. Choose **Production mode** (we'll add rules next)
4. Select a location and click **Enable**

### Cloud Storage
1. Go to **Storage**
2. If not set up, click **Get started**
3. Choose **Production mode**
4. Select a location and click **Done**

---

## ✅ Step 3: Add Security Rules

### Firestore Rules
1. Go to **Firestore Database** → **Rules** tab
2. Copy the content from `FIRESTORE_RULES.txt` (I created this file for you)
3. Paste it into the rules editor
4. Click **Publish**

### Storage Rules
1. Go to **Storage** → **Rules** tab
2. Copy the content from `STORAGE_RULES.txt` (I created this file for you)
3. Paste it into the rules editor
4. Click **Publish**

---

## ✅ Step 4: Restart Dev Server

After creating `.env.local`:
1. Stop the current dev server (Ctrl+C)
2. Run `npm start` again

The app will now use your Firebase project!

---

## 🎉 You're Done!

Once you've:
- ✅ Created `.env.local` with the config above
- ✅ Enabled Authentication (Email/Password)
- ✅ Created Firestore Database
- ✅ Set up Cloud Storage
- ✅ Added security rules
- ✅ Restarted the dev server

Your app will be fully connected to Firebase!

---

## Need Help?

If you get any errors, let me know and I'll help you fix them!



