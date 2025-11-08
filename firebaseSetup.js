/**
 * Firebase Setup Helper
 * This utility helps users configure Firebase for their BuildLink app
 */

export const validateFirebaseConfig = () => {
  // Check if we're using fallback config (which means no custom config)
  const fallbackConfig = {
    apiKey: "AIzaSyCnlOBqnRG5H3jkzloDm_G17DaJrRSkAbA",
    authDomain: "studio-531461249-2504d.firebaseapp.com",
  };

  const apiKey = process.env.REACT_APP_FIREBASE_API_KEY || fallbackConfig.apiKey;
  const authDomain = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain;

  // If using fallback config, consider it as "not configured" for setup purposes
  // But allow the app to still work
  const isUsingFallback = apiKey === fallbackConfig.apiKey && authDomain === fallbackConfig.authDomain;

  const requiredEnvVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID',
  ];

  const missing = requiredEnvVars.filter(
    (varName) => !process.env[varName] || process.env[varName].includes('your-')
  );

  return {
    isValid: !isUsingFallback && missing.length === 0,
    missing,
    hasCustomConfig: missing.length < requiredEnvVars.length,
    isUsingFallback,
  };
};

export const getFirebaseSetupInstructions = () => {
  return {
    step1: {
      title: 'Create a Firebase Project',
      instructions: [
        'Go to https://console.firebase.google.com/',
        'Click "Add project" or select an existing project',
        'Enter your project name (e.g., "buildlink-production")',
        'Follow the setup wizard',
      ],
    },
    step2: {
      title: 'Enable Firebase Authentication',
      instructions: [
        'In Firebase Console, go to Authentication > Sign-in method',
        'Click "Email/Password"',
        'Enable "Email/Password" provider',
        'Click "Save"',
      ],
    },
    step3: {
      title: 'Create Firestore Database',
      instructions: [
        'Go to Firestore Database in Firebase Console',
        'Click "Create database"',
        'Choose "Start in production mode" (we\'ll add rules later)',
        'Select a location for your database',
        'Click "Enable"',
      ],
    },
    step4: {
      title: 'Set Up Cloud Storage',
      instructions: [
        'Go to Storage in Firebase Console',
        'Click "Get started"',
        'Start in production mode',
        'Select a location',
        'Click "Done"',
      ],
    },
    step5: {
      title: 'Get Your Firebase Config',
      instructions: [
        'Go to Project Settings (gear icon)',
        'Scroll down to "Your apps"',
        'Click the web icon (</>) to add a web app',
        'Register your app with a nickname',
        'Copy the config object',
      ],
    },
    step6: {
      title: 'Add Config to .env.local',
      instructions: [
        'Create a file named `.env.local` in the project root',
        'Add your Firebase credentials:',
        '',
        'REACT_APP_FIREBASE_API_KEY=your-api-key',
        'REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com',
        'REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com',
        'REACT_APP_FIREBASE_PROJECT_ID=your-project-id',
        'REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com',
        'REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789',
        'REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123',
        'REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX',
        '',
        'Replace the values with your actual Firebase config',
      ],
    },
    step7: {
      title: 'Set Up Security Rules',
      instructions: [
        'Go to Firestore Database > Rules',
        'Paste the security rules from README.md',
        'Click "Publish"',
        'Go to Storage > Rules',
        'Paste the storage rules from README.md',
        'Click "Publish"',
      ],
    },
  };
};

export const checkFirebaseServices = async (auth, db, storage) => {
  const checks = {
    auth: false,
    firestore: false,
    storage: false,
  };

  try {
    // Check Auth
    if (auth) {
      checks.auth = true;
    }
  } catch (error) {
    console.warn('Auth check failed:', error);
  }

  try {
    // Check Firestore
    if (db) {
      checks.firestore = true;
    }
  } catch (error) {
    console.warn('Firestore check failed:', error);
  }

  try {
    // Check Storage
    if (storage) {
      checks.storage = true;
    }
  } catch (error) {
    console.warn('Storage check failed:', error);
  }

  return checks;
};

