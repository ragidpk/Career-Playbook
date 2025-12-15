import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Code,
  Lightbulb,
  RefreshCw,
  BarChart3,
  Users,
  Target,
  BookOpen,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Briefcase,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface TemplateWeek {
  week: number;
  title: string;
  theme: string;
  goals: string[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  careerPath: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  isFeatured: boolean;
  keyHighlights: string[];
  targetRoles: string[];
  planOverview: string;
  weeks: TemplateWeek[];
}

const templates: Template[] = [
  {
    id: 'software-engineer',
    name: 'Software Engineer Growth',
    description: 'For engineers looking to advance from mid-level to senior/staff roles. Build technical leadership skills while maintaining hands-on expertise.',
    careerPath: 'Engineering',
    icon: Code,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    isFeatured: true,
    keyHighlights: [
      'System design and architecture mastery',
      'Technical mentorship and code review leadership',
      'Cross-functional collaboration skills',
      'Building visible technical reputation',
    ],
    targetRoles: ['Senior Software Engineer', 'Staff Engineer', 'Tech Lead', 'Principal Engineer'],
    planOverview: '12-week plan to level up from mid-level to senior engineer',
    weeks: [
      { week: 1, title: 'Skills & Gap Assessment', theme: 'foundation', goals: ['Complete skills inventory', 'Identify 3 key gaps', 'Set up learning tracking'] },
      { week: 2, title: 'Target Role Research', theme: 'foundation', goals: ['Research 10 job postings', 'Identify common requirements', 'Map gaps to learning'] },
      { week: 3, title: 'System Design Foundation', theme: 'foundation', goals: ['Start system design course', 'Practice 2 design problems', 'Document learnings'] },
      { week: 4, title: 'Deep Dive Learning', theme: 'skill_development', goals: ['Complete course module', 'Build sample project', 'Write technical blog post'] },
      { week: 5, title: 'Mentorship Launch', theme: 'skill_development', goals: ['Identify 2 junior engineers to mentor', 'Start weekly 1:1s', 'Create mentorship goals'] },
      { week: 6, title: 'Mid-Point Assessment', theme: 'skill_development', goals: ['Review progress on gaps', 'Adjust learning plan', 'Complete certification exam'] },
      { week: 7, title: 'Visibility Building', theme: 'networking', goals: ['Publish first tech article', 'Engage on LinkedIn daily', 'Attend one tech event'] },
      { week: 8, title: 'Network Expansion', theme: 'networking', goals: ['Reach out to 5 senior engineers', 'Schedule 3 informational interviews', 'Join relevant communities'] },
      { week: 9, title: 'Portfolio Completion', theme: 'networking', goals: ['Finalize GitHub projects', 'Update LinkedIn with achievements', 'Prepare case studies'] },
      { week: 10, title: 'Application Preparation', theme: 'job_search', goals: ['Update resume with senior framing', 'Prepare STAR stories', 'Create target company list'] },
      { week: 11, title: 'Active Applications', theme: 'job_search', goals: ['Apply to 10 target companies', 'Practice system design interviews', 'Schedule mock interviews'] },
      { week: 12, title: 'Interview Execution', theme: 'job_search', goals: ['Complete first round interviews', 'Refine based on feedback', 'Negotiate offers'] },
    ],
  },
  {
    id: 'product-management',
    name: 'Product Management Transition',
    description: 'For technical professionals transitioning into Product Management roles. Leverage your technical background as a competitive advantage.',
    careerPath: 'Product',
    icon: Lightbulb,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    isFeatured: true,
    keyHighlights: [
      'Customer discovery and user research',
      'Product specs and roadmap creation',
      'Data-driven decision making',
      'Cross-functional leadership',
    ],
    targetRoles: ['Associate Product Manager', 'Product Manager', 'Technical Product Manager', 'Senior PM'],
    planOverview: '12-week transition plan from technical role to Product Management',
    weeks: [
      { week: 1, title: 'PM Foundations', theme: 'foundation', goals: ["Read 'Inspired' by Marty Cagan", 'Complete PM skills assessment', 'Identify skill gaps'] },
      { week: 2, title: 'Customer Discovery', theme: 'foundation', goals: ['Conduct 5 user interviews', 'Document user pain points', 'Create user persona'] },
      { week: 3, title: 'Current Role PM Work', theme: 'foundation', goals: ['Volunteer for product initiative', 'Write first product spec', 'Present to stakeholders'] },
      { week: 4, title: 'PM Certification Start', theme: 'skill_development', goals: ['Enroll in PM certification', 'Complete first module', 'Practice prioritization frameworks'] },
      { week: 5, title: 'Metrics & Analytics', theme: 'skill_development', goals: ['Define success metrics for initiative', 'Build analytics dashboard', 'Present data insights'] },
      { week: 6, title: 'Roadmap & Strategy', theme: 'skill_development', goals: ['Create product roadmap', 'Align with business objectives', 'Practice stakeholder alignment'] },
      { week: 7, title: 'Network Building', theme: 'networking', goals: ['Reach out to 5 PMs for coffee chats', 'Join Product community', 'Attend PM event'] },
      { week: 8, title: 'Portfolio Development', theme: 'networking', goals: ['Document product work as case studies', 'Create PM portfolio', 'Practice PM storytelling'] },
      { week: 9, title: 'Interview Preparation', theme: 'networking', goals: ['Study PM interview frameworks', 'Practice product sense questions', 'Mock interviews with PMs'] },
      { week: 10, title: 'Application Launch', theme: 'job_search', goals: ['Apply to 15 PM roles', 'Customize resume for each', 'Network into applications'] },
      { week: 11, title: 'Interview Execution', theme: 'job_search', goals: ['Complete phone screens', 'Product case presentations', 'Technical PM assessments'] },
      { week: 12, title: 'Offer & Negotiation', theme: 'job_search', goals: ['Navigate final rounds', 'Negotiate offers', 'Make decision framework'] },
    ],
  },
  {
    id: 'career-pivot',
    name: 'Career Pivot Canvas',
    description: 'For professionals making significant career changes to new industries or roles. Transform your experience into your biggest advantage.',
    careerPath: 'General',
    icon: RefreshCw,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    isFeatured: true,
    keyHighlights: [
      'Transferable skills identification',
      'Bridge project development',
      'Personal brand repositioning',
      'Network building in new field',
    ],
    targetRoles: ['Entry point role in new field', 'Hybrid role bridging old and new', 'Growth role with unique perspective'],
    planOverview: '12-week structured career pivot program',
    weeks: [
      { week: 1, title: 'Clarity & Commitment', theme: 'foundation', goals: ['Define target role clearly', 'Assess financial runway', 'Commit to timeline'] },
      { week: 2, title: 'Gap Analysis', theme: 'foundation', goals: ['Map required skills', 'Identify transferable skills', 'Prioritize learning gaps'] },
      { week: 3, title: 'Learning Plan', theme: 'foundation', goals: ['Enroll in key course/certification', 'Set up daily learning routine', 'Find accountability partner'] },
      { week: 4, title: 'Skill Building Sprint', theme: 'skill_development', goals: ['Complete first course module', 'Start bridge project', 'Document learning'] },
      { week: 5, title: 'Industry Immersion', theme: 'skill_development', goals: ['Consume industry content daily', 'Attend industry event', 'Join 2 communities'] },
      { week: 6, title: 'Portfolio Creation', theme: 'skill_development', goals: ['Complete bridge project', 'Create portfolio piece', 'Get feedback from insider'] },
      { week: 7, title: 'Network Launch', theme: 'networking', goals: ['Reach out to 10 industry contacts', 'Schedule 5 informational interviews', 'Ask for introductions'] },
      { week: 8, title: 'Personal Brand Pivot', theme: 'networking', goals: ['Update LinkedIn completely', 'Craft transition narrative', 'Start posting industry content'] },
      { week: 9, title: 'Resume & Story', theme: 'networking', goals: ['Rewrite resume for new field', 'Practice telling transition story', 'Gather references'] },
      { week: 10, title: 'Application Strategy', theme: 'job_search', goals: ['Create target company list', 'Apply to 10 roles', 'Leverage network for referrals'] },
      { week: 11, title: 'Interview Preparation', theme: 'job_search', goals: ['Practice industry-specific questions', 'Prepare bridge examples', 'Mock interviews'] },
      { week: 12, title: 'Execution & Iteration', theme: 'job_search', goals: ['Complete interviews', 'Gather feedback', 'Iterate on approach'] },
    ],
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist Development',
    description: 'For analysts and engineers building toward data science and ML roles. Develop the skills to translate complex data into business impact.',
    careerPath: 'Data',
    icon: BarChart3,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    isFeatured: false,
    keyHighlights: [
      'Statistical analysis and experimentation',
      'Machine learning model development',
      'Data visualization and storytelling',
      'Business impact communication',
    ],
    targetRoles: ['Data Scientist', 'ML Engineer', 'Senior Data Scientist', 'Data Science Manager'],
    planOverview: '12-week data science skill development program',
    weeks: [
      { week: 1, title: 'Foundation Assessment', theme: 'foundation', goals: ['Assess current data skills', 'Identify ML knowledge gaps', 'Set learning objectives'] },
      { week: 2, title: 'Statistics Deep Dive', theme: 'foundation', goals: ['Review statistical concepts', 'Practice A/B testing', 'Learn experimentation design'] },
      { week: 3, title: 'Python/R Mastery', theme: 'foundation', goals: ['Complete data manipulation exercises', 'Master pandas/numpy', 'Build analysis pipeline'] },
      { week: 4, title: 'ML Fundamentals', theme: 'skill_development', goals: ['Study supervised learning', 'Implement basic models', 'Understand model evaluation'] },
      { week: 5, title: 'Advanced ML', theme: 'skill_development', goals: ['Learn deep learning basics', 'Practice feature engineering', 'Build ML project'] },
      { week: 6, title: 'Data Visualization', theme: 'skill_development', goals: ['Master visualization libraries', 'Create compelling dashboards', 'Present insights effectively'] },
      { week: 7, title: 'Kaggle Competition', theme: 'networking', goals: ['Enter Kaggle competition', 'Learn from top solutions', 'Build public profile'] },
      { week: 8, title: 'Portfolio Projects', theme: 'networking', goals: ['Complete end-to-end project', 'Document methodology', 'Share on GitHub'] },
      { week: 9, title: 'Community Engagement', theme: 'networking', goals: ['Join data science communities', 'Attend meetups', 'Network with practitioners'] },
      { week: 10, title: 'Resume Optimization', theme: 'job_search', goals: ['Tailor resume for DS roles', 'Highlight projects', 'Prepare case studies'] },
      { week: 11, title: 'Technical Prep', theme: 'job_search', goals: ['Practice coding interviews', 'Prepare ML system design', 'Mock technical screens'] },
      { week: 12, title: 'Job Search Launch', theme: 'job_search', goals: ['Apply to target companies', 'Complete interviews', 'Negotiate offers'] },
    ],
  },
  {
    id: 'engineering-manager',
    name: 'Engineering Manager Path',
    description: 'For senior engineers transitioning to engineering management. Learn to multiply your impact through growing and leading teams.',
    careerPath: 'Management',
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    isFeatured: false,
    keyHighlights: [
      'People management fundamentals',
      'Team building and hiring',
      'Performance management',
      'Strategic planning and execution',
    ],
    targetRoles: ['Engineering Manager', 'Tech Lead Manager', 'Senior Engineering Manager', 'Director of Engineering'],
    planOverview: '12-week engineering management transition program',
    weeks: [
      { week: 1, title: 'Management Mindset', theme: 'foundation', goals: ['Understand IC vs manager role', 'Read management books', 'Assess readiness for transition'] },
      { week: 2, title: 'Leadership Assessment', theme: 'foundation', goals: ['Get 360 feedback', 'Identify leadership strengths', 'Create development plan'] },
      { week: 3, title: 'People Skills Foundation', theme: 'foundation', goals: ['Learn effective 1:1s', 'Practice giving feedback', 'Study coaching techniques'] },
      { week: 4, title: 'Team Dynamics', theme: 'skill_development', goals: ['Understand team formation', 'Learn conflict resolution', 'Practice facilitation'] },
      { week: 5, title: 'Hiring & Onboarding', theme: 'skill_development', goals: ['Learn interview techniques', 'Create hiring rubrics', 'Design onboarding plans'] },
      { week: 6, title: 'Performance Management', theme: 'skill_development', goals: ['Set team goals', 'Learn performance reviews', 'Practice difficult conversations'] },
      { week: 7, title: 'Manager Network', theme: 'networking', goals: ['Connect with engineering managers', 'Join management communities', 'Find mentor'] },
      { week: 8, title: 'Shadow & Learn', theme: 'networking', goals: ['Shadow current managers', 'Attend leadership meetings', 'Practice delegation'] },
      { week: 9, title: 'Management Portfolio', theme: 'networking', goals: ['Document leadership examples', 'Prepare management scenarios', 'Create leadership philosophy'] },
      { week: 10, title: 'Internal Opportunities', theme: 'job_search', goals: ['Express interest to leadership', 'Apply for internal roles', 'Prepare promotion case'] },
      { week: 11, title: 'External Search', theme: 'job_search', goals: ['Apply to EM roles', 'Practice management interviews', 'Prepare people scenarios'] },
      { week: 12, title: 'Transition Planning', theme: 'job_search', goals: ['Negotiate role transition', 'Plan team handoff', 'Set 90-day goals'] },
    ],
  },
];

const themeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  foundation: { label: 'Foundation', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  skill_development: { label: 'Skill Development', color: 'text-green-700', bgColor: 'bg-green-100' },
  networking: { label: 'Networking', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  job_search: { label: 'Job Search', color: 'text-orange-700', bgColor: 'bg-orange-100' },
};

const footerLinks = {
  Product: ['Features', 'Pricing', 'Templates', 'Resources'],
  Company: ['About', 'Contact'],
  Support: ['Privacy Policy', 'Terms & Conditions', 'Contact Us'],
};

export default function Templates() {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredTemplates = selectedFilter === 'all'
    ? templates
    : selectedFilter === 'featured'
    ? templates.filter(t => t.isFeatured)
    : templates.filter(t => t.careerPath.toLowerCase() === selectedFilter);

  const filters = [
    { value: 'all', label: 'All Templates' },
    { value: 'featured', label: 'Featured' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'product', label: 'Product' },
    { value: 'data', label: 'Data' },
    { value: 'management', label: 'Management' },
    { value: 'general', label: 'General' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="/images/logo.svg"
                alt="Career Playbook"
                className="h-10"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                to="/about"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-smooth"
              >
                About
              </Link>
              <Link
                to="/features"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-smooth"
              >
                Features
              </Link>
              <Link
                to="/templates"
                className="text-sm font-medium text-primary-600 transition-smooth"
              >
                Templates
              </Link>
              <Link
                to="/resources"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-smooth"
              >
                Resources
              </Link>
              {['Pricing', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`/#${item.toLowerCase()}`}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-smooth"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-smooth"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-pill shadow-button hover:bg-primary-600 hover:shadow-button-hover transition-smooth"
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-purple-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-pill mb-6">
              <Target className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-600">
                Career Plan Templates
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Proven Career Plans for Every Path
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Choose from our expertly crafted 90-day career plans designed for different career transitions and growth paths. Each template includes week-by-week milestones to guide your journey.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-primary-500" />
                <span>12-Week Plans</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Actionable Goals</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span>Proven Framework</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  selectedFilter === filter.value
                    ? 'bg-primary-500 text-white shadow-button'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {filteredTemplates.map((template) => {
              const Icon = template.icon;
              const isExpanded = expandedTemplate === template.id;

              return (
                <div
                  key={template.id}
                  className={`bg-white rounded-2xl border ${template.borderColor} overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'shadow-xl' : 'shadow-card hover:shadow-card-hover'
                  }`}
                >
                  {/* Template Header */}
                  <div className="p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Icon */}
                      <div className={`w-16 h-16 ${template.bgColor} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-8 h-8 ${template.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="font-display text-xl lg:text-2xl font-bold text-gray-900">
                            {template.name}
                          </h3>
                          {template.isFeatured && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                              Featured
                            </span>
                          )}
                          <span className={`px-3 py-1 ${template.bgColor} ${template.color} text-xs font-medium rounded-full`}>
                            {template.careerPath}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-4 lg:mb-6">
                          {template.description}
                        </p>

                        {/* Key Highlights */}
                        <div className="grid sm:grid-cols-2 gap-2 mb-4">
                          {template.keyHighlights.map((highlight, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className={`w-4 h-4 ${template.color} flex-shrink-0`} />
                              <span className="text-sm text-gray-700">{highlight}</span>
                            </div>
                          ))}
                        </div>

                        {/* Target Roles */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {template.targetRoles.map((role, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
                            >
                              <Briefcase className="w-3 h-3" />
                              {role}
                            </span>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 border-2 ${template.borderColor} ${template.color} font-medium rounded-xl hover:${template.bgColor} transition-smooth`}
                          >
                            {isExpanded ? (
                              <>
                                Hide 12-Week Plan
                                <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                View 12-Week Plan
                                <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                          <Link
                            to="/signup"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-smooth"
                          >
                            Use This Template
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded 12-Week Plan */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-6 lg:p-8">
                      <div className="mb-6">
                        <h4 className="font-display text-lg font-semibold text-gray-900 mb-2">
                          {template.planOverview}
                        </h4>
                        <div className="flex flex-wrap gap-4">
                          {Object.entries(themeConfig).map(([key, config]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${config.bgColor}`} />
                              <span className="text-sm text-gray-600">{config.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timeline Grid */}
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Month 1 */}
                        <div>
                          <h5 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Weeks 1-4
                          </h5>
                          <div className="space-y-3">
                            {template.weeks.slice(0, 4).map((week) => (
                              <WeekCard key={week.week} week={week} />
                            ))}
                          </div>
                        </div>

                        {/* Month 2 */}
                        <div>
                          <h5 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Weeks 5-8
                          </h5>
                          <div className="space-y-3">
                            {template.weeks.slice(4, 8).map((week) => (
                              <WeekCard key={week.week} week={week} />
                            ))}
                          </div>
                        </div>

                        {/* Month 3 */}
                        <div>
                          <h5 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Weeks 9-12
                          </h5>
                          <div className="space-y-3">
                            {template.weeks.slice(8, 12).map((week) => (
                              <WeekCard key={week.week} week={week} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* CTA at bottom of expanded section */}
                      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                        <p className="text-gray-600 mb-4">
                          Ready to start your {template.name.toLowerCase()} journey?
                        </p>
                        <Link
                          to="/signup"
                          className="inline-flex items-center gap-2 px-8 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-smooth"
                        >
                          Get Started with This Template
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="section-label justify-center mb-4">How It Works</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Start Your Career Plan in 3 Steps
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose a template, customize it to your goals, and track your progress week by week
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Choose Your Template',
                description: 'Select a career plan template that matches your career goals and transition path.',
                icon: Target,
              },
              {
                step: '2',
                title: 'Customize Your Plan',
                description: 'Tailor the 12-week milestones to your specific situation, timeline, and objectives.',
                icon: BookOpen,
              },
              {
                step: '3',
                title: 'Track Your Progress',
                description: 'Follow your weekly goals, mark milestones complete, and watch your career transform.',
                icon: CheckCircle,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-button">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-semibold text-primary-600 mb-2">Step {item.step}</div>
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/bottom-img1.webp"
            alt="Career community"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/70" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of professionals using our proven 90-day career plans to achieve their goals.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-pill hover:bg-gray-100 transition-smooth"
          >
            Start Your Free Plan
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center mb-4">
                <img
                  src="/images/logo.svg"
                  alt="Career Playbook"
                  className="h-10 brightness-0 invert"
                />
              </Link>
              <p className="text-gray-400 mb-6 max-w-sm">
                Plan your career, achieve your goals with AI-powered guidance.
                Empowering professionals to achieve their career goals.
              </p>
              {/* Social Icons */}
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

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="font-display font-semibold text-white mb-4">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-smooth"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2025 Ragid Kader. Creator of Smart Career Planner | Beyond Your
              Career. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-300 transition-smooth"
              >
                Terms and Conditions
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-300 transition-smooth"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Week Card Component
function WeekCard({ week }: { week: TemplateWeek }) {
  const theme = themeConfig[week.theme] || themeConfig.foundation;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900">Week {week.week}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${theme.bgColor} ${theme.color}`}>
          {theme.label}
        </span>
      </div>
      <h6 className="font-medium text-gray-800 text-sm mb-2">{week.title}</h6>
      <ul className="space-y-1">
        {week.goals.map((goal, index) => (
          <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
            <CheckCircle className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>{goal}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
