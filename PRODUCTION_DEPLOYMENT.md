# 🚀 Alfred AI - Production Deployment Guide

## 📋 Overview

This guide covers deploying both the web and mobile apps to production with proper configuration for cross-platform theme synchronization.

## 🏗️ Architecture

```
┌─────────────────┐    HTTPS    ┌─────────────────┐
│   Mobile App    │────────────▶│   Render App    │
│   (Expo/Store)  │             │ (Vite + Node)  │
└─────────────────┘             └─────────────────┘
                                   │
                                   ▼
                            ┌─────────────────┐
                            │   Database      │
                            │ (MongoDB Atlas) │
                            └─────────────────┘
```

## 🔧 Configuration Files Updated

### ✅ Mobile App (`mobile/app.json`)
```json
"extra": {
  "defaultApiRoot": "https://alfred-ai-backend.onrender.com"
}
```

### ✅ API Configuration (`mobile/src/lib/core.ts`)
```typescript
const DEFAULT_ANDROID_API = 'https://alfred-ai-backend.onrender.com';
const DEFAULT_IOS_API = 'https://alfred-ai-backend.onrender.com';
```

### ✅ Environment Variables (`.env.production`)
```env
NODE_ENV=production
PORT=10000
API_BASE_URL=https://alfred-ai-backend.onrender.com
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=your_jwt_secret_here
```

### ✅ Package Scripts (`package.json`)
```json
"scripts": {
  "build:production": "NODE_ENV=production vite build",
  "start:production": "NODE_ENV=production node server.js",
  "production": "npm run build:production && npm run start:production"
}
```

## 🚀 Deployment Steps

### 1️⃣ Deploy Backend to Render

#### Option A: Using Render Dashboard
1. **Connect Repository**: Link your GitHub repo to Render
2. **Service Type**: Choose "Web Service"
3. **Runtime**: Node.js
4. **Build Command**: `npm install`
5. **Start Command**: `npm run start:production`

#### Option B: Using render.yaml
1. **Push render.yaml** to your repository
2. **Connect to Render** with Blueprints
3. **Render auto-configures** both frontend and backend

### 2️⃣ Set Environment Variables in Render

```
NODE_ENV=production
PORT=10000
API_BASE_URL=https://alfred-ai-backend.onrender.com
GEMINI_API_KEY=your_actual_gemini_key
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
```

### 3️⃣ Update Mobile App URLs

Replace `alfred-ai-backend.onrender.com` with your actual Render domain:

```json
// mobile/app.json
"extra": {
  "defaultApiRoot": "https://your-actual-render-domain.onrender.com"
}
```

```typescript
// mobile/src/lib/core.ts
const DEFAULT_ANDROID_API = 'https://your-actual-render-domain.onrender.com';
const DEFAULT_IOS_API = 'https://your-actual-render-domain.onrender.com';
```

### 4️⃣ Build Mobile App

#### For Expo Go Testing:
```bash
cd mobile
npx expo start --clear
```

#### For App Store/Google Play:
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

## 🎨 Theme Features

### Available Themes:
- ✅ `light` - Default light theme
- ✅ `dark` - Original dark theme
- ✅ `dark-blue` - New dark theme with blue accents
- ✅ `dark-green` - New dark theme with green accents
- ✅ `dark-purple` - New dark theme with purple accents
- ✅ `dark-red` - New dark theme with red accents
- ✅ `darker-teal` - New darker teal theme
- ✅ All other existing themes

### Theme Commands:
```
.theme dark-blue
.theme dark-green
.theme dark-purple
.theme dark-red
.theme darker-teal
```

## 🔍 Testing Production

### 1. Test Backend API:
```bash
curl https://your-render-domain.onrender.com/api/health
```

### 2. Test Mobile Connection:
- Open Expo Go
- Scan QR code
- Try login/signup
- Test theme switching

### 3. Test Web App:
- Visit `https://your-render-domain.onrender.com`
- Test all features
- Verify theme sync

## 📱 Mobile App Features

- ✅ **Cross-platform themes** (syncs with web)
- ✅ **Offline functionality** (works without server)
- ✅ **Secure authentication** (JWT tokens)
- ✅ **Real-time chat** with AI
- ✅ **Reminders management**
- ✅ **Notes editor**
- ✅ **Quiz system**

## 🌐 Web App Features

- ✅ **Responsive design**
- ✅ **Theme synchronization**
- ✅ **Real-time chat**
- ✅ **User authentication**
- ✅ **Data persistence**
- ✅ **Mobile-optimized UI**

## 🔒 Security Configuration

### CORS Settings (server.js):
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',           // Development
    'https://your-render-domain.onrender.com', // Production web
    'exp://your-expo-app',             // Expo Go
    'http://localhost:8081',           // Expo dev
  ],
  credentials: true
};
```

### Environment Variables:
- ✅ `NODE_ENV=production`
- ✅ `JWT_SECRET` (strong, random string)
- ✅ `GEMINI_API_KEY` (securely stored)
- ✅ `MONGODB_URI` (MongoDB Atlas connection string - required)

## 🚨 Troubleshooting

### Common Issues:

#### 1. Mobile App Can't Connect:
- ✅ Check API URL in `mobile/app.json`
- ✅ Verify Render domain is correct
- ✅ Check CORS settings on server

#### 2. Themes Not Syncing:
- ✅ Ensure server is running
- ✅ Check network connectivity
- ✅ Verify API endpoints

#### 3. Build Failures:
- ✅ Update Expo SDK versions
- ✅ Clear Expo cache: `npx expo start --clear`
- ✅ Check for deprecated packages

## 📊 Performance Optimization

### Backend:
- ✅ Environment-specific configurations
- ✅ Optimized bundle size
- ✅ Database connection pooling
- ✅ Rate limiting enabled

### Frontend:
- ✅ Code splitting with Vite
- ✅ Optimized images
- ✅ Lazy loading components
- ✅ Service worker for caching

### Mobile:
- ✅ Optimized bundle size
- ✅ Efficient theme switching
- ✅ Offline data persistence

## 🎯 Final Checklist

- [ ] Backend deployed to Render
- [ ] Environment variables configured
- [ ] Mobile app URLs updated
- [ ] CORS settings configured
- [ ] SSL certificate active
- [ ] Domain configured
- [ ] Mobile app tested
- [ ] Web app tested
- [ ] Theme synchronization verified
- [ ] Performance optimized

## 🚀 Go Live!

Once everything is configured and tested:

1. **Deploy to production**
2. **Update DNS** (if using custom domain)
3. **Submit mobile apps** to app stores
4. **Monitor performance**
5. **Scale as needed**

Your Alfred AI app is now production-ready! 🎉

---

**Need help with deployment?** Check the troubleshooting section or contact support! 🚀