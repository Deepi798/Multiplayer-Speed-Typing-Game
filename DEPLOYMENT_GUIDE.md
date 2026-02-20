# Deployment Guide - Speed Typing Game

## Quick Deploy to Render (Recommended - FREE)

1. **Create GitHub Repository:**
   - Go to https://github.com/new
   - Create a new repository
   - Upload all your files from: `C:\Users\deepi\OneDrive\Desktop\rapid_link`

2. **Deploy on Render:**
   - Go to https://render.com
   - Sign up (free)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name:** speed-typing-game
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `gunicorn --worker-class eventlet -w 1 app:app`
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment
   - Your public URL: `https://speed-typing-game.onrender.com`

## Alternative: Railway (Also FREE)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-configures everything
6. Get your URL: `https://your-app.up.railway.app`

## Alternative: Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. In your project folder:
   ```bash
   cd C:\Users\deepi\OneDrive\Desktop\rapid_link
   vercel
   ```

3. Follow the prompts
4. Get URL: `https://your-app.vercel.app`

## Files Included for Deployment:

- ✅ `requirements.txt` - Python dependencies
- ✅ `Procfile` - Heroku/Render configuration
- ✅ `runtime.txt` - Python version
- ✅ `.gitignore` - Files to ignore in Git

## Important Notes:

1. **Free tier limitations:**
   - Render: App sleeps after 15 min of inactivity (wakes up in ~30 seconds)
   - Railway: 500 hours/month free
   - Vercel: Serverless, always on

2. **For production:**
   - Change `SECRET_KEY` in app.py to a random string
   - Consider using a database for persistent rooms
   - Add rate limiting for security

3. **Testing:**
   - After deployment, test with multiple devices
   - Share the public URL with friends
   - Check WebSocket connections work

## Need Help?

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs

## Your Game Features:

✅ Real-time multiplayer
✅ Solo play mode
✅ 15 rounds (Easy → Medium → Hard)
✅ Professional dark UI
✅ Mobile-friendly
✅ Room codes for easy joining
✅ Live leaderboard
✅ Reaction time scoring
