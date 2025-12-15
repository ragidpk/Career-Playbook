# Architect Report: RLS Permission Error on mentor_invitations

## Issue Summary
**Error:** `permission denied for table users (42501)`
**Location:** Mentors page (`/mentors`) when loading invitations
**Impact:** Users cannot view their sent mentor invitations

---

## Root Cause Analysis

### The Problem
The RLS (Row Level Security) policy on `mentor_invitations` table references `auth.users` directly, which the `authenticated` role does not have SELECT permission on.

### Problematic Policy
```sql
CREATE POLICY "Mentors can view invitations sent to them"
  ON mentor_invitations FOR SELECT
  USING (
    mentor_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR mentor_id = auth.uid()
  );
```

### Why It Fails
1. PostgreSQL evaluates **ALL** applicable SELECT policies when a user queries the table
2. Even though the user is a job seeker (not a mentor), PostgreSQL still evaluates the mentor policy
3. The subquery `SELECT email FROM auth.users` fails because `authenticated` role lacks SELECT permission on `auth.users`
4. This causes error code `42501` (insufficient_privilege)

### Current Policy Structure
```
mentor_invitations policies:
- "Users can view their sent invitations" (job_seeker_id = auth.uid())
- "Mentors can view invitations sent to them" (queries auth.users - FAILS)
- "Admins can view all mentor invitations" (checks profiles.is_admin)
- Several other policies...
```

---

## Proposed Solutions

### Option A: Use auth.jwt() Instead of auth.users (Recommended)
Replace direct `auth.users` query with JWT claim extraction:

```sql
-- Drop problematic policy
DROP POLICY IF EXISTS "Mentors can view invitations sent to them" ON mentor_invitations;

-- Create fixed policy using JWT
CREATE POLICY "Mentors can view invitations sent to them"
  ON mentor_invitations FOR SELECT
  USING (
    mentor_email = (auth.jwt() ->> 'email')
    OR mentor_id = auth.uid()
  );
```

**Pros:**
- No permission issues - JWT is always accessible
- Slightly more performant (no subquery)
- Standard Supabase pattern

**Cons:**
- Requires email claim in JWT (usually present by default)

---

### Option B: Use a Security Definer Function
Create a function that runs with elevated privileges:

```sql
-- Create helper function
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION get_user_email() TO authenticated;

-- Update policy
DROP POLICY IF EXISTS "Mentors can view invitations sent to them" ON mentor_invitations;

CREATE POLICY "Mentors can view invitations sent to them"
  ON mentor_invitations FOR SELECT
  USING (
    mentor_email = get_user_email()
    OR mentor_id = auth.uid()
  );
```

**Pros:**
- More explicit control
- Can add logging/auditing

**Cons:**
- More complex
- SECURITY DEFINER functions need careful review

---

### Option C: Grant SELECT on auth.users (Not Recommended)
```sql
GRANT SELECT ON auth.users TO authenticated;
```

**Pros:**
- Simple one-liner

**Cons:**
- Security risk - exposes all user emails/metadata
- Against Supabase best practices
- Could leak sensitive information

---

## Recommended Action

**Implement Option A** - Use `auth.jwt() ->> 'email'` instead of querying `auth.users`.

### Migration Script
```sql
-- Fix mentor_invitations RLS policies
-- Replace auth.users queries with auth.jwt()

-- 1. Drop policies that query auth.users
DROP POLICY IF EXISTS "Mentors can view invitations sent to them" ON mentor_invitations;
DROP POLICY IF EXISTS "Mentors can update their invitation status" ON mentor_invitations;

-- 2. Recreate with JWT-based email check
CREATE POLICY "Mentors can view invitations sent to them"
  ON mentor_invitations FOR SELECT
  USING (
    LOWER(mentor_email) = LOWER(auth.jwt() ->> 'email')
    OR mentor_id = auth.uid()
  );

CREATE POLICY "Mentors can update their invitation status"
  ON mentor_invitations FOR UPDATE
  USING (
    LOWER(mentor_email) = LOWER(auth.jwt() ->> 'email')
    OR mentor_id = auth.uid()
  );
```

---

## Additional Observations

### Other Policies to Review
The `mentor_access` table may have similar issues. All RLS policies should be audited for `auth.users` references.

### Testing Checklist
After fix:
- [ ] Job seeker can view their sent invitations
- [ ] Mentor can view invitations sent to them (by email)
- [ ] Mentor can view invitations after accepting (by mentor_id)
- [ ] Admin can view all invitations
- [ ] Unauthorized users cannot view others' invitations

---

## Questions for Architect

1. Is `auth.jwt() ->> 'email'` the preferred pattern for email-based RLS in this project?
2. Should we audit all RLS policies for `auth.users` references?
3. Any concerns with case-insensitive email matching (`LOWER()`)?

---

## Files Involved
- `scripts/migration-mentor-invitations.cjs` - Original migration with problematic policies
- `src/services/mentor.service.ts` - Service that queries the table
- `src/pages/Mentors.tsx` - UI that displays the error

---

**Report Date:** December 14, 2025
**Prepared By:** Development Team
**Priority:** High - Blocks core mentor functionality
