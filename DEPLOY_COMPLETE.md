# 🚀 Complete Deployment Guide

## Current Status

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend** | https://inv.aramac.dev | ✅ ONLINE |
| **API** | https://api.inv.aramac.dev | ❌ NEEDS DEPLOYMENT |
| **Cloudflare R2** | - | ❌ NEEDS CONFIGURATION |
| **AI Provider** | - | ❌ NEEDS API KEY |

---

## Step 1: Fix DNS Configuration ⚠️ CRITICAL

Your DNS has conflicting A records. You have TWO options:

### Option A: Use Vercel DNS (Recommended)

Remove the A records from your DNS provider and let Vercel manage everything:

1. Go to your domain registrar (where you bought aramac.dev)
2. Remove these A records:
   - `inv.aramac.dev` → 64.29.17.1, 216.198.79.1
   - `api.inv.aramac.dev` → 64.29.17.1, 216.198.79.65
3. Add these CNAME records:
   
   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | CNAME | inv | cname.vercel-dns.com | 3600 |
   | CNAME | api.inv | your-render-app.onrender.com | 3600 |

### Option B: Keep Current DNS Provider

If you want to keep your current DNS setup, update the A records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | inv | 76.76.21.21 | 3600 |

(76.76.21.21 is Vercel's IP - but CNAME is preferred)

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to https://dashboard.render.com
2. Sign up with GitHub

### 2.2 Create Blueprint Instance
1. In Render dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repo
3. Select the repo with this project
4. Render will read `render.yaml` and create:
   - PostgreSQL database
   - Redis instance
   - API web service
   - Worker background service

### 2.3 Configure Environment Variables

After blueprint deploys, set these in Render dashboard:

**API Service:**
- `STORAGE_ENDPOINT` - From Cloudflare R2 (see Step 3)
- `STORAGE_ACCESS_KEY` - From Cloudflare R2
- `STORAGE_SECRET_KEY` - From Cloudflare R2

**Worker Service:**
- `STORAGE_ENDPOINT` - From Cloudflare R2
- `STORAGE_ACCESS_KEY` - From Cloudflare R2
- `STORAGE_SECRET_KEY` - From Cloudflare R2
- `KIMI_API_KEY` - From Moonshot AI (see Step 4)

---

## Step 3: Configure Cloudflare R2 ☁️

### 3.1 Create R2 Bucket
1. Go to https://dash.cloudflare.com
2. Navigate to **R2 Object Storage**
3. Click **"Create bucket"**
4. Name: `family-investments`
5. Location: Automatic

### 3.2 Create API Token
1. In R2, click **"Manage R2 API Tokens"**
2. Click **"Create API Token"**
3. Token name: `investment-dashboard`
4. Permissions: **Object Read & Write**
5. Copy:
   - Access Key ID → `STORAGE_ACCESS_KEY`
   - Secret Access Key → `STORAGE_SECRET_KEY`
   - S3 API endpoint → `STORAGE_ENDPOINT`

### 3.3 Configure CORS (Important!)
In your R2 bucket:
1. Go to **Settings** → **CORS Policy**
2. Add policy:
```json
[
  {
    "AllowedOrigins": ["https://inv.aramac.dev"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Step 4: Get AI Provider API Key 🤖

### Option A: Kimi (Moonshot AI) - Recommended for documents
1. Go to https://platform.moonshot.cn/
2. Create account and get API key
3. Set `KIMI_API_KEY` in Worker env vars

### Option B: OpenAI
1. Go to https://platform.openai.com/
2. Get API key
3. Set `OPENAI_API_KEY` in Worker env vars

### Option C: Anthropic Claude
1. Go to https://console.anthropic.com/
2. Get API key
3. Set `ANTHROPIC_API_KEY` in Worker env vars

---

## Step 5: Database Migration

Once PostgreSQL is running on Render:

```bash
# Connect to Render PostgreSQL
psql $DATABASE_URL -f database/init.sql
```

Or use Render's console to run the SQL.

---

## Step 6: Verify Deployment ✅

Test these URLs after deployment:

```bash
# Frontend
curl https://inv.aramac.dev

# API Health
curl https://api.inv.aramac.dev/health

# API Docs
curl https://api.inv.aramac.dev/docs
```

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is set (32+ characters)
- [ ] CORS_ORIGINS includes only your domain
- [ ] R2 bucket is private
- [ ] API keys are NOT in code/repo
- [ ] Database has strong password
- [ ] Redis is not publicly accessible

---

## 🆘 Troubleshooting

### "DEPLOYMENT_NOT_FOUND" on API
- DNS not pointing to Render yet
- Wait 5-10 minutes for DNS propagation
- Check `dig api.inv.aramac.dev`

### "CORS Error" on file upload
- Check R2 CORS policy
- Verify `AllowedOrigins` matches your domain exactly

### "Database connection failed"
- Check DATABASE_URL format
- Verify Render PostgreSQL is "Available"

### "Worker not processing jobs"
- Check KIMI_API_KEY is set
- Check Worker logs in Render dashboard

---

## 📊 Final Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  User's Browser                                             │
└──────────────┬──────────────────────────────────────────────┘
               │
    ┌──────────▼──────────┐     ┌──────────────────┐
    │  inv.aramac.dev     │     │  api.inv.aramac  │
    │  (Vercel - React)   │◄────┤  (Render -       │
    │                     │     │   FastAPI)       │
    └──────────┬──────────┘     └────────┬─────────┘
               │                         │
               │    ┌────────────────────┤
               │    │                    │
    ┌──────────▼────▼──────┐  ┌─────────▼──────────┐
    │  Cloudflare R2       │  │  Render            │
    │  (File Storage)      │  │  ├─ PostgreSQL     │
    │                      │  │  ├─ Redis          │
    └──────────────────────┘  │  └─ Worker         │
                              └────────────────────┘
```

---

## 📞 Support

If you need help:
1. Check Render logs in dashboard
2. Check Vercel deployment logs
3. Verify all env vars are set
