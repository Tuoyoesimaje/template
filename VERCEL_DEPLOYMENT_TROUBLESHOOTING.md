# 🚨 Vercel Deployment Troubleshooting Guide

## Problem: "Frontend showing just HTML without CSS/JS"

### ✅ **SOLUTION: Deploy Frontend Separately**

## Step-by-Step Fix

### 1. **Create NEW Vercel Project** (Don't reuse existing)
```
Project Name: alfred-ai-frontend
Framework: Vite
Root Directory: frontend/
```

### 2. **Vercel Project Settings**
```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node Version: 18.x or later
```

### 3. **Environment Variables** (CRITICAL)
Go to: **Project Settings → Environment Variables**

Add:
```
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

### 4. **Framework Detection**
In Vercel dashboard, make sure:
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend/`

### 5. **Build Logs Check**
After deployment, check the build logs in Vercel:
- Go to **Deployments** → Click on latest deployment
- Check **Build Logs** tab
- Look for any errors

## Common Issues & Solutions

### Issue 1: "No framework detected"
**Solution**: Set Framework Preset to "Vite" manually

### Issue 2: "Build failed"
**Solution**: Check that all dependencies are in `frontend/package.json`

### Issue 3: "Assets not loading"
**Solution**: Make sure `outputDirectory` is set to `dist`

### Issue 4: "Environment variables not working"
**Solution**: Use Vercel dashboard (not .env file) for production

## Alternative: Manual Vercel Configuration

If auto-detection fails, create `vercel.json`:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## Verification Steps

1. **Check Build Output**:
   ```bash
   cd frontend
   npm run build
   ls -la dist/
   ```
   Should show: `index.html`, `assets/` folder

2. **Test Locally**:
   ```bash
   cd frontend
   npm run preview
   ```
   Should work on `http://localhost:4173`

3. **Check Vercel Deployment**:
   - Visit your Vercel URL
   - Open browser DevTools (F12)
   - Check Console for errors
   - Check Network tab for failed asset loads

## Final Checklist

- ✅ **Root Directory**: `frontend/` (not entire repo)
- ✅ **Framework**: Vite
- ✅ **Environment Variables**: Set in Vercel dashboard
- ✅ **Build Command**: `npm run build`
- ✅ **Output Directory**: `dist`
- ✅ **Dependencies**: All in `frontend/package.json`

## If Still Not Working

1. **Delete the Vercel project**
2. **Create a new one** with the settings above
3. **Push latest changes** to GitHub first
4. **Redeploy**

## Success Indicators

- ✅ Page loads with styling
- ✅ JavaScript functionality works
- ✅ No console errors
- ✅ Assets load from `/assets/` path
- ✅ API calls work (check Network tab)

---

**Remember**: Deploy `frontend/` folder separately, not the entire monorepo!