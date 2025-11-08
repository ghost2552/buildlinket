# BuildLink Web

BuildLink is a role-aware onboarding portal that connects infrastructure buyers and suppliers. The interface is styled with Tailwind CSS and data is stored in Firebase (Authentication, Firestore, Storage, Analytics, and Performance monitoring).

## 1. Environment setup

1. Create a `.env.local` file in the project root and add your Firebase project secrets:

   ```env
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1234567890
   REACT_APP_FIREBASE_APP_ID=1:1234567890:web:abc123
   REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
   ```

   > The repository ships with working sandbox credentials so the UI functions out of the box. Replace them with your own keys for production.
   
   > **Note:** See `.env.example` for a template of required environment variables.

2. Install dependencies:

   ```bash
   npm install
   ```

## 2. Tailwind utilities

- `npm run tailwind:build` – generates `src/tailwind-output.css`
- `npm run tailwind:watch` – rebuilds Tailwind utilities on file changes (useful while running the dev server)

> These commands are required whenever you add new class names that Tailwind should compile.

## 3. Firebase workflows

- `npm start` – local dev server on `http://localhost:3000`
- `npm run build` – production bundle
- `npm run firebase:seed` – optional Firestore seeding with starter documents (`scripts/initFirestore.js`)

The Firebase helpers live in:

- `src/firebaseConfig.js` – shared app, auth, firestore, storage, analytics, and performance monitoring handles
- `src/auth.js` – registration, login, logout, auth listener, profile helpers, and credential upload storage utilities
- `src/analytics.js` – Firebase Analytics event tracking utilities

### Firebase Setup Checklist

Before deploying, ensure you have:

1. ✅ **Firebase Authentication** enabled with Email/Password provider
2. ✅ **Cloud Firestore** database created with appropriate security rules
3. ✅ **Cloud Storage** bucket created for credential file uploads
4. ✅ **Firebase Analytics** enabled (optional but recommended)
5. ✅ **Firebase Performance Monitoring** enabled (optional but recommended)

### Security Rules

Configure Firestore security rules to protect your data. Example rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Suppliers can read/write their own data
    match /suppliers/{supplierId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == supplierId;
    }
    // Buyers can read/write their own data
    match /buyers/{buyerId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == buyerId;
    }
    // RFQs are readable by authenticated users, writable by buyers
    match /rfqs/{rfqId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.buyerId == request.auth.uid;
    }
    // Bids are readable by authenticated users
    match /bids/{bidId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
    }
    // Storage rules for credentials
    match /credentials/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /credentials/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 4. RFQ & bidding workflow

- Buyers (role = `buyer`) can create RFQs with line items, budgets, and deadlines once they sign in.
- Suppliers (role = `supplier`) browse open RFQs, submit/update bids, and withdraw before award.
- Buyers review bids in real time and award a supplier; other bids are auto-labelled as declined for traceability.
- Implementation lives in:
  - `src/components/RFQBuyerPanel.js`
  - `src/components/RFQSupplierPanel.js`
  - `src/rfqService.js`

## 5. Seeding Firestore (optional)

Edit the `seedData` map in `scripts/initFirestore.js` to reflect the entities you need, then run:

```bash
npm run firebase:seed
```

The script seeds example buyers/suppliers, credential metadata, a sample RFQ, catalog entry, logistics profile, shipment timeline, and a ready-made bid so you can explore the workflow immediately. It uses the same Firebase credentials as the React app and merges rather than overwrites documents.

## 6. Credential workflow

After sign-up, the portal prompts users to upload trade licences or compliance certificates. Files are stored under `credentials/{uid}/` in Firebase Storage and metadata is merged into the user document (`credentialFiles` array + `credentialStatus`). Administrators can update the status to `verified` directly in Firestore once documents are reviewed.

## 7. Catalog, logistics & shipments

- Suppliers maintain products/services under `supplierCatalog` via the in-app catalog manager.
- Logistics profiles capture fleet, coverage, and lead-time capabilities (`logisticsProfiles`).
- Buyers can pull catalog items into RFQs and schedule shipments for awarded bids.
- Shipments (`shipments` collection) stream to both supplier and buyer dashboards with status history and timeline UI.
- Core helper modules: `src/catalogService.js`, `src/logisticsService.js`.

## 8. Compliance console

- Admins (role `admin`) see pending credential reviews in `AdminComplianceConsole` and can approve/reject with notes.
- Review actions cascade to `users`, `suppliers`/`buyers`, and record entries in `complianceReviews`.
- Component: `src/components/AdminComplianceConsole.js`.

## 9. Two-factor authentication (2FA)

- Users can enable TOTP-based two-factor auth via `TwoFactorPanel` (QR enrolment, verification, disable).
- Sensitive actions (bid awards, shipment scheduling/updates, admin approvals) prompt a `TwoFactorChallenge` when 2FA is enabled.
- Implementation: `src/twoFactorService.js`, `src/components/TwoFactorPanel.js`, `src/components/TwoFactorChallenge.js`.

## 10. Routing & Navigation

The app uses React Router for client-side routing:

- `/` - Redirects to `/login`
- `/login` - Login page (redirects to dashboard if already authenticated)
- `/signup` - Registration page (redirects to dashboard if already authenticated)
- `/dashboard` - Main dashboard (protected route, requires authentication)

Protected routes automatically redirect unauthenticated users to the login page. Authenticated users accessing login/signup pages are redirected to the dashboard.

## 11. Error Handling

The app includes an `ErrorBoundary` component that catches React errors and displays a user-friendly error page. In development mode, detailed error information is shown for debugging.

## 12. Analytics & Tracking

Firebase Analytics is integrated to track key user actions:

- `sign_up` - User registration
- `login` - User login
- `rfq_created` - RFQ creation by buyers
- `bid_submitted` - Bid submission by suppliers
- `bid_awarded` - Bid award by buyers
- `bid_withdrawn` - Bid withdrawal by suppliers
- `page_view` - Page navigation tracking

Analytics events are automatically logged and can be viewed in the Firebase Console.

## 13. Performance Monitoring

Firebase Performance Monitoring is integrated to track app performance metrics. Performance data is automatically collected and can be viewed in the Firebase Console.

## 14. Design system

The UI combines a gradient hero with a glassmorphism sign-up card. Colours are configured under the custom `brand` palette in `tailwind.config.js`, and a `shadow-glow` helper creates the halo around headline elements.

Feel free to extend the palette or add new utility layers as your component library grows.

## 15. Project Structure

```
src/
├── components/          # React components
│   ├── RFQBuyerPanel.js
│   ├── RFQSupplierPanel.js
│   ├── SupplierCatalogPanel.js
│   ├── SupplierLogisticsPanel.js
│   ├── BuyerShipmentsPanel.js
│   ├── TwoFactorPanel.js
│   ├── TwoFactorChallenge.js
│   ├── AdminComplianceConsole.js
│   └── ErrorBoundary.js
├── pages/              # Page components
│   ├── LoginPage.js
│   ├── SignupPage.js
│   └── DashboardPage.js
├── services/           # Service modules
│   ├── buyers.js
│   └── suppliers.js
├── auth.js             # Authentication utilities
├── analytics.js        # Analytics tracking
├── firebaseConfig.js   # Firebase configuration
├── rfqService.js       # RFQ & bidding services
├── catalogService.js   # Catalog management
├── logisticsService.js # Logistics & shipments
├── complianceService.js # Compliance reviews
├── twoFactorService.js # 2FA utilities
└── App.js              # Main app with routing
```

## 16. Next Steps

After setting up Firebase:

1. Configure Firebase Authentication (Email/Password provider)
2. Set up Firestore database with security rules
3. Configure Cloud Storage with security rules
4. Enable Firebase Analytics (optional)
5. Enable Firebase Performance Monitoring (optional)
6. Deploy to Firebase Hosting or your preferred hosting platform

The app is fully functional and ready for Firebase configuration!
