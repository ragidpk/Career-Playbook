# Career Playbook - Setup Guide

This guide walks you through setting up the Career Playbook application for local development and production deployment.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git installed

---

## 1. Supabase Project Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name: `career-playbook-production`
3. Set a strong database password (save it securely)
4. Choose a region (US East recommended for US users)
5. Wait 2-3 minutes for project to initialize

### Get Project Credentials

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

---

## 2. Configure Supabase Authentication

### ⚠️ CRITICAL: Set Redirect URLs

Go to **Authentication** → **URL Configuration** and add these URLs:

#### Local Development
```
http://localhost:5173/auth/callback
http://localhost:5173/auth/reset-password
```

#### Production (replace with your domain)
```
https://your-production-domain.com/auth/callback
https://your-production-domain.com/auth/reset-password
```

**Site URL:**
- Local: `http://localhost:5173`
- Production: `https://your-production-domain.com`

### Enable Email Provider

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Disable email confirmation if you want instant login (for testing)
   - ⚠️ For production, keep email confirmation enabled

### Customize Email Templates (Optional)

Go to **Authentication** → **Email Templates** to customize:
- Confirmation email
- Password reset email

Use these variables:
- `{{ .ConfirmationURL }}` - Email verification link
- `{{ .Token }}` - Verification token
- `{{ .SiteURL }}` - Your site URL

---

## 3. Run Database Migrations

### Install Supabase CLI

```bash
npm install -g supabase
```

### Link to Your Project

```bash
supabase login
cd career-playbook
supabase link --project-ref your-project-ref
```

**Find your project ref:**
- It's in your Project URL: `https://[project-ref].supabase.co`

### Run Migrations

```bash
supabase db push
```

This will create:
- 9 database tables (profiles, career_canvas, ninety_day_plans, etc.)
- Helper functions (update_updated_at, calculate_canvas_completion, handle_new_user)
- Row Level Security (RLS) policies
- Database triggers

### Verify Migrations

Go to **Table Editor** in Supabase dashboard and verify these tables exist:
- ✅ profiles
- ✅ career_canvas
- ✅ ninety_day_plans
- ✅ weekly_milestones
- ✅ resume_analyses
- ✅ companies
- ✅ ai_usage_tracking
- ✅ mentor_invitations
- ✅ mentor_access

---

## 4. Create Storage Bucket

### Create "resumes" Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Bucket name: `resumes`
4. **Public bucket:** ❌ NO (keep it private)
5. File size limit: `10 MB`
6. Allowed MIME types: `application/pdf`

### Verify Storage Policies

Go to **Storage** → **Policies** and verify these RLS policies exist:
- ✅ Users can upload own resumes
- ✅ Users can read own resumes
- ✅ Service role can read all resumes
- ✅ Users can delete own resumes

If they don't exist, run this SQL in **SQL Editor**:

```sql
-- See supabase/migrations/20250101000004_enable_rls_policies.sql
-- for the complete storage policies
```

---

## 5. Local Development Setup

### Clone Repository

```bash
git clone <your-repo-url>
cd career-playbook
```

### Install Dependencies

```bash
npm install
```

### Create Environment File

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI (for resume analysis - get from openai.com)
VITE_OPENAI_API_KEY=sk-...

# Resend (for emails - get from resend.com)
VITE_RESEND_API_KEY=re_...

# App
VITE_APP_URL=http://localhost:5173
VITE_APP_ENV=development
```

### Start Dev Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Testing Authentication

### Test Signup Flow

1. Go to `/signup`
2. Enter name, email, password
3. Click "Create account"
4. You should see "Check your email" message
5. Check your email inbox for verification link
6. Click the link → should redirect to `/auth/callback` → then `/dashboard`

### Test Login Flow

1. Go to `/login`
2. Enter email and password
3. Click "Sign in"
4. Should redirect to `/dashboard`

### Test Password Reset Flow

1. Go to `/login`
2. Click "Forgot your password?"
3. Enter email
4. Click "Send Reset Link"
5. Check your email for reset link
6. Click the link → should redirect to `/auth/reset-password`
7. Enter new password (8+ chars, uppercase, lowercase, number)
8. Confirm password
9. Click "Reset Password"
10. Should show success toast and redirect to `/login`

---

## 7. Deploy to Production

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables (same as `.env.local` but update `VITE_APP_URL`)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_OPENAI_API_KEY=sk-...
VITE_RESEND_API_KEY=re_...
VITE_APP_URL=https://your-production-domain.vercel.app
VITE_APP_ENV=production
```

6. Click "Deploy"
7. Wait for deployment to complete
8. Copy your production URL

### Update Supabase Redirect URLs

⚠️ **CRITICAL:** Go back to Supabase → **Authentication** → **URL Configuration**

Add your production URLs:

```
https://your-production-domain.vercel.app/auth/callback
https://your-production-domain.vercel.app/auth/reset-password
```

Update Site URL to:
```
https://your-production-domain.vercel.app
```

### Deploy Edge Functions

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy analyze-resume
supabase functions deploy send-invitation
supabase functions deploy accept-invitation

# Set secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set APP_URL=https://your-production-domain.vercel.app
```

---

## 8. Troubleshooting

### Email verification link redirects to 404

**Solution:** Check that `/auth/callback` and `/auth/reset-password` are added to:
- Supabase → Authentication → URL Configuration → Redirect URLs

### "Invalid redirect URL" error

**Solution:** Ensure your Site URL in Supabase matches `VITE_APP_URL` in your environment variables.

### User not created after signup

**Solution:** Check that the `handle_new_user()` trigger exists:

```sql
-- Run in SQL Editor
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

If it doesn't exist, re-run migration: `supabase db push`

### Storage upload fails

**Solution:** Verify the `resumes` bucket exists and has the correct RLS policies:
- Go to Storage → Policies
- Should see policies for INSERT, SELECT, DELETE on `storage.objects`

### Build errors

**Solution:** Ensure all dependencies are installed:

```bash
npm install
npm run build
```

---

## Next Steps

After setup is complete:

1. ✅ Authentication works (signup, login, reset password)
2. ✅ Database migrations applied
3. ✅ Storage bucket configured
4. ✅ Redirect URLs set for local and production

Now ready to implement features:
- Career Canvas (9-section form)
- 90-Day Plan (milestone tracker)
- Resume Analysis (AI-powered)
- CRM (company tracking)
- Mentor Collaboration

---

## Support

For issues or questions:
- Check [Supabase Docs](https://supabase.com/docs)
- Check [Vite Docs](https://vitejs.dev)
- Open an issue in the repository
