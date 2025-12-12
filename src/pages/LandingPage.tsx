import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Target,
  Users,
  Sparkles,
  Calendar,
  FileText,
  Heart,
  Check,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Play,
} from 'lucide-react';
import HeroCarousel from '../components/landing/HeroCarousel';

const features = [
  {
    icon: Target,
    title: 'Career Planning',
    description:
      'Create comprehensive career roadmaps with AI-generated milestones tailored to your goals.',
    color: 'bg-primary-500',
    items: ['Custom career plans', 'Weekly milestones', 'Progress tracking'],
  },
  {
    icon: Users,
    title: 'Expert Mentorship',
    description:
      'Connect with experienced professionals who can guide you through your career journey.',
    color: 'bg-teal-500',
    items: ['Browse mentors', 'Book sessions', '1-on-1 guidance'],
  },
  {
    icon: Sparkles,
    title: 'AI Assistance',
    description:
      'Leverage AI to generate personalized milestones and get smart recommendations.',
    color: 'bg-amber-500',
    items: ['Smart milestones', 'Personalized advice', 'Goal optimization'],
  },
  {
    icon: Calendar,
    title: 'Session Scheduling',
    description:
      'Easily schedule and manage mentorship sessions that fit your calendar.',
    color: 'bg-pink-500',
    items: ['Calendar integration', 'Automated reminders', 'Session tracking'],
  },
  {
    icon: FileText,
    title: 'Career Templates',
    description:
      'Start fast with proven career path templates for various professions.',
    color: 'bg-yellow-500',
    items: ['Pre-built paths', 'Industry best practices', 'Customizable'],
  },
  {
    icon: Heart,
    title: 'Accountability Partners',
    description:
      'Collaborate with partners who keep you on track and motivated.',
    color: 'bg-orange-500',
    items: ['Progress sharing', 'Regular check-ins', 'Mutual support'],
  },
];

const footerLinks = {
  Product: ['Features', 'Pricing', 'Templates', 'Resources'],
  Company: ['About', 'Books', 'Contact'],
  Support: ['Privacy Policy', 'Terms & Conditions', 'Contact Us'],
};

export default function LandingPage() {
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
              {['About', 'Features', 'Resources', 'Pricing', 'Contact'].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-smooth"
                  >
                    {item}
                  </a>
                )
              )}
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
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-teal-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-100/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-pill mb-6">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-medium text-primary-600">
                  AI-Powered Career Development
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Plan Your Career.{' '}
                <span className="text-primary-500">Achieve Your Goals.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Build personalized career roadmaps, connect with mentors, and
                track your progress with AI-powered guidance every step of the
                way.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-semibold rounded-pill shadow-button hover:bg-primary-600 hover:shadow-button-hover transition-smooth"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 font-semibold rounded-pill border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-smooth"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-4">
                  Trusted by professionals at
                </p>
                <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                  <span className="font-display font-bold text-lg text-gray-400 hover:text-gray-600 transition-smooth">
                    NYUAD
                  </span>
                  <span className="font-display font-bold text-lg text-gray-400 hover:text-gray-600 transition-smooth">
                    Al Futtaim
                  </span>
                  <span className="font-display font-bold text-lg text-gray-400 hover:text-gray-600 transition-smooth">
                    BUiD
                  </span>
                  <span className="font-display font-bold text-lg text-gray-400 hover:text-gray-600 transition-smooth">
                    MAF
                  </span>
                </div>
              </div>
            </div>

            {/* Right - Hero Image Carousel */}
            <div className="relative">
              <HeroCarousel />

              {/* Floating stats card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-elevated p-5 hidden lg:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-success-500" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-gray-900">
                      10K+
                    </p>
                    <p className="text-sm text-gray-500">Goals Achieved</p>
                  </div>
                </div>
              </div>

              {/* Floating users card */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-elevated p-5 hidden lg:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-gray-900">
                      5K+
                    </p>
                    <p className="text-sm text-gray-500">Active Users</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600">
              Powerful tools to plan, execute, and accelerate your career growth
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 hover:shadow-card-hover hover:border-gray-200 transition-smooth"
              >
                {/* Icon */}
                <div
                  className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-5 shadow-button`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-5 leading-relaxed">
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

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '10,000+', label: 'Career Goals Set' },
              { value: '5,000+', label: 'Active Users' },
              { value: '500+', label: 'Expert Mentors' },
              { value: '95%', label: 'Success Rate' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl lg:text-4xl font-bold text-primary-500 mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Background Image */}
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
            Join a Community of Growth
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Connect with mentors, accountability partners, and fellow career
            seekers on the same journey towards professional excellence.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-pill hover:bg-gray-100 transition-smooth"
          >
            Join Our Community
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
