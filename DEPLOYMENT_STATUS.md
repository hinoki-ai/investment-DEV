# 🚀 Deployment Status - Investment Dashboard

## ✅ COMPLETED

### Frontend
- **Status:** LIVE ✅
- **URL:** https://inv.aramac.dev
- **Platform:** Cloudflare Pages

### File Storage  
- **Status:** LIVE ✅
- **Platform:** Cloudflare R2
- **Bucket:** investments

### GitHub Repository
- **Status:** SYNCED ✅
- **URL:** https://github.com/hinoki-ai/investment-DEV

### Render Configuration
- **Status:** READY ✅
- **File:** `render.yaml` (with AI API key support)

---

## ⏳ MANUAL STEPS REQUIRED

### 1️⃣ Deploy Backend to Render (2 minutes)

**Click this URL:**
```
https://dashboard.render.com/blueprint?repo=https://github.com/hinoki-ai/investment-DEV
```

**Steps:**
1. Click **"Connect"** 
2. Click **"Apply"**
3. Wait for green checkmarks (3-5 minutes)

**This creates:**
- `investment-api` - FastAPI web service
- `investment-db` - PostgreSQL database  
- `investment-redis` - Redis cache

---

### 2️⃣ Add AI API Key (Required for document analysis)

After deployment, in Render dashboard:
1. Go to **investment-api** → **Environment**
2. Add **KIMI_API_KEY** (get from https://platform.moonshot.cn/)
   - OR add **AI_API_KEY** for generic fallback
3. Service will auto-restart

---

### 3️⃣ Add Custom Domain

In Render dashboard:
1. Go to **investment-api** → **Settings** → **Custom Domains**
2. Add: `api.inv.aramac.dev`
3. Copy the **DNS Target** provided

In Cloudflare:
1. Add CNAME record:
   - **Name:** `api`
   - **Target:** (Render's DNS target)

---

### 4️⃣ Connect Frontend to API

In Cloudflare Pages:
1. Go to **Pages** → **investment-aramac** → **Settings** → **Environment variables**
2. Add: `VITE_API_URL=https://api.inv.aramac.dev`
3. Click **Save & Deploy**

---

## 🎯 FINAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                              │
│  ┌─────────────────────┐    ┌─────────────────────────┐    │
│  │  inv.aramac.dev     │    │  R2: investments        │    │
│  │  (Pages - LIVE)     │    │  (Storage - LIVE)       │    │
│  └──────────┬──────────┘    └─────────────────────────┘    │
│             │                                               │
│             │  API calls                                    │
│             ▼                                               │
│  ┌─────────────────────┐                                    │
│  │  api.inv.aramac.dev │◄─── Render (PostgreSQL + Redis)   │
│  │  (Backend - READY)  │                                    │
│  └─────────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 CREDENTIALS LOCATION

All credentials stored securely in:
- `.secrets/r2_credentials.txt`
- `.env.production`

---

## 🆘 TROUBLESHOOTING

### If Render deployment fails:
- Check logs in Render dashboard
- Verify `render.yaml` is in repo root
- Ensure Dockerfile exists at `api/Dockerfile`

### If API doesn't respond:
- Check health endpoint: `/health`
- Verify `DATABASE_URL` and `REDIS_URL` env vars
- Check PostgreSQL and Redis are provisioned

### If frontend can't connect:
- Verify `VITE_API_URL` is set correctly
- Check CORS_ORIGINS includes frontend URL
- Check browser console for errors
