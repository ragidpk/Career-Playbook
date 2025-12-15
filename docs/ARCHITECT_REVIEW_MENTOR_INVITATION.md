# Chief Architect Review: Mentor Invitation System Issue

## Executive Summary
The mentor invitation feature on the `/mentors` page is failing with a generic error: "Edge Function returned a non-2xx status code". This report documents the current implementation, potential root causes, and requests architectural guidance.

---

## Current Architecture

### Flow Diagram
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌────────────┐
│  Frontend   │────▶│  mentor.service  │────▶│  Edge Function  │────▶│  Supabase  │
│ InviteMentor│     │  inviteMentor()  │     │ send-invitation │     │  Database  │
└─────────────┘     └──────────────────┘     └─────────────────┘     └────────────┘
                                                      │
                                                      ▼
                                               ┌────────────┐
                                               │  Resend    │
                                               │  Email API │
                                               └────────────┘
```

### Components Involved

| Component | Location | Purpose |
|-----------|----------|---------|
| InviteMentor.tsx | `src/components/mentor/InviteMentor.tsx` | UI modal for invitation form |
| mentor.service.ts | `src/services/mentor.service.ts` | Service layer calling edge function |
| send-invitation | `supabase/functions/send-invitation/index.ts` | Edge function handling invite logic |
| mentor_invitations | Database table | Stores invitation records |

---

## Code Analysis

### 1. Frontend Component (`InviteMentor.tsx`)
```typescript
// Lines 36-52
try {
  await inviteMentor(mentorEmail, personalMessage || undefined);
  // Success handling...
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to send invitation');
}
```
**Status**: ✅ Correct error handling

### 2. Service Layer (`mentor.service.ts`)
```typescript
// Lines 39-55
export async function inviteMentor(mentorEmail: string, personalMessage?: string) {
  const { data, error } = await supabase.functions.invoke('send-invitation', {
    body: { mentorEmail, personalMessage },
  });

  if (error) {
    if (data?.error) {
      throw new Error(data.error);
    }
    throw error;  // <-- Returns generic FunctionsHttpError
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data;
}
```
**Issue**: ⚠️ When edge function returns non-2xx, Supabase JS client throws `FunctionsHttpError` with generic message. The `data` is null when error occurs, so `data?.error` never executes.

### 3. Edge Function (`send-invitation/index.ts`)
```typescript
// Key operations:
// 1. Authenticate user (lines 39-47)
// 2. Get user profile (lines 57-65)
// 3. Insert into mentor_invitations table (lines 68-84)
// 4. Send email via Resend (lines 114-133)

// Error response format (lines 147-157):
return new Response(
  JSON.stringify({
    error: error instanceof Error ? error.message : 'Internal server error',
  }),
  {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 400,  // <-- Non-2xx triggers generic error in client
  }
);
```

### 4. Database Schema (`20250101000003_create_relationship_tables.sql`)
```sql
CREATE TABLE mentor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_seeker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_email TEXT NOT NULL,
  mentor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT unique_invitation UNIQUE (job_seeker_id, mentor_email)
);
```

### 5. RLS Policies (`20250101000004_enable_rls_policies.sql`)
```sql
-- mentor_invitations policies
CREATE POLICY "Users can view their sent invitations"
  ON mentor_invitations FOR SELECT
  USING (auth.uid() = job_seeker_id);

CREATE POLICY "Users can create invitations"
  ON mentor_invitations FOR INSERT
  WITH CHECK (auth.uid() = job_seeker_id);

CREATE POLICY "Users can update their invitations"
  ON mentor_invitations FOR UPDATE
  USING (auth.uid() = job_seeker_id);
```

---

## Potential Root Causes

### Hypothesis 1: Database Table Not Created
**Likelihood**: HIGH
- Migrations exist in `supabase/migrations/` but may not be applied to production
- The edge function tries to insert into `mentor_invitations` which may not exist
- Would result in PostgreSQL error that gets caught and returned as 400

**Verification**:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'mentor_invitations'
);
```

### Hypothesis 2: RLS Policy Blocking Insert
**Likelihood**: MEDIUM
- Edge function uses user's auth token (not service role)
- Insert policy requires `auth.uid() = job_seeker_id`
- If `job_seeker_id` doesn't match `auth.uid()`, insert fails silently

**Code in question** (lines 68-76):
```typescript
const { data: invitation, error: invitationError } = await supabaseClient
  .from('mentor_invitations')
  .insert({
    job_seeker_id: user.id,  // Should match auth.uid()
    mentor_email: mentorEmail.toLowerCase(),
    status: 'pending',
  })
  .select()
  .single();
```

### Hypothesis 3: Supabase Client Error Handling
**Likelihood**: HIGH
- When edge function returns status 400, Supabase JS throws `FunctionsHttpError`
- The response body (containing actual error) is not accessible via `data`
- Error message defaults to generic "Edge Function returned a non-2xx status code"

**Evidence**: Same error regardless of actual failure reason

### Hypothesis 4: Missing Environment Variables
**Likelihood**: LOW
- `RESEND_API_KEY` confirmed set by user
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are auto-injected
- `APP_URL` defaults to localhost (not critical for invite creation)

---

## Comparison: Working vs Non-Working Systems

### Working: Plan Collaborators (`send-plan-invitation`)
```typescript
// Uses service role client (bypasses RLS)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Insert with admin privileges
const { error: invitationError } = await supabaseAdmin
  .from('plan_collaborators')
  .insert({...})
```

### Not Working: Mentor Invitations (`send-invitation`)
```typescript
// Uses user's auth token (subject to RLS)
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      headers: { Authorization: authHeader },
    },
  }
);

// Insert as authenticated user
const { data: invitation, error: invitationError } = await supabaseClient
  .from('mentor_invitations')
  .insert({...})
```

---

## Recommended Investigation Steps

### Step 1: Check if table exists
Run in Supabase SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'mentor_invitations';
```

### Step 2: Check Edge Function Logs
1. Go to https://supabase.com/dashboard/project/ybrpblehwfneqenlitgo/functions
2. Click on `send-invitation`
3. View logs for the failed invocation
4. Look for actual error message

### Step 3: Test RLS Policy
```sql
-- As the authenticated user, try inserting
INSERT INTO mentor_invitations (job_seeker_id, mentor_email, status)
VALUES ('USER_ID_HERE', 'test@example.com', 'pending');
```

---

## Proposed Fixes

### Option A: Use Service Role (Quick Fix)
Modify `send-invitation` to use service role like `send-plan-invitation`:
```typescript
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);
```
**Trade-off**: Bypasses RLS, requires careful validation in code

### Option B: Fix Error Propagation
Modify service layer to extract error from response:
```typescript
export async function inviteMentor(mentorEmail: string, personalMessage?: string) {
  const response = await supabase.functions.invoke('send-invitation', {
    body: { mentorEmail, personalMessage },
  });

  // FunctionsHttpError contains the response
  if (response.error) {
    const errorBody = await response.error.context?.json?.();
    throw new Error(errorBody?.error || response.error.message);
  }

  if (response.data?.error) {
    throw new Error(response.data.error);
  }

  return response.data;
}
```

### Option C: Run Missing Migrations
If table doesn't exist, push migrations:
```bash
npx supabase db push --project-ref ybrpblehwfneqenlitgo
```

---

## Questions for Chief Architect

1. **Database State**: Should we verify all migrations are applied to production, or create a new migration script that's idempotent?

2. **Service Role vs User Auth**: For edge functions that create records on behalf of users, should we:
   - Use service role and validate permissions in code?
   - Use user auth and rely on RLS?
   - Use a hybrid approach?

3. **Error Handling Strategy**: The Supabase JS client doesn't expose error response bodies well. Should we:
   - Return 200 with error in body (anti-pattern but works)?
   - Use a custom fetch wrapper?
   - Accept generic errors and log details server-side?

4. **Consolidation**: We have two invitation systems:
   - `mentor_invitations` + `send-invitation` (Mentors page)
   - `plan_collaborators` + `send-plan-invitation` (Plan detail page)

   Should these be unified into a single system?

---

## Files for Review

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/mentor/InviteMentor.tsx` | 1-112 | UI component |
| `src/services/mentor.service.ts` | 39-55 | Service layer |
| `supabase/functions/send-invitation/index.ts` | 1-159 | Edge function |
| `supabase/migrations/20250101000003_create_relationship_tables.sql` | 4-19 | Table schema |
| `supabase/migrations/20250101000004_enable_rls_policies.sql` | RLS | Policies |

---

## Immediate Actions Requested

1. **Verify table exists** in Supabase dashboard
2. **Check edge function logs** for actual error
3. **Advise on fix approach** (A, B, or C above)

---

*Report generated: December 13, 2025*
*Project: Career Playbook*
*Issue: Mentor invitation failing with generic error*
