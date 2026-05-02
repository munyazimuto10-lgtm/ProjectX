# PayrollPro Deployment Guide

## Overview

This guide covers deploying PayrollPro as a cloud-based payroll management system. The recommended architecture uses:

- **Frontend Hosting:** Vercel or Netlify
- **Backend API:** Node.js/Express on Railway, Render, or AWS
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Supabase Storage or AWS S3
- **Authentication:** Supabase Auth

## Recommended Cloud Architecture

### Option 1: Supabase + Vercel (Recommended for Quick Start)

**Pros:**
- Quick setup with minimal configuration
- Integrated authentication and database
- Generous free tier
- Real-time capabilities built-in
- Automatic API generation

**Stack:**
- **Frontend:** Vercel
- **Backend:** Supabase (PostgreSQL + REST API + Auth)
- **Storage:** Supabase Storage

### Option 2: Full Custom Stack

**Pros:**
- More control and customization
- Can use any backend framework
- Flexible database options

**Stack:**
- **Frontend:** Vercel/Netlify
- **Backend:** Railway/Render (Node.js/Express)
- **Database:** Supabase or Amazon RDS
- **Storage:** AWS S3 or Cloudinary
- **Authentication:** Auth0 or custom JWT

## Deployment Steps

### Phase 1: Database Setup (Supabase)

#### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project**
3. Create a new organization and project
4. Note your project credentials:
   - Project URL
   - API Keys (anon key and service_role key)
   - Database password

#### 2. Set Up Database Schema

See `DATABASE_SCHEMA.md` for the complete schema. Execute the following in Supabase SQL Editor:

```sql
-- See DATABASE_SCHEMA.md for full schema
```

#### 3. Configure Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
-- ... (see DATABASE_SCHEMA.md for complete RLS policies)
```

#### 4. Set Up Storage Buckets

Create storage buckets for:
- `payslips` - PDF payslip documents
- `tax-forms` - W-2, 1099 forms
- `avatars` - User profile pictures

```sql
-- In Supabase Storage dashboard
insert into storage.buckets (id, name, public)
values
  ('payslips',   'payslips',   false),
  ('tax_forms', 'tax_forms', false),
  ('avatars',    'avatars',    true);
  ```

### Phase 2: Backend Setup (Optional if using Supabase directly)

If you need custom business logic beyond Supabase's capabilities:

#### 1. Create Backend Repository

```bash
mkdir payrollpro-backend
cd payrollpro-backend
npm init -y
npm install express cors dotenv @supabase/supabase-js
npm install -D typescript @types/node @types/express ts-node nodemon
```

#### 2. Create Express Server

```typescript
// src/server.ts
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.post('/api/payroll/process', async (req, res) => {
  // Payroll processing logic
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 3. Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Click **New Project**
3. Connect your GitHub repository
4. Add environment variables:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_KEY=your_service_key
   NODE_ENV=production
   ```
5. Deploy

### Phase 3: Frontend Deployment (Vercel)

#### 1. Prepare Frontend for Production

Create `.env.production` in your project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://your-backend.railway.app
```

#### 2. Update Frontend Code to Use Supabase

Install Supabase client:

```bash
pnpm add @supabase/supabase-js
```

Create Supabase client configuration:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 3. Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Option B: Using Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your Git repository
4. Configure build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist`
5. Add environment variables from `.env.production`
6. Click **Deploy**

Your app will be available at `https://your-project.vercel.app`

### Phase 4: Configure Custom Domain (Optional)

#### Vercel Custom Domain

1. Go to your project settings on Vercel
2. Navigate to **Domains**
3. Add your custom domain (e.g., `payroll.yourcompany.com`)
4. Update DNS records as instructed
5. Vercel will automatically provision SSL certificate

## Environment Variables Setup

### Frontend (.env.production)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Backend API (if using custom backend)
VITE_API_URL=https://api.yourcompany.com

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Optional: Sentry (Error Tracking)
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Database
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres

# JWT Secret (if using custom auth)
JWT_SECRET=your_super_secret_key

# SMTP (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# File Storage (if using S3)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=payrollpro-files
AWS_REGION=us-east-1

# Node Environment
NODE_ENV=production
PORT=3000
```

## Post-Deployment Configuration

### 1. Set Up Authentication

Configure Supabase Auth:

```typescript
// Update Authentication.tsx to use Supabase Auth
import { supabase } from '../lib/supabase';

const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login error:', error);
    return;
  }

  // Get user role from database
  const { data: userData } = await supabase
    .from('employees')
    .select('role')
    .eq('email', email)
    .single();

  onAuthenticated(userData.role);
};
```

### 2. Configure Email Notifications

Set up email templates in Supabase:
- Password reset emails
- Payslip availability notifications
- Payment confirmations

### 3. Set Up Scheduled Jobs

For recurring tasks like payroll processing:

**Option A: Supabase Edge Functions**

```typescript
// supabase/functions/process-monthly-payroll/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Process payroll logic here

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Schedule with cron:
```bash
supabase functions schedule process-monthly-payroll --cron "0 0 1 * *"
```

**Option B: GitHub Actions**

```yaml
# .github/workflows/monthly-payroll.yml
name: Monthly Payroll Processing

on:
  schedule:
    - cron: '0 0 1 * *'  # Run on 1st of every month at midnight
  workflow_dispatch:  # Allow manual trigger

jobs:
  process-payroll:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger payroll processing
        run: |
          curl -X POST https://your-api.com/api/payroll/process \
            -H "Authorization: Bearer ${{ secrets.API_TOKEN }}"
```

## Monitoring and Maintenance

### 1. Set Up Error Tracking

```bash
pnpm add @sentry/react @sentry/vite-plugin
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 2. Set Up Analytics

```typescript
// src/lib/analytics.ts
import ReactGA from 'react-ga4';

ReactGA.initialize(import.meta.env.VITE_GOOGLE_ANALYTICS_ID);

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

export const trackEvent = (category: string, action: string) => {
  ReactGA.event({ category, action });
};
```

### 3. Database Backups

Supabase automatically backs up your database daily. To enable point-in-time recovery:

1. Go to Supabase Dashboard
2. Navigate to **Settings → Database**
3. Enable **Point-in-time Recovery** (Pro plan required)

### 4. Performance Monitoring

Monitor using Vercel Analytics:
- Real User Monitoring (RUM)
- Web Vitals
- Edge Function performance

## Security Checklist

- [ ] Environment variables secured (not committed to Git)
- [ ] Row Level Security (RLS) enabled on all Supabase tables
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] SSL/TLS certificates active
- [ ] Regular security updates (Dependabot)
- [ ] Two-factor authentication enabled for admin accounts
- [ ] Audit logging enabled
- [ ] Regular database backups verified
- [ ] Secrets rotation schedule established

## Cost Estimation

### Monthly Costs (Approximate)

**Free Tier (Suitable for Testing):**
- Vercel: Free (Hobby plan)
- Supabase: Free (2 projects, 500MB database, 1GB storage)
- **Total: $0/month**

**Small Business (< 50 employees):**
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- **Total: $45/month**

**Medium Business (< 500 employees):**
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Railway (if using custom backend): $5-20/month
- AWS S3 (storage): $10-50/month
- **Total: $60-115/month**

**Enterprise (> 500 employees):**
- Custom pricing based on usage
- Consider dedicated infrastructure

## Rollback Strategy

In case of issues after deployment:

1. **Instant Rollback on Vercel:**
   ```bash
   vercel rollback
   ```

2. **Database Rollback:**
   - Use Supabase's point-in-time recovery
   - Or restore from manual backup

3. **Gradual Rollout:**
   - Use Vercel's preview deployments
   - Test with subset of users before full deployment

## Support and Maintenance

- **Uptime Monitoring:** Use UptimeRobot or Pingdom
- **Status Page:** Create with StatusPage.io
- **Support Tickets:** Implement with Zendesk or Intercom
- **Documentation:** Keep updated in repo README and wiki

## Next Steps After Deployment

1. **User Acceptance Testing (UAT):** Test with real users
2. **Performance Optimization:** Monitor and optimize slow queries
3. **Feature Rollout:** Gradually enable new features
4. **Training:** Provide user documentation and training
5. **Compliance:** Ensure GDPR, SOC 2, or other relevant compliance
