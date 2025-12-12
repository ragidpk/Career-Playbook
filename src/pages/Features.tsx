import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Target,
  Users,
  Sparkles,
  Calendar,
  FileText,
  HandHeart,
  Briefcase,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Check,
  Zap,
  BarChart3,
  Brain,
  Building2,
  MessageSquare,
  ClipboardCheck,
} from 'lucide-react';

const mainFeatures = [
  {
    icon: Target,
    title: 'Career Planning',
    description:
      'Create comprehensive 52-week career roadmaps with AI-generated milestones tailored to your goals.',
    color: 'bg-primary-500',
    items: ['Custom career plans', 'Weekly milestones', 'Progress tracking', 'Goal optimization'],
  },
  {
    icon: Users,
    title: 'Expert Mentorship',
    description:
      'Connect with experienced professionals who can guide you through your career journey.',
    color: 'bg-teal-500',
    items: ['Browse mentors', 'Book sessions', '1-on-1 guidance', 'Industry insights'],
  },
  {
    icon: Sparkles,
    title: 'AI Assistance',
    description:
      'Leverage AI to generate personalized milestones and get smart recommendations.',
    color: 'bg-amber-500',
    items: ['Smart milestones', 'Personalized advice', 'Goal optimization', 'Career insights'],
  },
  {
    icon: Calendar,
    title: 'Session Scheduling',
    description:
      'Easily schedule and manage mentorship sessions that fit your calendar.',
    color: 'bg-pink-500',
    items: ['Calendar integration', 'Automated reminders', 'Session tracking', 'Easy rescheduling'],
  },
  {
    icon: FileText,
    title: 'Career Templates',
    description:
      'Start fast with proven career path templates for various professions.',
    color: 'bg-indigo-500',
    items: ['Pre-built paths', 'Industry best practices', 'Customizable', 'Proven frameworks'],
  },
  {
    icon: HandHeart,
    title: 'Accountability Partners',
    description:
      'Collaborate with partners who keep you on track and motivated.',
    color: 'bg-orange-500',
    items: ['Progress sharing', 'Regular check-ins', 'Mutual support', 'Goal tracking'],
  },
];

const additionalFeatures = [
  {
    icon: Brain,
    title: 'Career Canvas',
    description: '9-section self-assessment framework to visualize every aspect of your professional development.',
  },
  {
    icon: ClipboardCheck,
    title: '90-Day Plan Builder',
    description: 'Break down your goals into 12-week actionable milestones with drag-and-drop organization.',
  },
  {
    icon: BarChart3,
    title: 'Resume Analysis',
    description: 'AI-powered resume review with actionable feedback to improve your job applications.',
  },
  {
    icon: Briefcase,
    title: 'Job Board',
    description: 'Curated job listings matched to your skills, experience, and career goals.',
  },
  {
    icon: Building2,
    title: 'Job Hunt CRM',
    description: 'Track applications, manage company contacts, and monitor your job search pipeline.',
  },
  {
    icon: MessageSquare,
    title: 'Interview Prep',
    description: 'Practice common questions, get AI feedback, and build confidence for your interviews.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Create Your Plan',
    description: 'Start with a template or build a custom career roadmap tailored to your unique goals and aspirations.',
    color: 'bg-primary-500',
  },
  {
    number: '2',
    title: 'Connect & Learn',
    description: 'Find mentors, book sessions, and get personalized guidance from experienced professionals in your field.',
    color: 'bg-teal-500',
  },
  {
    number: '3',
    title: 'Track & Achieve',
    description: 'Monitor your progress, complete milestones, and celebrate achievements as you advance toward your goals.',
    color: 'bg-amber-500',
  },
];

const footerLinks = {
  Product: ['Features', 'Pricing', 'Templates', 'Resources'],
  Company: ['About', 'Contact'],
  Support: ['Privacy Policy', 'Terms & Conditions', 'Contact Us'],
};

export default function Features() {
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
                className="text-sm font-medium text-primary-600 transition-smooth"
              >
                Features
              </Link>
              {['Resources', 'Pricing', 'Contact'].map((item) => (
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
              <Zap className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-600">
                Powerful Features
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Everything You Need to{' '}
              <span className="text-primary-500">Succeed</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Powerful features designed to help you plan, execute, and accelerate your career growth with AI-powered guidance and expert support.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="section-label justify-center mb-4">Core Features</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tools That Drive Results
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to plan, execute, and achieve your career goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-card-hover hover:border-gray-200 transition-smooth"
              >
                {/* Icon */}
                <div
                  className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-button`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                {/* Checklist */}
                <ul className="space-y-2.5">
                  {feature.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 bg-success-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-success-500" />
                      </div>
                      <span className="text-sm text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="section-label justify-center mb-4">More Features</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built for Career Success
            </h2>
            <p className="text-lg text-gray-600">
              Additional tools to supercharge your career journey
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-smooth"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="section-label justify-center mb-4">How It Works</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Three Simple Steps
            </h2>
            <p className="text-lg text-gray-600">
              Get started in minutes and begin your journey to career success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gray-200" />
                )}

                <div className="relative text-center">
                  {/* Number */}
                  <div
                    className={`w-20 h-20 ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-elevated`}
                  >
                    <span className="font-display text-3xl font-bold text-white">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
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
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of professionals using Career Playbook to achieve their goals.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-pill hover:bg-gray-100 transition-smooth"
          >
            Get Started Free
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
