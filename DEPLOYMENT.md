# Career Playbook - Deployment Guide

Complete step-by-step guide to deploy the Career Playbook application to production.

---

## Prerequisites

Before starting deployment, ensure you have:

- [ ] GitHub account with repository created
- [ ] Supabase account ([supabase.com](https://supabase.com))
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] OpenAI API key ([platform.openai.com](https://platform.openai.com))
- [ ] Resend API key ([resend.com](https://resend.com))
- [ ] Domain name (optional, Vercel provides free subdomain)

---

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - **Name:** `career-playbook-production`
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users (e.g., US East)
   - **Pricing Plan:** Free tier (sufficient for MVP)
4. Wait 2-3 minutes for project to provision

### 1.2 Get Project Credentials

Once project is ready:

1. Go to **Settings** &rarr; **API**
2. Copy these values (you'll need them later):
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   Project Ref: xxxxxxxxxxxxx
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**IMPORTANT:** Keep `service_role` key secret - never commit to Git!

### 1.3 Install Supabase CLI

```bash
# Install globally
npm install -g supabase

# Verify installation
supabase --version
```

### 1.4 Link Project

```bash
# Login to Supabase
supabase login

# Link to your project
cd career-playbook
supabase link --project-ref xxxxxxxxxxxxx

# Enter database password when prompted
```

### 1.5 Run Database Migrations

**CAUTION:** `supabase db push` applies all pending migrations to the linked production project. Test migrations locally or in a staging environment first before running this command on production.

```bash
# Push all migrations to production
supabase db push

# Verify tables were created
supabase db list
```

**Expected output:**
```
- Migration 20250101000001_create_helper_functions.sql applied
- Migration 20250101000002_create_core_tables.sql applied
- Migration 20250101000003_create_relationship_tables.sql applied
- Migration 20250101000004_enable_rls_policies.sql applied
```

### 1.6 Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click "Create bucket"
3. Settings:
   - **Name:** `resumes`
   - **Public bucket:** OFF (private)
   - **File size limit:** 10MB
   - **Allowed MIME types:** `application/pdf`
4. Click "Create bucket"

### 1.7 Configure Authentication

1. Go to **Authentication** &rarr; **URL Configuration**
2. Add these Site URLs:
   ```
   http://localhost:5173
   https://your-domain.vercel.app
   https://your-custom-domain.com (if applicable)
   ```
3. Add Redirect URLs:
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/auth/reset-password
   https://your-domain.vercel.app/auth/callback
   https://your-domain.vercel.app/auth/reset-password
   https://your-custom-domain.com/auth/callback (if applicable)
   https://your-custom-domain.com/auth/reset-password (if applicable)
   ```

4. Go to **Authentication** &rarr; **Email Templates**
5. Customize templates (optional):
   - **Confirm signup:** Welcome email with verification link
   - **Reset password:** Password reset instructions
   - **Magic Link:** (not used in this app)

### 1.8 Deploy Edge Functions

**NOTE:** The Edge Functions must be created first before deployment. The function files should be located at:
- `supabase/functions/analyze-resume/index.ts`
- `supabase/functions/send-invitation/index.ts`
- `supabase/functions/accept-invitation/index.ts`

If these files don't exist yet, refer to the implementation plan to create them before proceeding.

```bash
# Deploy analyze-resume function (once implemented)
supabase functions deploy analyze-resume

# Deploy send-invitation function (once implemented)
supabase functions deploy send-invitation

# Deploy accept-invitation function (once implemented)
supabase functions deploy accept-invitation
```

**Expected output:**
```
- Deployed Function analyze-resume
- Deployed Function send-invitation
- Deployed Function accept-invitation
```

### 1.9 Set Edge Function Secrets

```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Set Resend API key
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Set production app URL (will update after Vercel deployment)
supabase secrets set APP_URL=https://your-domain.vercel.app

# Set Supabase credentials (for Edge Functions)
supabase secrets set SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Verify secrets (shows names only, not values)
supabase secrets list
```

**CRITICAL:** Never commit these secrets to Git!

### 1.10 Verify Edge Functions

Test Edge Functions locally before production:

```bash
# Start local Supabase
supabase start

# Test analyze-resume
curl -X POST http://localhost:54321/functions/v1/analyze-resume \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"fileUrl": "https://example.com/resume.pdf", "fileName": "test.pdf"}'

# Test send-invitation
curl -X POST http://localhost:54321/functions/v1/send-invitation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"mentorEmail": "mentor@example.com", "personalMessage": "Please be my mentor"}'
```

---

## Part 2: Vercel Deployment

### 2.1 Push Code to GitHub

```bash
# Initialize Git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Phase 1 MVP complete - ready for deployment"

# Create GitHub repository
# Go to github.com/new and create "career-playbook" repo

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/career-playbook.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2.2 Connect Vercel to GitHub

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." &rarr; "Project"
3. Import from GitHub:
   - Click "Import" next to `career-playbook` repository
   - If repository not listed, click "Adjust GitHub App Permissions"
4. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 2.3 Set Environment Variables

In Vercel project settings, add these environment variables:

| Name | Value | Notes |
|------|-------|-------|
| `VITE_SUPABASE_URL` | `https://xxxxxxxxxxxxx.supabase.co` | From Supabase API settings |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | From Supabase API settings (anon key) |
| `VITE_APP_URL` | `https://your-project.vercel.app` | Your Vercel deployment URL |
| `VITE_APP_ENV` | `production` | Enables production mode |

**IMPORTANT:**
- Do NOT add `VITE_OPENAI_API_KEY` or `VITE_RESEND_API_KEY` to Vercel - these are only used in Edge Functions (already set in Supabase)
- Environment variables starting with `VITE_` are exposed to the browser - never put secrets here!

### 2.4 Deploy

1. Click "Deploy" in Vercel dashboard
2. Wait 2-3 minutes for build to complete
3. Vercel will provide a deployment URL: `https://career-playbook-xxxxx.vercel.app`

**Expected build output:**
```
- Building for production
- 3,103 modules transformed in 8.72s
- dist/index.html generated
- Deployment ready
```

### 2.5 Update Supabase APP_URL Secret

Now that you have the Vercel URL, update the Edge Function secret:

```bash
# Update APP_URL with actual Vercel URL
supabase secrets set APP_URL=https://career-playbook-xxxxx.vercel.app
```

### 2.6 Add Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** &rarr; **Domains**
2. Click "Add Domain"
3. Enter your custom domain: `careerplaybook.com`
4. Follow Vercel's instructions to update DNS records:
   - **Type:** A
   - **Name:** `@`
   - **Value:** `76.76.21.21`
   - **Type:** CNAME
   - **Name:** `www`
   - **Value:** `cname.vercel-dns.com`
5. Wait for DNS propagation (5-60 minutes)
6. Vercel automatically provisions SSL certificate

**IMPORTANT:** After adding a custom domain, update the APP_URL in Supabase Edge Function secrets to use your custom domain:

```bash
# Update APP_URL with custom domain
supabase secrets set APP_URL=https://careerplaybook.com
```

### 2.7 Update Supabase Redirect URLs

After deploying, update Supabase Auth configuration:

1. Go to Supabase dashboard &rarr; **Authentication** &rarr; **URL Configuration**
2. Update Site URLs:
   ```
   https://career-playbook-xxxxx.vercel.app
   https://careerplaybook.com (if custom domain)
   ```
3. Update Redirect URLs:
   ```
   https://career-playbook-xxxxx.vercel.app/auth/callback
   https://career-playbook-xxxxx.vercel.app/auth/reset-password
   https://careerplaybook.com/auth/callback (if custom domain)
   https://careerplaybook.com/auth/reset-password (if custom domain)
   ```

---

## Part 3: API Key Setup

### 3.1 OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Name: `Career Playbook Production`
4. Copy key (starts with `sk-proj-`)
5. Already set in Supabase secrets (Step 1.9)

**Pricing:**
- Model: GPT-4o-mini
- Cost: ~$0.075 per resume analysis
- Monthly budget: $30 (400 analyses)

### 3.2 Resend API Key

1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name: `Career Playbook Production`
4. Permission: Full Access
5. Copy key (starts with `re_`)
6. Already set in Supabase secrets (Step 1.9)

**Setup Email Domain (Optional but Recommended):**

1. In Resend dashboard, go to **Domains**
2. Click "Add Domain"
3. Enter domain: `careerplaybook.com`
4. Add DNS records:
   ```
   Type: TXT
   Name: @
   Value: resend._domainkey.careerplaybook.com

   Type: MX
   Name: @
   Value: feedback-smtp.us-east-1.amazonses.com (priority 10)
   ```
5. Wait for verification (5-30 minutes)
6. Emails will now come from `noreply@careerplaybook.com` instead of `onboarding@resend.dev`

---

## Part 4: Production Testing

### 4.1 Test Authentication Flow

1. **Signup:**
   - Go to `https://your-domain.vercel.app/signup`
   - Create account with valid email
   - Verify "Check your email" message appears
   - Check inbox for verification email
   - Click verification link
   - Should redirect to `/dashboard`

2. **Login:**
   - Go to `/login`
   - Enter credentials
   - Should redirect to `/dashboard`

3. **Password Reset:**
   - Go to `/forgot-password`
   - Enter email
   - Check inbox for reset email
   - Click reset link
   - Should redirect to `/auth/reset-password`
   - Enter new password
   - Should redirect to `/login`

### 4.2 Test Career Canvas

1. Navigate to `/canvas`
2. Fill in 9 sections (each max 500 characters)
3. Verify auto-save indicator appears ("Saving..." then "Saved")
4. Refresh page - data should persist
5. Check progress bar updates to 100%

### 4.3 Test 90-Day Plan

1. Navigate to `/plan`
2. Click "Create New Plan"
3. Fill in title and dates
4. Verify 12 weekly milestones are created
5. Edit a milestone goal (max 200 characters)
6. Change milestone status
7. Drag-and-drop to reorder (desktop only)
8. Verify order persists after refresh

### 4.4 Test Resume Analysis

1. Navigate to `/resume`
2. Verify quota display: "2 / 2 analyses remaining this month"
3. Upload a PDF resume (max 10MB)
4. Wait ~30-45 seconds for analysis
5. Verify results:
   - ATS score (0-100) displayed with color coding
   - Strengths, Gaps, Recommendations tabs populated
6. Upload another resume
7. Verify quota updates: "1 / 2 analyses remaining"
8. Check history sidebar shows both analyses
9. Try uploading a third resume
10. Verify error: "Limit reached. Resets on [date]"

### 4.5 Test CRM

1. Navigate to `/crm`
2. Click "Add Company"
3. Fill in company details
4. Select status (Researching, Applied, etc.)
5. Verify company appears in list
6. Test search by name
7. Test filter by status
8. Test sort by name/date
9. Edit company details
10. Delete company (with confirmation)

### 4.6 Test Mentor Collaboration

**As Job Seeker:**

1. Navigate to `/mentors`
2. Click "Invite Mentor"
3. Enter mentor email and message
4. Verify invitation sent (check mentor's inbox)
5. Verify invitation appears in list with "pending" status

**As Mentor:**

1. Open invitation email (sent to mentor email)
2. Click "Accept Invitation" link
3. Should redirect to `/accept-invitation?token=xxx`
4. If not signed up, should prompt to create account
5. If signed in with different email, should show error
6. After acceptance, should redirect to `/mentor-view`
7. Verify mentee appears in dropdown
8. Select mentee
9. Navigate to Canvas and Plan pages
10. Verify "Read-only" banner appears
11. Verify cannot edit mentee's data

**As Job Seeker (verify mentor access):**

1. Go to `/mentors`
2. Verify mentor status changed to "accepted"
3. Click "Revoke Access"
4. Confirm revocation
5. Mentor should no longer have access

### 4.7 Mobile Responsiveness

Test on:
- iPhone (Safari): Verify layout adapts, drag-drop disabled
- Android (Chrome): Verify touch targets are 44x44px min
- iPad (Safari): Verify tablet layout works

### 4.8 Browser Compatibility

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Part 5: Monitoring & Maintenance

### 5.1 Vercel Analytics

1. In Vercel dashboard, go to **Analytics**
2. Enable Web Analytics (free tier)
3. Monitor:
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics (FCP, LCP, CLS)

### 5.2 Supabase Usage Monitoring

1. In Supabase dashboard, go to **Settings** &rarr; **Usage**
2. Monitor:
   - Database size (free tier: 500MB)
   - Auth users (free tier: unlimited)
   - Storage (free tier: 1GB)
   - Edge Function invocations (free tier: 500K/month)
   - Bandwidth (free tier: 5GB)

**Set up alerts:**
- Database > 400MB: Consider upgrading
- Storage > 800MB: Clean up old resumes
- Edge Functions > 400K: Approaching limit

### 5.3 OpenAI Cost Monitoring

1. Go to [platform.openai.com/usage](https://platform.openai.com/usage)
2. Monitor monthly costs
3. Expected: 200 users × 2 analyses = 400 requests/month × $0.075 = $30/month
4. Set budget alert at $25 to avoid overages

### 5.4 Database Backups

Supabase automatically backs up your database daily (free tier: 7 days retention).

**Manual backup (recommended before major updates):**

```bash
# Export entire database
supabase db dump -f backup-$(date +%Y%m%d).sql

# Export specific table
supabase db dump --table profiles -f profiles-backup.sql
```

### 5.5 Error Monitoring (Optional)

Set up Sentry for error tracking:

```bash
# Install Sentry
npm install @sentry/react

# Add to main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx",
  environment: import.meta.env.VITE_APP_ENV,
});
```

Add `VITE_SENTRY_DSN` to Vercel environment variables.

---

## Part 6: Troubleshooting

### Issue: Email verification link doesn't work

**Symptoms:** Clicking verification link shows error or doesn't redirect

**Fix:**
1. Check Supabase Auth URL Configuration
2. Verify redirect URLs include `/auth/callback`
3. Check that `VITE_APP_URL` in Vercel matches deployment URL
4. Test with different email provider (Gmail, Outlook)

### Issue: Resume analysis fails

**Symptoms:** Upload succeeds but analysis returns error

**Fix:**
1. Check Edge Function logs:
   ```bash
   supabase functions logs analyze-resume
   ```
2. Verify OpenAI API key is valid
3. Verify Supabase service role key is set
4. Test PDF locally - some PDFs may not extract text properly
5. Check storage bucket permissions (RLS policies)

### Issue: Mentor invitation email not received

**Symptoms:** Invitation created but email never arrives

**Fix:**
1. Check Resend dashboard for delivery status
2. Verify Resend API key is valid
3. Check spam folder
4. If using custom domain, verify DNS records are correct
5. Test with different email provider

### Issue: "Rate limit exceeded" error

**Symptoms:** User gets error when uploading resume despite quota remaining

**Fix:**
1. Check `ai_usage_tracking` table in Supabase
2. Verify current month format: `YYYY-MM` (e.g., `2025-01`)
3. Check Edge Function logic for month comparison
4. Test incrementing usage manually:
   ```sql
   SELECT * FROM ai_usage_tracking
   WHERE user_id = 'xxx'
   AND feature_type = 'resume_analysis';
   ```

### Issue: RLS policy prevents read/write

**Symptoms:** User can't access their own data or mentor can't view mentee data

**Fix:**
1. Verify RLS policies are enabled:
   ```bash
   supabase db inspect
   ```
2. Test policies manually:
   ```sql
   -- Should return user's own data
   SELECT * FROM career_canvas WHERE user_id = auth.uid();

   -- Should return mentee data for mentors
   SELECT * FROM career_canvas
   WHERE user_id IN (
     SELECT job_seeker_id FROM mentor_access
     WHERE mentor_id = auth.uid()
   );
   ```
3. Check user's auth.uid() matches expected ID

### Issue: Build fails on Vercel

**Symptoms:** Deployment fails with TypeScript errors

**Fix:**
1. Test build locally:
   ```bash
   npm run build
   ```
2. Fix any TypeScript errors
3. Verify all environment variables are set in Vercel
4. Check build logs in Vercel dashboard
5. Ensure `vite.config.ts` is correct

---

## Part 7: Scaling Considerations

When you exceed free tier limits:

### Supabase Pro ($25/month)
- Needed when: Database > 500MB or >50,000 monthly active users
- Includes:
  - 8GB database
  - 100GB bandwidth
  - 7 days backups &rarr; 30 days
  - Email support

### Vercel Pro ($20/month)
- Needed when: >100GB bandwidth or >1,000 builds/month
- Includes:
  - Unlimited bandwidth
  - Advanced analytics
  - Password protection
  - Team collaboration

### OpenAI Tier Upgrades
- Free tier: $100 credit (expires after 3 months)
- Tier 1: $5+ usage, 500 RPM (requests per minute)
- Tier 2: $50+ usage, 5,000 RPM
- Monitor usage at [platform.openai.com/usage](https://platform.openai.com/usage)

---

## Part 8: Security Checklist

Before going live:

- [ ] All environment variables set in Vercel (no secrets in code)
- [ ] Supabase RLS policies enabled on all tables
- [ ] Storage bucket is private with user-folder isolation
- [ ] Edge Functions use service role key (not anon key)
- [ ] Rate limiting enforced for AI features
- [ ] CORS configured correctly (only allow your domain)
- [ ] Email verification required for signup
- [ ] Password requirements enforced (min 8 chars, uppercase, number)
- [ ] SQL injection prevention (Supabase client uses parameterized queries)
- [ ] XSS prevention (React escapes by default)
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] CSP headers configured (optional but recommended)

---

## Part 9: Post-Launch Checklist

After deployment:

- [ ] Test all features in production (use checklist in Part 4)
- [ ] Monitor error logs for first 24 hours
- [ ] Check OpenAI usage after first 10 users
- [ ] Verify email deliverability with multiple providers
- [ ] Test mobile experience on real devices
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Create user documentation/FAQ
- [ ] Prepare support email address
- [ ] Monitor Supabase usage dashboard
- [ ] Set budget alerts on OpenAI

---

## Part 10: Rollback Plan

If critical issues occur in production:

### Immediate Rollback (Vercel)

1. Go to Vercel dashboard &rarr; **Deployments**
2. Find previous working deployment
3. Click "..." &rarr; "Promote to Production"
4. Previous version restored in <1 minute

### Database Rollback (Supabase)

**Caution:** This will lose user data created after backup!

```bash
# Restore from backup
supabase db reset

# Or restore specific backup
supabase db restore backup-20250108.sql
```

### Edge Function Rollback

```bash
# List function versions
supabase functions list

# Rollback to previous version
supabase functions deploy analyze-resume --version 1
```

---

## Part 11: Support Contacts

**Supabase Support:**
- Docs: [supabase.com/docs](https://supabase.com/docs)
- Discord: [discord.supabase.com](https://discord.supabase.com)
- Email: support@supabase.io (Pro plan only)

**Vercel Support:**
- Docs: [vercel.com/docs](https://vercel.com/docs)
- Discord: [vercel.com/discord](https://vercel.com/discord)
- Email: support@vercel.com (Pro plan only)

**OpenAI Support:**
- Docs: [platform.openai.com/docs](https://platform.openai.com/docs)
- Forum: [community.openai.com](https://community.openai.com)
- Email: support@openai.com

**Resend Support:**
- Docs: [resend.com/docs](https://resend.com/docs)
- Email: support@resend.com

---

## Summary

**Total deployment time:** 2-3 hours (first time)

**Key milestones:**
1. ✅ Supabase project setup (30 min)
2. ✅ Database migrations and storage (15 min)
3. ✅ Edge Functions deployment (15 min)
4. ✅ Vercel deployment (20 min)
5. ✅ API keys configuration (10 min)
6. ✅ Production testing (60 min)
7. ✅ Monitoring setup (15 min)

**Next Steps:**
- [ ] Follow this guide step-by-step
- [ ] Complete production testing checklist
- [ ] Monitor usage for first week
- [ ] Gather user feedback
- [ ] Plan Phase 2 features (LinkedIn analysis, AI milestone generation, etc.)

---

**Questions or issues?** Refer to Part 6 (Troubleshooting) or contact support channels listed in Part 11.
