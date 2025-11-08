# Firebase Extensions Integration Guide

This document explains how the Firebase Extensions are integrated into BuildLink.

## Installed Extensions

### 1. ✅ Extract Image Text with Cloud Vision AI
**Status**: Installed  
**Purpose**: Automatically extracts text from images uploaded to Storage

**How it works:**
- When credential documents (images/PDFs) are uploaded to `credentials/{userId}/`, the extension automatically processes them
- Extracted text is stored in the file's metadata or a related Firestore document
- Useful for automatically reading license numbers, certificate IDs, etc. from uploaded documents

**Integration:**
- Service: `src/services/imageTextExtractionService.js`
- Automatically processes files in the `credentials/` folder
- Can be used to pre-fill forms or verify document content

**Usage:**
```javascript
import { checkCredentialTextExtraction } from "../services/imageTextExtractionService";

const result = await checkCredentialTextExtraction(userId, fileName);
if (result.hasText) {
  console.log("Extracted text:", result.extractedText);
}
```

---

### 2. ✅ Firestore User Document
**Status**: Installed  
**Purpose**: Automatically manages user documents in Firestore

**How it works:**
- Automatically creates/updates user documents when users sign up
- Syncs user data between Authentication and Firestore
- Ensures user documents are always in sync

**Integration:**
- Works automatically with our existing `registerUser` function
- No additional code needed - extension handles it automatically
- User documents are created in the `users` collection

---

### 3. ✅ Validate Address in Firestore
**Status**: Installed  
**Purpose**: Validates addresses using Google Maps Platform

**How it works:**
- When an address is written to Firestore (suppliers/buyers collections), the extension validates it
- Uses Google Maps Geocoding API to verify and normalize addresses
- Stores validation results in the document

**Integration:**
- Service: `src/services/addressValidationService.js`
- Component: `src/components/AddressValidationBadge.js`
- Automatically validates addresses when suppliers/buyers update their address
- Shows validation status in the UI

**Usage:**
```javascript
import { validateAndSaveAddress } from "../services/addressValidationService";

const result = await validateAndSaveAddress(userId, address, role);
if (result.isValid) {
  console.log("Validated address:", result.validatedAddress);
}
```

**UI Integration:**
- Address validation badge appears in the dashboard
- Shows ✅ "Address validated" for valid addresses
- Shows ⚠️ "Address validation pending" for unvalidated addresses

---

## Extension Configuration

### Extract Image Text Extension
- **Trigger**: Files uploaded to Storage paths matching the configured pattern
- **Output**: Extracted text stored in file metadata or Firestore
- **Collection**: Check your Firebase Console for the extension's output collection

### Firestore User Document Extension
- **Trigger**: User creation/updates in Firebase Authentication
- **Output**: User document in `users` collection
- **Auto-sync**: Yes, automatic

### Validate Address Extension
- **Trigger**: Address field updates in Firestore documents
- **Collections**: `suppliers`, `buyers`
- **Fields**: `address`
- **Output**: `addressValidated`, `validatedAddress`, `addressValidationDetails`

---

## Testing Extensions

### Test Address Validation
1. Sign up as a supplier
2. Enter an address in the signup form
3. Check the dashboard - you should see address validation status
4. Check Firestore - the supplier document should have validation fields

### Test Image Text Extraction
1. Upload a credential document (image with text)
2. Wait a few seconds for processing
3. Check the file metadata or extension output collection
4. Extracted text should be available

### Test User Document Extension
1. Create a new user account
2. Check Firestore `users` collection
3. User document should be automatically created/updated

---

## Troubleshooting

### Address Validation Not Working
- Check that the extension is enabled in Firebase Console
- Verify the extension is configured for `suppliers` and `buyers` collections
- Check that the `address` field is being written to Firestore

### Image Text Extraction Not Working
- Verify the extension is configured for the correct Storage path pattern
- Check extension logs in Firebase Console
- Ensure the file format is supported (JPG, PNG, PDF)

### User Document Not Syncing
- Check extension configuration in Firebase Console
- Verify the extension is enabled
- Check extension logs for errors

---

## Next Steps

To add more functionality:
1. Check extension output collections in Firestore
2. Create services to read extension-generated data
3. Update UI components to display extension results
4. Add error handling for extension failures

---

## Extension Status

- ✅ Extract Image Text: Integrated
- ✅ Firestore User Document: Working automatically
- ✅ Validate Address: Integrated with UI
- ❌ Authenticate with WebAuthn: Error installing (can be fixed later)
- ❌ Build Chatbot with Gemini API: Error installing (optional feature)



