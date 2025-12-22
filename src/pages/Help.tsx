import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  HelpCircle,
  BookOpen,
  Target,
  Calendar,
  FileText,
  Briefcase,
  Building2,
  Users,
  MessageSquare,
  Settings,
  ChevronRight,
  ChevronDown,
  Play,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  CheckCircle,
  Lightbulb,
  ClipboardList,
  FileSearch,
  PenTool,
} from 'lucide-react';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  content: HelpArticle[];
}

interface HelpArticle {
  title: string;
  content: string;
  tips?: string[];
  steps?: string[];
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    description: 'Learn the basics of Career Playbook',
    content: [
      {
        title: 'Creating Your Account',
        content: 'Sign up for Career Playbook using your email address. After registration, you\'ll receive a verification email to activate your account.',
        steps: [
          'Go to careerplaybook.app and click "Get Started Free"',
          'Enter your email address and create a secure password',
          'Check your email for the verification link',
          'Click the link to verify and activate your account',
          'Complete the 3-step onboarding process'
        ]
      },
      {
        title: 'Completing Your Profile',
        content: 'Your profile powers personalized recommendations. Complete all sections for the best experience.',
        steps: [
          'Step 1: Personal Information - Name, phone, location, LinkedIn URL',
          'Step 2: Career Background - Years of experience, current role, specialization, education level',
          'Step 3: Career Goals - Target role, target industry, job search status, work preference, salary expectations'
        ],
        tips: [
          'A complete profile improves AI recommendations',
          'Add your skills and areas of expertise for better job matching',
          'Update your job search status to reflect your current situation'
        ]
      },
      {
        title: 'Understanding the Dashboard',
        content: 'Your Dashboard is the command center showing your career journey at a glance.',
        tips: [
          'Quick Actions provide one-click access to all major features',
          'Analytics section shows your progress metrics',
          'Profile completion reminder appears until your profile is 100% complete',
          'Access Career Goal, 12 Weeks Plan, Resume Analysis, CRM, Job Board, Interviews, and Mentoring from here'
        ]
      }
    ]
  },
  {
    id: 'career-goal',
    title: 'Career Goal',
    icon: Target,
    description: 'Define your professional value proposition with the 9-section Career Canvas',
    content: [
      {
        title: 'What is Career Goal?',
        content: 'Career Goal uses a 9-section Career Canvas framework to help you articulate your unique professional value proposition. It captures who you are, what you offer, and what you want from your career.',
      },
      {
        title: 'The 9 Canvas Sections',
        content: 'Each section captures a different aspect of your professional identity. Complete at least 3 sections to unlock AI features.',
        steps: [
          '1. Who Helps You Succeed - People, teams, resources that enable your best work',
          '2. Activities You Love - Work that energizes and motivates you',
          '3. Value You Create - Outcomes and results you consistently deliver',
          '4. Interactions You Prefer - How you like to work with others',
          '5. How to Convince You - What motivates your career decisions',
          '6. Skills You Bring - Your core competencies and expertise',
          '7. What Motivates You - Internal drivers and aspirations',
          '8. What You Sacrifice - Trade-offs you\'re willing to make',
          '9. Outcomes You Want - Your career objectives and goals'
        ]
      },
      {
        title: 'Creating Your Canvas',
        content: 'Use the guided wizard to complete your canvas step by step.',
        steps: [
          'Navigate to Career Goal from the sidebar',
          'Click "Edit Canvas" to open the wizard',
          'Answer each section\'s guiding question',
          'Your progress is shown as a percentage (e.g., "5/9 sections filled")',
          'Changes auto-save as you type'
        ],
        tips: [
          'Be specific - avoid generic statements',
          'Use real examples from your experience',
          'You can create up to 3 different canvases for different career paths',
          'Complete 3+ sections to enable AI-powered 12 Weeks Plan generation'
        ]
      },
      {
        title: 'Sharing Your Canvas',
        content: 'Share your Career Canvas with mentors and accountability partners for feedback.',
        tips: [
          'Click "Share with Partners" to invite accountability partners',
          'Click "Submit to Mentor" to share with an invited mentor',
          'Partners and mentors get read-only access - they cannot edit your canvas',
          'Use "Business View" to see a professional presentation of your canvas'
        ]
      },
      {
        title: 'Linking to 12 Weeks Plan',
        content: 'Once you have 3+ sections filled, you can create a 12 Weeks Plan linked to your canvas. The plan can be generated manually or with AI assistance based on your canvas content.',
      }
    ]
  },
  {
    id: '12-weeks-plan',
    title: '12 Weeks Plan',
    icon: Calendar,
    description: 'Create structured 12-week action plans with weekly milestones',
    content: [
      {
        title: 'What is the 12 Weeks Plan?',
        content: 'The 12 Weeks Plan helps you break down your career goals into actionable weekly milestones. Each plan spans 84 days (12 weeks) and keeps you focused on consistent progress.',
      },
      {
        title: 'Creating Your First Plan',
        content: 'Start by linking your plan to a completed Career Canvas.',
        steps: [
          'Complete at least 3 sections of your Career Canvas',
          'From Career Goal, click "Create Manual Plan" or "Generate with AI"',
          'Enter a plan title (e.g., "Q1 2025 Job Search Strategy")',
          'Set your start date - the end date auto-calculates to 84 days later',
          'Your plan appears in the 12 Weeks Plan section'
        ]
      },
      {
        title: 'Adding Milestones',
        content: 'Each week has a milestone - a specific goal to achieve.',
        steps: [
          'Open your plan and click "Create Manual Timeline" or "Generate AI Timeline"',
          'For manual creation: Add a goal for each of the 12 weeks',
          'For AI generation: The system creates milestones based on your Career Canvas',
          'Edit any milestone by clicking on it'
        ],
        tips: [
          'Make milestones specific and measurable',
          'Each milestone should be achievable in one week',
          'Example: "Apply to 5 target companies" instead of "Find a job"'
        ]
      },
      {
        title: 'Tracking Progress',
        content: 'Update milestone status as you work through your plan.',
        tips: [
          'Not Started (gray) - Haven\'t begun this milestone',
          'In Progress (blue) - Currently working on it',
          'Completed (green) - Successfully finished',
          'Click the status to cycle through: Not Started → In Progress → Completed → Not Started',
          'Progress percentage updates automatically based on completed milestones'
        ]
      },
      {
        title: 'Continuation Plans',
        content: 'Finished your 12 weeks? Create a continuation plan to keep momentum.',
        steps: [
          'Click "Add Next 12 Weeks" from your current plan',
          'A new plan is created with a suggested title (e.g., "Original Title - Part 2")',
          'Set your new milestones for the next 12-week period'
        ]
      },
      {
        title: 'Sharing Your Plan',
        content: 'Invite mentors and accountability partners to view your progress.',
        tips: [
          '"Share with Partners" - Invite accountability partners',
          '"Submit to Mentor" - Share with your mentor for feedback',
          'Viewers can see your milestones and progress but cannot edit',
          'Mentors can add comments and feedback on individual milestones'
        ]
      }
    ]
  },
  {
    id: 'resume-builder',
    title: 'Resume Builder',
    icon: PenTool,
    description: 'Create and manage multiple professional resumes',
    content: [
      {
        title: 'Creating a New Resume',
        content: 'Build professional resumes using our guided wizard.',
        steps: [
          'Navigate to Resume Builder from the sidebar',
          'Click "Create New Resume"',
          'Enter a name for your resume (e.g., "Tech PM Resume")',
          'Select a template style',
          'Complete each section using the wizard'
        ]
      },
      {
        title: 'Resume Sections',
        content: 'The wizard guides you through all essential resume sections.',
        tips: [
          'Personal Information - Name, contact details, LinkedIn, portfolio',
          'Work Experience - Previous jobs with achievements and bullet points',
          'Education - Schools, degrees, graduation dates',
          'Skills - Technical and soft skills',
          'Certifications - Professional credentials and dates',
          'Projects - Notable work and portfolio pieces',
          'Summary - Professional profile statement'
        ]
      },
      {
        title: 'Import from PDF',
        content: 'Already have a resume? Import it to get started faster.',
        steps: [
          'Click "Import from PDF" button',
          'Upload your existing resume PDF',
          'The system extracts text and content automatically',
          'Review and edit the imported content',
          'Imported resumes are marked with an "Imported" badge'
        ]
      },
      {
        title: 'Managing Multiple Resumes',
        content: 'Create different versions for different types of roles.',
        tips: [
          'Set one resume as "Primary" (gold star icon) for default use',
          'Duplicate a resume to quickly create variations',
          'Delete resumes you no longer need',
          'Each resume card shows name, last updated date, and template type'
        ]
      }
    ]
  },
  {
    id: 'resume-analysis',
    title: 'Resume Analysis',
    icon: FileText,
    description: 'Get AI-powered ATS scoring and improvement recommendations',
    content: [
      {
        title: 'How Resume Analysis Works',
        content: 'Our AI analyzes your resume like an Applicant Tracking System (ATS), providing a score and specific improvement recommendations.',
      },
      {
        title: 'Selecting Your Target Market',
        content: 'Choose the job market you\'re targeting for region-specific analysis.',
        tips: [
          'Gulf Region: UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman',
          'Western Markets: USA, UK, Canada, Australia',
          'Other Markets: Germany, Singapore, India, Other',
          'The market selection affects keyword recommendations and formatting advice'
        ]
      },
      {
        title: 'Uploading Your Resume',
        content: 'Upload your resume PDF for analysis.',
        steps: [
          'Navigate to Resume Analysis',
          'Select your target job market from the dropdown',
          'Click to upload or drag & drop your PDF resume',
          'Wait for AI analysis (typically 10-20 seconds)',
          'View your results'
        ]
      },
      {
        title: 'Understanding Your Results',
        content: 'The analysis provides comprehensive feedback across multiple areas.',
        tips: [
          'ATS Score - Overall score from 0-100',
          'Strengths - What\'s working well in your resume',
          'Gaps - Areas that need improvement',
          'Recommendations - Specific, actionable improvements',
          'Experience Level - Detected career level',
          'Skills Identified - Key skills found in your resume',
          'Role Recommendations - Suggested job titles to target',
          'Job Search Approach - Strategic advice for your search',
          '90-Day Strategy - Week-by-week action plan (Weeks 1-4, 5-8, 9-12)'
        ]
      },
      {
        title: 'Analysis History',
        content: 'View and compare your previous analyses.',
        tips: [
          'Past analyses appear in the sidebar',
          'Click any previous analysis to view its results',
          'Delete old analyses you no longer need',
          'Track improvement between versions'
        ]
      },
      {
        title: 'Usage Limits',
        content: 'Resume analysis is limited to 2 analyses per user. Once you\'ve used both analyses, a message will indicate the limit has been reached.',
      }
    ]
  },
  {
    id: 'resume-vs-jd',
    title: 'Resume vs JD',
    icon: FileSearch,
    description: 'Compare your resume against specific job descriptions',
    content: [
      {
        title: 'Why Compare Resume to JD?',
        content: 'Tailoring your resume to each job description significantly improves your chances. This tool shows exactly how well your resume matches a specific job.',
      },
      {
        title: 'Selecting Your Resume',
        content: 'Choose which of your saved resumes to compare.',
        steps: [
          'The left panel shows your saved resume analyses',
          'Select the resume you want to compare',
          'This becomes the basis for the comparison'
        ]
      },
      {
        title: 'Entering the Job Description',
        content: 'Input the job description using one of three methods.',
        tips: [
          'Paste Text - Copy and paste the job description directly',
          'Upload PDF - Upload a PDF of the job posting',
          'Enter URL - Paste a job posting URL (LinkedIn, Indeed, etc.) and we\'ll extract it',
          'Click "Extract" to process the job description'
        ]
      },
      {
        title: 'Extracted JD Preview',
        content: 'Review the extracted job details before analysis.',
        tips: [
          'Title - Job title',
          'Company - Company name',
          'Location - Job location',
          'Description - Full job description',
          'Requirements - Listed requirements',
          'Skills - Required skills',
          'Experience Required - Years of experience needed',
          'Source URL - Original posting link'
        ]
      },
      {
        title: 'Analysis Results',
        content: 'The comparison provides detailed matching insights. Note: Analysis may take up to 30 seconds.',
        tips: [
          'Match Score - Percentage match between resume and JD',
          'Keyword Analysis - Skills and keywords found in both documents',
          'Section Analysis - How each resume section aligns with requirements',
          'Improvements - Specific suggestions to improve your match',
          'Tailored Summary - AI-generated summary for this role',
          'Action Items - Prioritized list of changes to make'
        ]
      },
      {
        title: 'Starting a New Analysis',
        content: 'Click "New Analysis" to reset and compare against a different job description. Both the job description and analysis are saved for future reference.',
      }
    ]
  },
  {
    id: 'job-board',
    title: 'Job Board',
    icon: Briefcase,
    description: 'Discover, save, and track job opportunities',
    content: [
      {
        title: 'Three Tabs Overview',
        content: 'The Job Board is organized into three main sections for different stages of your job search.',
        tips: [
          'Discover Jobs - Search and find new opportunities with AI recommendations',
          'Saved Jobs - Jobs you\'ve bookmarked for later review',
          'My Jobs - Jobs you\'re actively tracking with application status'
        ]
      },
      {
        title: 'Discover Jobs Tab',
        content: 'Search for new opportunities and get AI-powered recommendations.',
        steps: [
          'View AI Job Recommendations based on your profile',
          'Use the search bar to find specific jobs',
          'Apply filters (title, location, keywords)',
          'Click "Import Job URL" to add jobs from LinkedIn, Indeed, etc.',
          'Save interesting jobs or track them directly in CRM'
        ]
      },
      {
        title: 'Saving and Tracking Jobs',
        content: 'Organize opportunities as you find them.',
        tips: [
          'Click the bookmark icon to save a job for later',
          'Click "Track in CRM" to add the company to your Job Hunt CRM',
          'Saved jobs appear in the "Saved Jobs" tab',
          'Hide irrelevant jobs to clean up your search results'
        ]
      },
      {
        title: 'My Jobs Tab',
        content: 'Track your active job applications and their status.',
        tips: [
          'Stats bar shows counts: Total, Saved, Applied, Interviewing, Offers, Rejected, Withdrawn',
          'Search by job title, company, or description',
          'Filter by application status or source',
          'Toggle favorites to see priority opportunities',
          'Click "Add Job" to manually add a job',
          'Edit or delete jobs as needed'
        ]
      },
      {
        title: 'Importing Jobs',
        content: 'Add jobs from external sources quickly.',
        steps: [
          'Click "Import Job URL"',
          'Paste the job posting URL',
          'Choose: "Import and Save" or "Import and Track in CRM"',
          'The job details are extracted automatically'
        ]
      }
    ]
  },
  {
    id: 'crm',
    title: 'Job Hunt CRM',
    icon: Building2,
    description: 'Manage companies, contacts, and your application pipeline',
    content: [
      {
        title: 'What is Job Hunt CRM?',
        content: 'Think of your job search as a sales pipeline - you\'re selling yourself to companies. The CRM helps you track every company, contact, and interaction systematically.',
      },
      {
        title: 'Adding a Company',
        content: 'Track each company you\'re interested in or applying to.',
        steps: [
          'Click "Add Company" button',
          'Enter company name and details',
          'Add contact information (name, title, email, phone)',
          'Specify the job title you\'re targeting',
          'Add website URL and any notes',
          'Set priority level (1-3)',
          'Set follow-up date for reminders'
        ]
      },
      {
        title: 'Status Pipeline',
        content: 'Track each company through your job search stages.',
        tips: [
          'Researching (Gray) - Learning about the company',
          'Applied (Blue) - Application submitted',
          'Interviewing (Yellow) - Active interview process',
          'Offer (Green) - Received an offer',
          'Change status by clicking and selecting from dropdown'
        ]
      },
      {
        title: 'Stats Dashboard',
        content: 'View your pipeline at a glance when you have companies tracked.',
        tips: [
          'Total - All companies in your CRM',
          'Researching - Companies you\'re investigating',
          'Applied - Applications submitted',
          'Interviewing - Active interview processes',
          'Offers - Offers received',
          'Favorites - Starred priority companies (clickable filter)',
          'Pending Follow-ups - Companies with upcoming follow-up dates (only shows if any exist)'
        ]
      },
      {
        title: 'Search and Filter',
        content: 'Find specific companies quickly.',
        tips: [
          'Search by company name, job title, contact name, or location',
          'Filter by status using the dropdown',
          'Toggle favorites with the star button',
          'Sort by Date Added, Name, or Priority',
          'Toggle ascending/descending order'
        ]
      },
      {
        title: 'Managing Companies',
        content: 'Keep your CRM organized and up-to-date.',
        tips: [
          'Click a company card to view/edit details',
          'Update status as you progress through the pipeline',
          'Add notes after each interaction',
          'Set follow-up dates to remember to check back',
          'Mark favorites for priority opportunities',
          'Delete companies you\'re no longer pursuing'
        ]
      }
    ]
  },
  {
    id: 'interviews',
    title: 'Interviews',
    icon: ClipboardList,
    description: 'Schedule, prepare for, and track your interviews',
    content: [
      {
        title: 'Interview Prep Tracker',
        content: 'Keep all your interviews organized in one place with preparation notes and outcome tracking.',
      },
      {
        title: 'Three Views',
        content: 'Access your interviews in different ways.',
        tips: [
          'Upcoming - Future scheduled interviews',
          'Past - Completed and cancelled interviews',
          'Calendar - Visual calendar view of all interviews'
        ]
      },
      {
        title: 'Stats Overview',
        content: 'Quick metrics when you have interviews scheduled.',
        tips: [
          'Upcoming - Total future interviews (blue)',
          'This Week - Interviews in the current week (orange)',
          'Completed - Finished interviews (green)'
        ]
      },
      {
        title: 'Adding an Interview',
        content: 'Schedule and document each interview.',
        steps: [
          'Click "Add Interview"',
          'Enter company name and position',
          'Set the scheduled date and time',
          'Select interview type (phone, video, in-person, etc.)',
          'Add prep notes for what you want to cover',
          'Save the interview'
        ]
      },
      {
        title: 'Interview Statuses',
        content: 'Track each interview through its lifecycle.',
        tips: [
          'Scheduled - Confirmed and upcoming',
          'Completed - Interview finished',
          'Cancelled - Interview was cancelled',
          'Rescheduled - Moved to a different time'
        ]
      },
      {
        title: 'Preparation and Follow-up',
        content: 'Use the prep notes and feedback fields effectively.',
        tips: [
          'Add prep notes before the interview (questions to ask, points to make)',
          'After the interview, add feedback notes about how it went',
          'Search interviews by company, position, prep notes, or feedback',
          'Filter by status to see specific interview types'
        ]
      }
    ]
  },
  {
    id: 'mentoring',
    title: 'Mentoring',
    icon: Users,
    description: 'Connect with mentors and view mentees',
    content: [
      {
        title: 'Two Perspectives',
        content: 'The Mentoring page serves both mentees (job seekers inviting mentors) and mentors (viewing their mentees).',
        tips: [
          'Invite Mentors tab - For inviting professionals to mentor you',
          'My Mentees tab - For viewing people you\'re mentoring (if applicable)'
        ]
      },
      {
        title: 'Inviting a Mentor',
        content: 'Invite trusted professionals to guide your career journey.',
        steps: [
          'Go to Mentoring page',
          'Click "Invite Mentor"',
          'Enter your mentor\'s email address',
          'Add a personal message explaining why you\'d value their guidance',
          'Send the invitation'
        ]
      },
      {
        title: 'What Mentors Can See',
        content: 'Mentors get read-only access to help guide you.',
        tips: [
          'Your Career Canvas (Career Goal) - Your value proposition',
          'Your 12 Weeks Plan - Goals and milestones',
          'They can add comments and feedback on milestones',
          'They CANNOT edit your data - view and comment only'
        ]
      },
      {
        title: 'Managing Invitations',
        content: 'Track and manage your mentor invitations.',
        tips: [
          'See invitation status: Pending or Accepted',
          'View invitation date for each mentor',
          'Resend invitation if mentor hasn\'t responded',
          'Delete/revoke mentor access when needed'
        ]
      },
      {
        title: 'Viewing Mentees (For Mentors)',
        content: 'If you\'re mentoring others, the My Mentees tab shows your mentees.',
        steps: [
          'Click on a mentee from the sidebar list',
          'View their Career Canvas in read-only mode',
          'View their 12 Weeks Plan and milestone progress',
          'Add feedback and comments on their milestones',
          'Click "Schedule Session" to book 1-on-1 time'
        ]
      }
    ]
  },
  {
    id: 'sessions',
    title: 'Sessions',
    icon: MessageSquare,
    description: 'Schedule and manage mentorship and accountability sessions',
    content: [
      {
        title: 'What are Sessions?',
        content: 'Sessions are scheduled 1-on-1 meetings with your mentors or accountability partners for focused career discussions.',
      },
      {
        title: 'Session Stats',
        content: 'Quick overview of your session activity.',
        tips: [
          'Total - All sessions',
          'Upcoming - Sessions not yet held (green)',
          'Completed - Finished sessions (blue)',
          'Cancelled - Sessions that were cancelled (gray)'
        ]
      },
      {
        title: 'Session Tabs',
        content: 'View sessions by timeframe.',
        tips: [
          'Upcoming - Next 10 scheduled sessions',
          'Past - Last 20 completed sessions',
          'All Sessions - Complete session history'
        ]
      },
      {
        title: 'Session Workflow',
        content: 'Sessions progress through these statuses.',
        steps: [
          'Proposed - Initial request with suggested time(s)',
          'Confirmed - Time accepted by both parties',
          'Completed - Session finished successfully',
          'Cancelled - Session was cancelled',
          'No-show - Attendee didn\'t show up'
        ]
      },
      {
        title: 'Session Actions',
        content: 'Manage sessions based on their current status.',
        tips: [
          'Confirm Session - Accept a proposed time (shows time selector)',
          'Cancel Session - Cancel an upcoming session',
          'Complete Session - Mark a session as finished',
          'Mark No-show - Record when attendee doesn\'t appear'
        ]
      },
      {
        title: 'Session Details',
        content: 'Each session card shows important information.',
        tips: [
          'Attendee/host names',
          'Proposed or confirmed time',
          'Status badge (color-coded)',
          'Meeting link (for video sessions)'
        ]
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    description: 'Manage your account and preferences',
    content: [
      {
        title: 'Account Settings Overview',
        content: 'Manage your profile, preferences, and account details from the Settings page.',
      },
      {
        title: 'Personal Information',
        content: 'Update your basic contact details.',
        tips: [
          'Full Name - Your display name',
          'Email - Your account email (read-only)',
          'Phone Number - Contact number',
          'Location - City/region',
          'LinkedIn URL - Your LinkedIn profile link'
        ]
      },
      {
        title: 'Career Background',
        content: 'Keep your professional details current.',
        tips: [
          'Years of Experience - Select from dropdown',
          'Current Role/Job Title - Your current position',
          'Specialization - Your area of focus',
          'Education Level - Highest education achieved',
          'Areas of Expertise - Add/remove expertise tags',
          'Skills - Add/remove skill tags'
        ]
      },
      {
        title: 'Career Goals',
        content: 'Define what you\'re looking for in your next role.',
        tips: [
          'Target Role - Position you\'re aiming for',
          'Target Industry - Preferred industry (Tech, Finance, Healthcare, etc.)',
          'Job Search Status - Active, passive, or not searching',
          'Work Preference - Remote, on-site, or hybrid',
          'Salary Expectation - Expected salary range'
        ]
      },
      {
        title: 'Profile Photo',
        content: 'Upload an avatar to personalize your account. If no photo is uploaded, your initials are displayed.',
      },
      {
        title: 'Saving Changes',
        content: 'Click Edit to enable editing mode, make your changes, then click Save. Changes are saved to your account immediately.',
      }
    ]
  }
];

const faqs = [
  {
    question: 'Is Career Playbook free to use?',
    answer: 'Career Playbook offers core features for free including Career Goal canvas, 12 Weeks Plans, Job Hunt CRM, and Mentoring. Some advanced features like Resume Analysis have usage limits (2 analyses per account).'
  },
  {
    question: 'How many Career Canvases can I create?',
    answer: 'You can create up to 3 Career Canvases. This allows you to explore different career paths or create versions for different roles.'
  },
  {
    question: 'How does AI resume analysis work?',
    answer: 'Our AI analyzes your resume like an Applicant Tracking System (ATS). It evaluates formatting, keywords, achievements, and structure to give you a score with specific improvement recommendations tailored to your target job market.'
  },
  {
    question: 'What can mentors see and do?',
    answer: 'Mentors have read-only access to your Career Canvas and 12 Weeks Plan. They can view your progress and add comments/feedback on milestones, but they cannot edit your data.'
  },
  {
    question: 'How many 12 Weeks Plans can I create?',
    answer: 'You can create multiple 12 Weeks Plans. Each plan can be linked to a Career Canvas, and you can create continuation plans to extend your planning beyond the initial 12 weeks.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. We use industry-standard encryption and security practices. Your data is stored securely with row-level security ensuring only you can access your information. Mentors only see what you explicitly share with them.'
  },
  {
    question: 'Can I use Career Playbook on mobile?',
    answer: 'Yes! Career Playbook is fully responsive and works on phones, tablets, and desktops. All features are available on mobile devices.'
  },
  {
    question: 'How do I import jobs from LinkedIn or Indeed?',
    answer: 'In the Job Board, click "Import Job URL" and paste the job posting URL. Our system extracts the job details automatically. You can then save the job or add it directly to your CRM.'
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({});
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return helpSections;

    const query = searchQuery.toLowerCase();
    return helpSections.filter(section =>
      section.title.toLowerCase().includes(query) ||
      section.description.toLowerCase().includes(query) ||
      section.content.some(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query)
      )
    );
  }, [searchQuery]);

  const currentSection = helpSections.find(s => s.id === activeSection);

  const toggleArticle = (articleTitle: string) => {
    setExpandedArticles(prev => ({
      ...prev,
      [articleTitle]: !prev[articleTitle]
    }));
  };

  const toggleFaq = (index: number) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center">
              <img src="/images/logo.svg" alt="Career Playbook" className="h-10" />
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {['About', 'Features', 'Templates', 'Resources', 'Help'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className={`text-sm font-medium transition-smooth ${
                    item === 'Help' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-smooth"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-full shadow-sm hover:bg-primary-600 transition-smooth"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-teal-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-full mb-6">
              <HelpCircle className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-600">Help Center</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
              How can we help you?
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Find answers, learn features, and get the most out of Career Playbook.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: Target, label: 'Career Goal', section: 'career-goal' },
              { icon: Calendar, label: '12 Weeks Plan', section: '12-weeks-plan' },
              { icon: FileText, label: 'Resume Analysis', section: 'resume-analysis' },
              { icon: Briefcase, label: 'Job Board', section: 'job-board' },
              { icon: Building2, label: 'CRM', section: 'crm' },
              { icon: Users, label: 'Mentoring', section: 'mentoring' },
            ].map((item) => (
              <button
                key={item.section}
                onClick={() => setActiveSection(item.section)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeSection === item.section
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Topics</h3>
                <nav className="space-y-1">
                  {filteredSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        activeSection === section.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <section.icon className={`w-5 h-5 flex-shrink-0 ${
                        activeSection === section.id ? 'text-primary-500' : 'text-gray-400'
                      }`} />
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <main className="lg:col-span-3">
              {currentSection && (
                <div>
                  {/* Section Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                        <currentSection.icon className="w-5 h-5 text-primary-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">{currentSection.title}</h2>
                    </div>
                    <p className="text-gray-600">{currentSection.description}</p>
                  </div>

                  {/* Articles */}
                  <div className="space-y-4">
                    {currentSection.content.map((article, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleArticle(`${currentSection.id}-${index}`)}
                          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-gray-900">{article.title}</span>
                          {expandedArticles[`${currentSection.id}-${index}`] ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {expandedArticles[`${currentSection.id}-${index}`] && (
                          <div className="px-5 pb-5 space-y-4">
                            <p className="text-gray-600">{article.content}</p>

                            {article.steps && (
                              <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  Steps
                                </h4>
                                <ol className="space-y-2">
                                  {article.steps.map((step, i) => (
                                    <li key={i} className="text-sm text-gray-600 pl-4">
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {article.tips && (
                              <div className="bg-amber-50 rounded-xl p-4">
                                <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4 text-amber-500" />
                                  Tips
                                </h4>
                                <ul className="space-y-2">
                                  {article.tips.map((tip, i) => (
                                    <li key={i} className="text-sm text-amber-700 pl-4 flex items-start gap-2">
                                      <span className="text-amber-400 mt-1">•</span>
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Video Tutorials</h2>
            <p className="text-gray-600">Watch quick videos to master Career Playbook features</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Getting Started', duration: '3:45', icon: BookOpen },
              { title: 'Career Goal & Canvas', duration: '5:20', icon: Target },
              { title: '12 Weeks Plan Builder', duration: '4:15', icon: Calendar },
              { title: 'Resume Analysis', duration: '3:30', icon: FileText },
              { title: 'Job Hunt CRM', duration: '4:45', icon: Building2 },
              { title: 'Mentoring & Sessions', duration: '4:00', icon: Users },
            ].map((video, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
                  <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                  <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <video.icon className="w-4 h-4 text-gray-400" />
                    <h3 className="font-medium text-gray-900">{video.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500">Learn how to use this feature</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Quick answers to common questions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  {expandedFaqs[index] ? (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {expandedFaqs[index] && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-primary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Still need help?</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you succeed.
          </p>
          <a
            href="mailto:ragid@live.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-full hover:bg-primary-600 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Contact Support
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 mb-12">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center mb-4">
                <img src="/images/logo.svg" alt="Career Playbook" className="h-10 brightness-0 invert" />
              </Link>
              <p className="text-gray-400 mb-6 max-w-sm">
                Plan your career, achieve your goals with AI-powered guidance.
              </p>
              <div className="flex items-center gap-4">
                {[Instagram, Facebook, Twitter, Linkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center transition-smooth"
                  >
                    <Icon className="w-5 h-5 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                {['Features', 'Templates', 'Resources'].map((link) => (
                  <li key={link}>
                    <Link to={`/${link.toLowerCase()}`} className="text-gray-400 hover:text-white transition-smooth">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                {['About', 'Help'].map((link) => (
                  <li key={link}>
                    <Link to={`/${link.toLowerCase()}`} className="text-gray-400 hover:text-white transition-smooth">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/PrivacyPolicy" className="text-gray-400 hover:text-white transition-smooth">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms_of_service" className="text-gray-400 hover:text-white transition-smooth">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2025 Ragid Kader. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
