# 🚀 Cloudflare Full Deployment Guide

## ✅ CURRENT STATUS

| Component | Status |
|-----------|--------|
| Cloudflare Account | ✅ Authenticated |
| Zone aramac.dev | ✅ Found (ID: 9298f1336c76775292a865952289e871) |
| Zone Status | ⏳ Pending (need nameserver change at GoDaddy) |

---

## 🔧 STEP 1: Update Nameservers at GoDaddy

Your domain is currently using Vercel nameservers. Change to Cloudflare:

**Current:**
- cname.vercel-dns.com
- ns1.vercel-dns.com  
- ns2.vercel-dns.com

**Change to:**
- keira.ns.cloudflare.com
- west.ns.cloudflare.com

### How to update:
1. Go to https://dcc.godaddy.com/manage/aramac.dev/dns
2. Click "Change" under Nameservers
3. Select "Enter my own nameservers"
4. Add:
   - keira.ns.cloudflare.com
   - west.ns.cloudflare.com
5. Save
6. Wait 5-30 minutes for propagation

---

## 🔧 STEP 2: Enable Cloudflare R2 (File Storage)

1. Go to https://dash.cloudflare.com
2. Click your account → **R2**
3. Click **"Create Bucket"**
4. Name: `family-investments`
5. Location: Default (Automatic)
6. Click **Create**

---

## 🔧 STEP 3: Create R2 API Token

1. Go to https://dash.cloudflare.com → **Manage Account** → **API Tokens**
2. Click **Create Token**
3. Use template: **"R2 Token"**
4. Permissions:
   - Account: Cloudflare R2 Storage: Edit
   - Account: Account: Read
5. Account Resources: Include your account
6. Click **Continue** → **Create Token**
7. **COPY THE TOKEN NOW** (won't show again)

Save these values for later:
- **Account ID:** f823a3f5752d5b771fddf73ea67c3056
- **R2 Token:** (the one you just copied)

---

## 🔧 STEP 4: Deploy Frontend to Cloudflare Pages

### Option A: Using Wrangler CLI (Recommended)

```bash
cd /home/hinoki/HinokiDEV/Investments/web

# Create Pages project
npx wrangler pages project create investment-aramac --production-branch main

# Deploy the build
npm run build
npx wrangler pages deploy dist --project-name investment-aramac
```

### Option B: Git Integration (Auto-deploy)

1. Push repo to GitHub
2. Go to https://dash.cloudflare.com → **Pages**
3. Click **Create a project**
4. Connect your GitHub repo
5. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
   - Root directory: `web`
6. Click **Save and Deploy**

---

## 🔧 STEP 5: Add DNS Record for inv.aramac.dev

Once Pages is deployed, add this DNS record:

**Via Cloudflare Dashboard:**
1. Go to https://dash.cloudflare.com → **aramac.dev** → **DNS**
2. Click **Add record**
3. Type: **CNAME**
4. Name: **inv**
5. Content: **investment-aramac.pages.dev**
6. Proxy status: **DNS only** (gray cloud)
7. TTL: Auto
8. Save

**Or via API (once zone is active):**
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/9298f1336c76775292a865952289e871/dns_records" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "inv",
    "content": "investment-aramac.pages.dev",
    "proxied": false
  }'
```

---

## 🔧 STEP 6: Deploy Backend (Railway)

Since Railway is already configured:

1. Push code to GitHub
2. Go to https://railway.app/dashboard
3. Create new project from GitHub repo
4. Add PostgreSQL database
5. Add Redis
6. Deploy API service (Dockerfile: api/Dockerfile)
7. Deploy Worker service (Dockerfile: worker/Dockerfile)

**Environment variables for Railway:**
```env
ENVIRONMENT=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
STORAGE_ENDPOINT=https://f823a3f5752d5b771fddf73ea67c3056.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=your-r2-token-id
STORAGE_SECRET_KEY=your-r2-token-secret
STORAGE_BUCKET=family-investments
STORAGE_REGION=auto
JWT_SECRET=your-super-secret-key-min-32-chars
CORS_ORIGINS=https://inv.aramac.dev
KIMI_API_KEY=your-kimi-api-key
```

---

## 🔧 STEP 7: Add Backend DNS Record

Once Railway gives you a URL:

1. Go to Cloudflare DNS
2. Add CNAME record:
   - Name: **api.inv**
   - Content: **your-app.railway.app** (Railway URL)
   - Proxy status: DNS only

---

## 📋 SUMMARY CHECKLIST

- [ ] Change nameservers at GoDaddy to Cloudflare
- [ ] Enable R2 in Cloudflare dashboard
- [ ] Create R2 bucket "family-investments"
- [ ] Create R2 API token
- [ ] Deploy frontend to Cloudflare Pages
- [ ] Add DNS record inv.aramac.dev → Pages
- [ ] Deploy backend to Railway
- [ ] Add DNS record api.inv.aramac.dev → Railway
- [ ] Update frontend env var: VITE_API_URL=https://api.inv.aramac.dev

---

## 🌐 FINAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                   Cloudflare                            │
│  ┌─────────────────┐    ┌──────────────────────┐       │
│  │  inv.aramac.dev │    │  family-investments  │       │
│  │  (Pages)        │    │  (R2 Storage)        │       │
│  └────────┬────────┘    └──────────┬───────────┘       │
│           │                        │                   │
│  ┌────────▼────────┐              │                    │
│  │  api.inv.aramac │◄─────────────┘                    │
│  │  (Railway API)  │                                   │
│  └─────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🆘 NEED HELP?

Run into issues? Check logs:
```bash
# Wrangler logs
cat ~/.config/.wrangler/logs/wrangler-*.log | tail -50
```
