# NHB Consultancy — Deployment Guide
## Supabase + Netlify + Anthropic

---

## STEP 1 — Set Up Supabase

1. Go to https://supabase.com and sign in
2. Click **New Project** → name it `nhb-consultancy`
3. Once created, go to **SQL Editor** → **New Query**
4. Paste the entire contents of `supabase-schema.sql` and click **Run**
5. Go to **Settings → API** and copy:
   - **Project URL** → looks like `https://xxxx.supabase.co`
   - **anon public key** → long JWT string

---

## STEP 2 — Push to GitHub

1. Create a new repository on https://github.com (name: `nhb-consultancy`)
2. In your terminal, from this project folder:

```bash
git init
git add .
git commit -m "Initial commit — NHB Consultancy website"
git remote add origin https://github.com/YOUR_USERNAME/nhb-consultancy.git
git push -u origin main
```

---

## STEP 3 — Deploy on Netlify

1. Go to https://netlify.com and sign in
2. Click **Add new site → Import an existing project**
3. Connect to **GitHub** and select your `nhb-consultancy` repo
4. Build settings (should auto-detect from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy site**

---

## STEP 4 — Add Environment Variables in Netlify

Go to: **Site Settings → Environment Variables → Add variable**

Add these three:

| Key | Value | Where to get it |
|-----|-------|-----------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | https://console.anthropic.com → API Keys |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API |

6. After adding variables, go to **Deploys → Trigger deploy** to rebuild with the new env vars.

---

## STEP 5 — Add Your Custom Domain (Optional)

1. In Netlify: **Domain management → Add custom domain**
2. Add `nhb-consultancy.com` (or whatever you own)
3. Follow the DNS instructions to point your domain to Netlify
4. Netlify auto-provisions a free SSL certificate

---

## STEP 6 — Local Development

To run the site locally with live-reload:

```bash
npm install
npm run dev
```

For AI functions to work locally, install the Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev
```

This runs both the Vite dev server and the Netlify Functions together.
Create a `.env` file (copy from `.env.example`) and add your real keys.

---

## Managing Your Data in Supabase

After launch, view all submissions in Supabase:

- **contacts** → all enquiries from the Contact form
- **applications** → all job applications and CV registrations
- **health_checks** → HR Health Check results (with optional email)
- **jobs** → your live job listings (edit these to update the Careers page)

To add or edit a job listing:
1. Go to Supabase → **Table Editor** → `jobs`
2. Click **Insert row** and fill in: title, location, sector, type
3. Set `active = true` to make it live
4. The Careers page will show it automatically

---

## Architecture Summary

```
Browser
  │
  ├── Static files served from Netlify CDN
  │
  ├── Contact / Application forms
  │     └── POST to Supabase (anon key, RLS protected)
  │
  └── AI Chatbot / HR Health Check
        └── POST to /.netlify/functions/claude
              └── Server-side call to Anthropic API
                    (API key never exposed to browser)
```

---

## Checklist Before Going Live

- [ ] Supabase schema created (all 4 tables)
- [ ] Pushed to GitHub
- [ ] Netlify site deployed
- [ ] All 3 environment variables set in Netlify
- [ ] Triggered a fresh deploy after adding env vars
- [ ] Tested contact form (check Supabase → contacts table)
- [ ] Tested AI chatbot (should respond via Netlify function)
- [ ] Tested HR Health Check (check Supabase → health_checks)
- [ ] Custom domain added (optional but recommended)

---

Questions? Email admin@nhb-consultancy.com
