# Deploying BuildLink to Vercel 🚀

## Quick Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Go to Vercel**:
   - Visit https://vercel.com
   - Sign in with GitHub
   - Click "Add New Project"

3. **Import your repository**:
   - Select your `buildlink-web` repository
   - Vercel will auto-detect it's a Create React App

4. **Configure Environment Variables**:
   - Click "Environment Variables"
   - Add all your Firebase config variables:
     ```
     REACT_APP_FIREBASE_API_KEY
     REACT_APP_FIREBASE_AUTH_DOMAIN
     REACT_APP_FIREBASE_DATABASE_URL
     REACT_APP_FIREBASE_PROJECT_ID
     REACT_APP_FIREBASE_STORAGE_BUCKET
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID
     REACT_APP_FIREBASE_APP_ID
     REACT_APP_FIREBASE_MEASUREMENT_ID
     ```
   - Copy values from your `.env.local` file

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live! 🎉

---

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked about environment variables, add them or skip and add later in dashboard

4. **For production deployment**:
   ```bash
   vercel --prod
   ```

---

## Environment Variables Setup

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Important**: Make sure to add these for all environments (Production, Preview, Development)

---

## Build Settings

Vercel will auto-detect:
- **Framework**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

These are already configured in `vercel.json`.

---

## Post-Deployment Checklist

After deployment:

1. ✅ **Test the live site**:
   - Visit your Vercel URL
   - Test login/signup
   - Verify Firebase connection

2. ✅ **Update Firebase Authorized Domains**:
   - Go to Firebase Console → Authentication → Settings
   - Add your Vercel domain to "Authorized domains"
   - Example: `your-app.vercel.app`

3. ✅ **Check Firebase Security Rules**:
   - Ensure rules allow requests from your Vercel domain
   - Test that data can be read/written

4. ✅ **Verify Environment Variables**:
   - Check that all Firebase config is working
   - Test file uploads (Storage)
   - Test Firestore operations

5. ✅ **Custom Domain (Optional)**:
   - In Vercel Dashboard → Settings → Domains
   - Add your custom domain
   - Update Firebase authorized domains with custom domain

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18+ by default)

### Firebase Not Working
- Verify environment variables are set correctly
- Check Firebase Console for errors
- Ensure authorized domains include Vercel URL

### Routing Issues
- The `vercel.json` includes rewrites for React Router
- All routes should redirect to `index.html`

### Performance
- Vercel automatically optimizes builds
- Static assets are cached
- Consider enabling Vercel Analytics

---

## Continuous Deployment

Once connected to GitHub:
- Every push to `main` → Production deployment
- Every pull request → Preview deployment
- Automatic deployments on every commit

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Firebase + Vercel: https://vercel.com/guides/deploying-react-with-vercel
- Support: Check Vercel dashboard for build logs

---

**Your app is ready to deploy! 🚀**



