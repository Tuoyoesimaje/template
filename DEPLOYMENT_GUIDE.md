# 🚀 Deployment Guide: Vercel + Render + MongoDB Atlas

This guide explains how to deploy your Alfred AI application to production using Vercel (frontend) and Render (backend) with MongoDB Atlas.

## 📋 Prerequisites

1. **MongoDB Atlas Account**: [Create a free cluster](https://mongodb.com/atlas)
2. **Vercel Account**: [Sign up at vercel.com](https://vercel.com)
3. **Render Account**: [Sign up at render.com](https://render.com)
4. **GitHub Repository**: Push your code to GitHub

## 🗄️ Step 1: Set up MongoDB Atlas

1. Create a new cluster (free tier is fine)
2. Create a database user with read/write permissions
3. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/studentbuddy
   ```
4. Whitelist IP addresses (0.0.0.0/0 for development)

## 🔧 Step 2: Deploy Backend to Render

### Option A: Using Render Dashboard

1. **Connect Repository**:
   - Go to [render.com](https://render.com) and sign in
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend/` folder as the root directory

2. **Configure Service**:
   ```
   Name: alfred-ai-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm run start:production
   ```

3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studentbuddy
   JWT_SECRET=your-super-secret-jwt-key-here
   GEMINI_API_KEY=your-gemini-api-key
   ALLOWED_ORIGINS=https://alfred-ai-frontend.vercel.app,https://alfred-ai-frontend.onrender.com
   ```

4. **Deploy**: Click "Create Web Service"

### Option B: Using render.yaml

If you prefer using the render.yaml file:

1. Push your code to GitHub
2. In Render dashboard, create a new "Blueprint" service
3. Connect your repository
4. Render will automatically detect and deploy using render.yaml

## 🎨 Step 3: Deploy Frontend to Vercel

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Set environment variables
vercel env add VITE_API_BASE_URL
# Enter: https://alfred-ai-backend.onrender.com
```

### Option B: Using Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings:
     ```
     Framework Preset: Vite
     Root Directory: frontend
     Build Command: npm run build
     Output Directory: dist
     ```

2. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://alfred-ai-backend.onrender.com
   ```

3. **Deploy**: Click "Deploy"

## 🔗 Step 4: Update CORS (After Deployment)

Once both services are deployed, update your backend's `ALLOWED_ORIGINS`:

```bash
# In Render dashboard, update environment variables:
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-render-app.onrender.com
```

## 🧪 Step 5: Test Your Deployment

1. **Frontend**: Visit your Vercel URL
2. **Backend Health Check**: Visit `https://your-backend.onrender.com/api/health`
3. **API Connectivity**: Try logging in or creating a reminder
4. **Database**: Verify data is being saved to MongoDB Atlas

## 📝 Environment Variables Summary

### Backend (Render)
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studentbuddy
JWT_SECRET=your-super-secret-jwt-key-here
GEMINI_API_KEY=your-gemini-api-key
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.onrender.com
```

### Frontend (Vercel)
```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Check `ALLOWED_ORIGINS` in backend
   - Ensure frontend URL is included
   - Clear browser cache

2. **Database Connection**:
   - Verify MongoDB Atlas connection string
   - Check IP whitelist (0.0.0.0/0 for testing)
   - Ensure database user has correct permissions

3. **Environment Variables**:
   - Use Render/Vercel dashboards to set variables
   - Restart services after changing variables
   - Check variable names match exactly

4. **Build Failures**:
   - Check build logs in Render/Vercel dashboards
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

## 🔄 Updating Your Deployment

1. **Push changes to GitHub**
2. **Render**: Auto-deploys on push to main branch
3. **Vercel**: Auto-deploys on push to main branch
4. **Manual redeploy**: Use dashboard buttons if needed

## 💡 Pro Tips

- Use different branches for staging/production
- Set up monitoring with Render's built-in tools
- Configure custom domains in both services
- Use MongoDB Atlas monitoring for database performance
- Set up backup policies in MongoDB Atlas

## 🎉 You're Done!

Your Alfred AI application is now live with:
- ✅ MongoDB Atlas database
- ✅ Render backend API
- ✅ Vercel frontend
- ✅ Production-ready architecture

Visit your Vercel URL to start using your app! 🚀