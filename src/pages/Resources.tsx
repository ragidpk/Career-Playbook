import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  Video,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  MapPin,
  Target,
  DollarSign,
  Monitor,
  Globe,
  FileSpreadsheet,
  GraduationCap,
} from 'lucide-react';

const resumeTemplates = [
  {
    title: 'Professional Resume Template',
    description: 'Clean, modern resume template suitable for most industries',
    type: 'DOCX',
  },
  {
    title: 'Creative Resume Template',
    description: 'Eye-catching design for creative professionals',
    type: 'DOCX',
  },
  {
    title: 'Technical Resume Template',
    description: 'Optimized for developers and technical roles',
    type: 'DOCX',
  },
  {
    title: 'Executive Resume Template',
    description: 'Professional template for senior leadership positions',
    type: 'DOCX',
  },
];

const interviewGuides = [
  {
    icon: Target,
    title: 'STAR Method Interview Guide',
    description: 'Master the STAR (Situation, Task, Action, Result) technique for behavioral interviews',
    tags: ['Behavioral Questions', 'Story Preparation', 'Example Answers'],
  },
  {
    icon: Monitor,
    title: 'Technical Interview Preparation',
    description: 'Comprehensive guide for coding interviews and technical assessments',
    tags: ['Data Structures', 'Algorithms', 'System Design'],
  },
  {
    icon: DollarSign,
    title: 'Salary Negotiation Guide',
    description: 'Learn how to negotiate your salary and benefits package effectively',
    tags: ['Market Research', 'Negotiation Tactics', 'Counter Offers'],
  },
  {
    icon: Video,
    title: 'Remote Interview Best Practices',
    description: 'Tips for succeeding in video interviews and virtual assessments',
    tags: ['Setup & Lighting', 'Body Language', 'Technical Checks'],
  },
];

const gccJobSites = [
  {
    name: 'Bayt.com',
    description: 'Leading job site in the Middle East with thousands of opportunities across GCC countries',
    countries: ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    url: 'https://www.bayt.com',
  },
  {
    name: 'GulfTalent',
    description: 'Specialized recruitment portal for experienced professionals in the Gulf',
    countries: ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    url: 'https://www.gulftalent.com',
  },
  {
    name: 'Naukrigulf',
    description: 'Popular job portal connecting candidates with employers in the GCC',
    countries: ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    url: 'https://www.naukrigulf.com',
  },
  {
    name: 'LinkedIn Jobs - GCC',
    description: 'Professional networking platform with extensive GCC job listings',
    countries: ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    url: 'https://www.linkedin.com/jobs',
  },
  {
    name: 'Dubai Jobs',
    description: 'Dedicated job board for opportunities in Dubai and UAE',
    countries: ['UAE'],
    url: 'https://www.dubaijobs.net',
  },
  {
    name: 'Jobseekers.qa',
    description: "Qatar's premier job portal for local and international candidates",
    countries: ['Qatar'],
    url: 'https://www.jobseekers.qa',
  },
];

const additionalResources = [
  {
    icon: BookOpen,
    title: 'Career Planning Guides',
    description: 'Step-by-step guides for mapping your career path and setting achievable goals.',
    color: 'bg-primary-500',
  },
  {
    icon: FileSpreadsheet,
    title: 'Worksheets & Templates',
    description: 'Downloadable worksheets for self-assessment, goal setting, and progress tracking.',
    color: 'bg-teal-500',
  },
  {
    icon: GraduationCap,
    title: 'Industry Insights',
    description: 'Reports and articles on industry trends, salary benchmarks, and market analysis.',
    color: 'bg-amber-500',
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    description: 'Watch expert-led tutorials on resume writing, interviewing, and career development.',
    color: 'bg-pink-500',
  },
];

const footerLinks = {
  Product: ['Features', 'Pricing', 'Templates', 'Resources'],
  Company: ['About', 'Contact'],
  Support: ['Privacy Policy', 'Terms & Conditions', 'Contact Us'],
};

export default function Resources() {
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
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-smooth"
              >
                Templates
              </Link>
              <Link
                to="/resources"
                className="text-sm font-medium text-primary-600 transition-smooth"
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-teal-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-pill mb-6">
              <BookOpen className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-600">
                Free Resources
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Career Resources
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Access free resume templates, interview guides, and GCC job opportunities to accelerate your career growth
            </p>
          </div>
        </div>
      </section>

      {/* Resume Templates Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="section-label mb-4">Resume Templates</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Free Professional Resume Templates
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Download our professionally designed resume templates to help you stand out from the competition
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {resumeTemplates.map((template) => (
              <div
                key={template.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-card-hover hover:border-gray-200 transition-smooth group"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
                  {template.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {template.type}
                  </span>
                  <button className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-smooth">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview Guides Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="section-label mb-4">Interview Guides</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Master Your Interviews
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Expert guidance to help you prepare for and ace your interviews
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {interviewGuides.map((guide) => (
              <div
                key={guide.title}
                className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-smooth"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <guide.icon className="w-6 h-6 text-teal-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {guide.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {guide.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-smooth">
                      Access Guide
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Resources Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="section-label justify-center mb-4">More Resources</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Additional Career Resources
            </h2>
            <p className="text-lg text-gray-600">
              Explore more tools and guides to support your career journey
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalResources.map((resource) => (
              <div
                key={resource.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-card-hover hover:border-gray-200 transition-smooth"
              >
                <div
                  className={`w-14 h-14 ${resource.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-button`}
                >
                  <resource.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {resource.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GCC Job Openings Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="section-label mb-4">GCC Job Openings</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Explore Opportunities Across the Gulf
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Find your next career opportunity in the Gulf Cooperation Council countries
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gccJobSites.map((site) => (
              <div
                key={site.name}
                className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-smooth"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-amber-500" />
                  </div>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-smooth"
                  >
                    Visit Site
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
                  {site.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {site.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {site.countries.map((country) => (
                    <span
                      key={country}
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded"
                    >
                      <MapPin className="w-3 h-3" />
                      {country}
                    </span>
                  ))}
                </div>
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
            Ready to Take the Next Step?
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Create your personalized career plan and get AI-powered guidance today.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-pill hover:bg-gray-100 transition-smooth"
          >
            Go to Dashboard
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
