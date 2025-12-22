# Career Playbook - Complete Features Overview

## Product Capabilities by Module

---

## 1. Career Canvas

**Purpose:** Define your unique professional value proposition using a structured 9-section framework.

### Sections:
1. **Who Helps You Succeed** - People, teams, resources that enable your best work
2. **Activities You Love** - Work that energizes and motivates you
3. **Value You Create** - Outcomes and results you deliver
4. **Interactions You Prefer** - How you like to collaborate
5. **How to Convince You** - What motivates your decisions
6. **Skills You Bring** - Core competencies and expertise
7. **What Motivates You** - Internal drivers and aspirations
8. **What You Sacrifice** - Trade-offs you're willing to make
9. **Outcomes You Want** - Career objectives and goals

### Features:
- Auto-save with 2-second debounce
- Real-time progress percentage
- Multiple canvas versions (up to 3)
- Business View format for sharing
- Guided wizard for first-time users
- 500 character limit per section

---

## 2. 90-Day Plan Builder

**Purpose:** Convert career goals into actionable 12-week plans with measurable weekly milestones.

### Core Features:
- Create unlimited 90-day plans
- 12 weekly milestones per plan
- Drag-and-drop reordering (desktop)
- Numbered list view (mobile)

### Milestone Tracking:
- Status: Not Started, In Progress, Completed, Blocked
- Notes field for details
- 200 character goal limit
- Progress visualization chart

### AI Features:
- AI-generated milestone suggestions based on Career Canvas
- Smart ordering recommendations

### Collaboration:
- Share with mentors (read-only)
- Invite accountability partners
- Mentor feedback per milestone

---

## 3. Resume Analysis

**Purpose:** Get AI-powered ATS scoring and specific improvement recommendations.

### Upload & Analysis:
- PDF upload (max 10MB)
- AI processing (10-15 seconds)
- ATS score (0-100 scale)
- Color-coded results (Red/Yellow/Green)

### Analysis Tabs:
- **Strengths:** What's working well
- **Gaps:** Missing elements and weak areas
- **Recommendations:** Specific, actionable improvements

### Usage:
- 2 analyses/month (Free)
- 10 analyses/month (Pro)
- Analysis history preserved
- Quota display and tracking

---

## 4. Resume vs Job Description

**Purpose:** Tailor your resume to specific job postings with AI-powered matching.

### Input Methods:
- Paste job description text
- Upload PDF job posting
- Enter LinkedIn job URL

### Analysis Results:
- Match percentage score
- Keyword identification (in both documents)
- Section-by-section comparison
- Improvement suggestions
- Prioritized action items

---

## 5. Resume Builder

**Purpose:** Create professional resumes with a guided editor.

### Sections:
- Personal Information
- Work Experience (multiple entries)
- Education
- Skills (with proficiency levels)
- Certifications
- Projects/Portfolio
- Summary/Objective

### Features:
- Multiple resume versions
- Template selection
- Import from existing PDF
- Set primary resume
- Duplicate for variations
- PDF export

---

## 6. Job Board

**Purpose:** Search, save, and track job opportunities from multiple sources.

### Job Search:
- Keyword search
- Location/remote filter
- Experience level filter
- Salary range filter
- Job type filter (full-time, contract, etc.)

### Three-Tab Interface:
- **Discover:** Search new jobs
- **Saved:** Bookmarked opportunities
- **My Jobs:** Active applications

### Tracking:
- Application status workflow
- Favorite marking
- Hide irrelevant jobs
- CRM integration

### AI Recommendations:
- Best match job titles
- Adjacent role suggestions
- Title variations
- Keyword pack for searches

---

## 7. Job Hunt CRM

**Purpose:** Manage companies, contacts, and application pipeline like a sales CRM.

### Company Records:
- Company details (name, website, industry, size, location)
- Contact information (name, title, email, phone, LinkedIn)
- Job details (posting URL, salary range, title)
- Application tracking (date, status, follow-ups)
- Priority level (1-5 stars)
- Referral source
- Notes and comments

### Status Pipeline:
- Researching (Gray)
- Applied (Blue)
- Interviewing (Yellow)
- Offer (Green)
- Rejected (Red)

### Views:
- Card view (mobile-optimized)
- Table view (desktop data view)

### Features:
- Search and filter
- Sort by name, date, priority
- Statistics dashboard
- Bulk actions

---

## 8. Interview Management

**Purpose:** Schedule, prepare for, and track interviews throughout your search.

### Scheduling:
- Company and position
- Date and time
- Interview type (phone, video, in-person)
- Interview stage (first round, technical, final)
- Interviewer name(s)
- Meeting link/location

### Tracking:
- Status: Scheduled, Completed, Cancelled, Rescheduled
- Prep notes
- Interview questions
- Feedback/outcome recording

### Views:
- Calendar view
- List view (upcoming/past)
- Reminder notifications

---

## 9. Mentorship Hub

**Purpose:** Collaborate with career mentors through structured guidance and feedback.

### For Job Seekers:
- Invite mentors via email
- Track invitation status (Pending, Accepted, Declined)
- Resend invitations
- Revoke mentor access
- Share Career Canvas (read-only)
- Share 90-Day Plans (read-only)

### For Mentors:
- View mentee's Career Canvas
- View mentee's 90-Day Plan
- Provide milestone feedback
- Track mentee progress
- Schedule mentorship sessions

### Session Management:
- Date/time selection
- Duration (30-60 min)
- Meeting format (video, phone, in-person)
- Meeting link/location
- Proposed/Confirmed status
- Session notes and outcomes
- Automated reminders

---

## 10. Dashboard & Analytics

**Purpose:** Quick access to all features with progress visualization.

### Quick Actions:
- One-click access to major features
- Profile completion reminder

### Analytics:
- Plan completion percentage
- Milestone progress
- Interview metrics
- Application funnel
- Career Canvas completeness

### Activity:
- Recent actions timeline
- Statistics charts

---

## 11. Admin Dashboard (Admin/Super Admin only)

**Purpose:** Platform management for administrators.

### User Management:
- View all users
- Change user roles
- Update limits/quotas
- Edit profiles
- Remove users

### Analytics:
- Active user count
- Plans created
- Sessions scheduled
- Usage metrics

### Content Management:
- Plan templates (CRUD)
- AI prompts editor
- Email templates
- Partner integrations

### Settings:
- Platform limits
- Feature toggles
- Integration keys

---

## User Roles & Permissions

| Feature | Job Seeker | Mentor | Admin | Super Admin |
|---------|------------|--------|-------|-------------|
| Career Canvas | Create/Edit | View Only | Create/Edit | Full |
| 90-Day Plans | Create/Edit | View Only | Create/Edit | Full |
| Resume Analysis | Use | - | Use | Full |
| Job CRM | Full | - | Full | Full |
| Mentorship | Invite/Manage | Provide Feedback | Full | Full |
| Admin Dashboard | - | - | Limited | Full |
| User Management | - | - | View | Full |

---

## Technical Specifications

### Performance:
- Bundle size: 1.07MB (gzipped)
- Load time: <3 seconds
- Mobile responsive: Yes

### Security:
- Row-level security (RLS)
- JWT authentication
- Encrypted data storage
- GDPR-ready architecture

### Integrations:
- OpenAI GPT-4 (AI features)
- Resend (email)
- Jooble (job search)
- Supabase (database, auth, storage)

---

## Pricing Tiers

| Feature | Free | Pro ($9.99/mo) |
|---------|------|----------------|
| Career Canvases | 1 | 3 |
| 90-Day Plans | Unlimited | Unlimited |
| Resume Analyses | 0/month | 10/month |
| CRM Entries | 50 | Unlimited |
| Mentors | 2 | Unlimited |
| AI Milestones | - | Yes |
| Resume Builder | - | Yes |
| Priority Support | - | Yes |

---

*Last Updated: December 2024*
