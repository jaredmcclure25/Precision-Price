# SellSmartAI Setup Guide

## 🚀 Quick Start

### 1. Add Your API Key

Edit the `.env` file and replace `your-api-key-here` with your actual Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

**Where to get your API key:**
- Go to https://console.anthropic.com/
- Click "API Keys" in the sidebar
- Create a new key or copy an existing one

### 2. Start Both Servers

You have two options:

**Option A: Run both servers together (recommended)**
```bash
npm run dev:all
```

**Option B: Run separately in two terminals**

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### 3. Open the App

Open your browser to: http://localhost:5173

## ℹ️ What's Running

- **Frontend (Vite)**: http://localhost:5173 - Your React app
- **Backend (Express)**: http://localhost:3001 - API proxy server

## 🔧 How It Works

```
Browser → Frontend (localhost:5173) → Backend (localhost:3001) → Anthropic API
```

The backend server:
- Keeps your API key secure (not exposed in browser)
- Handles CORS issues
- Proxies requests to Anthropic API

## 🛠️ Troubleshooting

### "ANTHROPIC_API_KEY not set" error
- Make sure you edited `.env` and added your real API key
- Restart the backend server after changing `.env`

### CORS errors still appearing
- Make sure the backend server is running on port 3001
- Check that both servers are running

### Port already in use
- Backend: Change `PORT` in `server.js`
- Frontend: Vite will prompt you to use a different port

## 📝 Available Scripts

- `npm run dev` - Start frontend only
- `npm run server` - Start backend only
- `npm run dev:all` - Start both frontend and backend
- `npm run build` - Build for production
- `npm test` - Run tests

## 🔒 Security Notes

- ✅ API key is stored in `.env` (not in code)
- ✅ `.env` is in `.gitignore` (won't be committed)
- ✅ Backend validates all requests
- ✅ CORS is configured for localhost only

## 🚢 Production Deployment

For production, you'll need to:
1. Deploy the backend to a hosting service (Heroku, Railway, Render, etc.)
2. Update the frontend API URL to your deployed backend
3. Set environment variables on your hosting platform
4. Deploy the frontend to Vercel, Netlify, or similar

Need help with deployment? Let me know!
