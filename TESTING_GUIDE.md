# Testing Your BuildLink App 🧪

Now that Firebase is set up, let's test everything works!

## ✅ Quick Test Checklist

### 1. App Loads Successfully
- [ ] Open http://localhost:3000
- [ ] You should see the login page
- [ ] No error messages in the console

### 2. Create a Test Account
- [ ] Click "Sign up" or go to `/signup`
- [ ] Choose a role (Supplier or Buyer)
- [ ] Fill in the form:
  - Email: `test@example.com`
  - Password: `test123456` (min 6 characters)
  - Company name (if supplier)
  - Phone number (if supplier)
  - Project focus (if buyer)
- [ ] Click "Create account"
- [ ] Should redirect to dashboard

### 3. Test Authentication
- [ ] Sign out
- [ ] Sign back in with the same credentials
- [ ] Should work without errors

### 4. Test Credential Upload (Supplier/Buyer)
- [ ] After login, scroll to "Upload your credential documents"
- [ ] Click "browse files"
- [ ] Upload a test PDF or image
- [ ] Should show upload progress
- [ ] File should appear in "Uploaded documents"

### 5. Test RFQ Creation (Buyer)
- [ ] Create a buyer account
- [ ] Scroll to "Create a new RFQ"
- [ ] Fill in:
  - Project title
  - Budget
  - Proposal deadline
  - Scope summary
  - Add line items
- [ ] Click "Publish RFQ"
- [ ] Should see success message

### 6. Test Bid Submission (Supplier)
- [ ] Create a supplier account
- [ ] Scroll to "Opportunities curated for you"
- [ ] If there are RFQs, click to expand
- [ ] Fill in bid amount and details
- [ ] Click "Submit bid"
- [ ] Should see success message

### 7. Test Two-Factor Authentication
- [ ] Scroll to "Two-Factor Authentication" section
- [ ] Click "Enable 2FA"
- [ ] Scan QR code with authenticator app
- [ ] Enter verification code
- [ ] Should enable successfully

## 🐛 Common Issues & Fixes

### Issue: "Firebase: Error (auth/configuration-not-found)"
**Fix**: Make sure `.env.local` file exists and has all the values

### Issue: "Permission denied" errors
**Fix**: Check that you pasted the security rules correctly in Firebase

### Issue: Can't upload files
**Fix**: 
1. Check Storage is enabled in Firebase
2. Verify Storage rules are published
3. Check browser console for specific errors

### Issue: Can't create RFQ/Bid
**Fix**:
1. Check Firestore is enabled
2. Verify Firestore rules are published
3. Make sure you're logged in

## 🎉 Success Indicators

If everything works, you should see:
- ✅ No Firebase errors in console
- ✅ Can create accounts
- ✅ Can login/logout
- ✅ Can upload files
- ✅ Can create RFQs (buyers)
- ✅ Can submit bids (suppliers)
- ✅ Data persists after refresh

## 📊 Check Firebase Console

Verify data is being saved:
1. Go to Firebase Console
2. Check **Firestore Database** → Should see collections:
   - `users`
   - `suppliers` or `buyers`
   - `rfqs` (if you created one)
   - `bids` (if you submitted one)
3. Check **Storage** → Should see `credentials/` folder with uploaded files

## 🚀 Next Steps

Once everything is tested:
1. Create real user accounts
2. Set up admin account (manually in Firestore)
3. Start using the app!

---

**If you encounter any errors, let me know and I'll help fix them!**



