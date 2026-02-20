# Complete Guide: GitHub → Deployment

## Step 1: Install Git (if not installed)

Download and install Git:
https://git-scm.com/download/win

## Step 2: Create GitHub Account

Go to: https://github.com
Sign up for free account

## Step 3: Create New Repository on GitHub

1. Go to: https://github.com/new
2. Repository name: `speed-typing-game`
3. Description: "Real-time multiplayer typing game"
4. Keep it Public (or Private if you prefer)
5. DON'T check "Initialize with README" (we already have files)
6. Click "Create repository"

## Step 4: Push Your Code to GitHub

Open Command Prompt in your project folder:
```
cd C:\Users\deepi\OneDrive\Desktop\rapid_link
```

Run these commands one by one:

```bash
# Initialize git
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit - Speed Typing Game"

# Set main branch
git branch -M main

# Add your GitHub repository (REPLACE with your actual URL)
git remote add origin https://github.com/YOUR_USERNAME/speed-typing-game.git

# Push to GitHub
git push -u origin main
```

**Note:** Replace `YOUR_USERNAME` with your actual GitHub username!

If it asks for credentials:
- Username: Your GitHub username
- Password: Use a Personal Access Token (not your password)
  - Get token: https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Select "repo" scope
  - Copy the token and use it as password

---

## Step 5: Deploy to Render (FREE)

### Option A: Deploy from GitHub (Recommended)

1. Go to: https://render.com
2. Sign up with GitHub (easiest way)
3. Click "New +" → "Web Service"
4. Click "Connect a repository"
5. Select your `speed-typing-game` repository
6. Configure:
   - **Name:** speed-typing-game
   - **Region:** Choose closest to you
   - **Branch:** main
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn --worker-class eventlet -w 1 app:app`
7. Click "Create Web Service"
8. Wait 5-10 minutes for deployment
9. Your public URL: `https://speed-typing-game.onrender.com`

### Option B: Deploy from Git URL (Alternative)

1. Go to: https://render.com
2. Click "New +" → "Web Service"
3. Choose "Public Git repository"
4. Paste your GitHub repo URL: `https://github.com/YOUR_USERNAME/speed-typing-game`
5. Follow same configuration as Option A

---

## Step 6: Test Your Deployed App

1. Open the Render URL in your browser
2. Test solo play first
3. Open multiple browser windows to test multiplayer
4. Share URL with friends to test real multiplayer

---

## Alternative Deployment Options

### Railway (Also FREE)

1. Go to: https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `speed-typing-game` repository
6. Railway auto-detects and deploys
7. Get your URL from the dashboard

### Vercel (FREE)

1. Go to: https://vercel.com
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your `speed-typing-game` repository
5. Vercel auto-configures
6. Get your URL

---

## Troubleshooting

### Git Push Issues

**Error: "remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/speed-typing-game.git
```

**Error: "Authentication failed"**
- Use Personal Access Token instead of password
- Get token: https://github.com/settings/tokens

**Error: "Permission denied"**
- Make sure you're logged into GitHub
- Check repository URL is correct

### Deployment Issues

**Build Failed:**
- Check `requirements.txt` has all dependencies
- Check Python version in `runtime.txt`
- View build logs in Render dashboard

**App Not Starting:**
- Check Start Command is correct
- View application logs
- Ensure `gunicorn` and `eventlet` are in requirements.txt

**WebSocket Not Working:**
- Render supports WebSockets by default
- Check if CORS is configured
- View browser console for errors (F12)

---

## Files Checklist

Make sure these files exist in your project:

✅ `app.py` - Main application
✅ `requirements.txt` - Python dependencies
✅ `Procfile` - Deployment configuration
✅ `runtime.txt` - Python version
✅ `.gitignore` - Files to ignore
✅ `templates/` folder - HTML files
✅ `static/` folder - CSS/JS files
✅ `sentences.txt` - Game sentences

---

## Quick Commands Reference

```bash
# Check git status
git status

# Add new changes
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push

# View remote URL
git remote -v

# Clone repository (if needed)
git clone https://github.com/YOUR_USERNAME/speed-typing-game.git
```

---

## After Deployment

1. **Test thoroughly** using TESTING_CHECKLIST.md
2. **Share URL** with friends
3. **Monitor logs** in Render dashboard
4. **Update code:**
   - Make changes locally
   - `git add .`
   - `git commit -m "Update message"`
   - `git push`
   - Render auto-deploys new version

---

## Free Tier Limitations

### Render Free Tier:
- ✅ 750 hours/month free
- ⚠️ App sleeps after 15 min inactivity
- ⚠️ Takes ~30 seconds to wake up
- ✅ WebSockets supported
- ✅ Custom domain supported

### Railway Free Tier:
- ✅ 500 hours/month free
- ✅ No sleep
- ✅ WebSockets supported

### Vercel Free Tier:
- ✅ Unlimited bandwidth
- ✅ Serverless (always on)
- ⚠️ 10-second function timeout

---

## Need Help?

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Git Docs: https://git-scm.com/doc
- GitHub Docs: https://docs.github.com

---

## Success!

Once deployed, you'll have:
- ✅ Public URL anyone can access
- ✅ Real-time multiplayer working
- ✅ Auto-deployment on code updates
- ✅ Free hosting (with limitations)

Share your game URL with the world! 🎮🚀
