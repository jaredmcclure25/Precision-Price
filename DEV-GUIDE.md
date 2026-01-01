# Precision Prices - Local Development Guide

## Quick Start for Testing Locally

### Starting the Development Environment

You have **two options** for running the app locally:

#### Option 1: Run Both Servers Together (Recommended)
```bash
npm run dev:all
```
This starts both the frontend (Vite) and backend (Express) servers simultaneously.

#### Option 2: Run Servers Separately
Open two terminal windows:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server
```

### Access Your Local App

- **Frontend URL**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Password**: `m@rk3tplacetool`

### Testing Without Deploying

All changes you make will appear immediately at http://localhost:5173

The local version:
- ✅ Uses your local code (not the deployed version)
- ✅ Connects to localhost:3001 backend automatically
- ✅ Saves data to your browser's local storage
- ✅ Hot-reloads when you save files
- ✅ Works independently from the live site

### Common Development Tasks

#### Test a Change
1. Edit your code in VS Code
2. Save the file (Cmd+S / Ctrl+S)
3. Refresh http://localhost:5173 in your browser
4. Test the feature

#### View Backend Logs
The terminal running `npm run server` shows all API requests and errors

#### Clear Password Protection (for testing)
Open browser console (F12) and run:
```javascript
await window.storage.remove('auth_token');
```
Then refresh the page.

### Deploying to Production

When you're happy with your local changes:

```bash
# 1. Stage and commit your changes
git add .
git commit -m "Description of your changes"

# 2. Push to GitHub
git push

# 3. Vercel auto-deploys
# Visit https://vercel.com to watch the deployment
# Your changes will be live at https://www.precisionprices.com in 1-3 minutes
```

### Environment Files

#### Local Development (.env)
Your `.env` file contains the Anthropic API key for local testing.
**Never commit this file to GitHub!** (It's already in .gitignore)

#### Production (Vercel)
The same API key is stored in Vercel's environment variables dashboard.

### Troubleshooting

#### Port Already in Use Error
If you see `EADDRINUSE: address already in use :::3001`:
```bash
# Kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Then restart
npm run dev:all
```

#### Frontend Loads But API Fails
1. Check that backend is running on port 3001
2. Verify `.env` file exists with ANTHROPIC_API_KEY
3. Check terminal for backend errors

#### Changes Not Appearing
1. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Clear browser cache
3. Restart dev server

### Project Structure

```
precision-prices/
├── src/
│   ├── App.jsx              # Main application component
│   ├── PasswordProtection.jsx  # Password protection wrapper
│   ├── main.jsx             # Application entry point
│   └── ...
├── api/                     # Vercel serverless functions (production)
│   ├── analyze.js           # Image analysis endpoint
│   └── health.js            # Health check endpoint
├── server.js                # Local development backend
├── .env                     # Local environment variables (not in git)
└── DEV-GUIDE.md            # This file
```

### Key Features of Local Setup

- **Auto-reload**: Changes appear instantly without restarting
- **Same password protection**: Tests the full user experience
- **Real API calls**: Uses actual Anthropic API for accurate testing
- **Isolated from production**: Your experiments won't affect live users
- **Fast iteration**: Test → Edit → Test cycle in seconds

### What's Different Between Local and Production?

| Feature | Local (localhost:5173) | Production (precisionprices.com) |
|---------|----------------------|----------------------------------|
| Backend | Express server (server.js) | Vercel serverless (/api/*.js) |
| API URL | http://localhost:3001 | /api (relative URL) |
| Data Storage | Browser localStorage | Browser localStorage |
| Updates | Instant (save file) | 1-3 min (git push + deploy) |
| API Key | .env file | Vercel env variables |

---

**Happy coding!** 🚀 Make changes locally, test thoroughly, then deploy with confidence.
