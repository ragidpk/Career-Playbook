import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Target,
  Users,
  Sparkles,
  HandHeart,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  CheckCircle,
  Calendar,
  TrendingUp,
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Structured Career Planning',
    description:
      'Create comprehensive 52-week career roadmaps with AI-generated milestones tailored to your unique goals and circumstances. Our Career Plans framework helps you visualize and plan every aspect of your professional development.',
    color: 'bg-primary-500',
  },
  {
    icon: Users,
    title: 'Expert Mentorship',
    description:
      'Connect with experienced professionals who have walked the path you\'re on. Our mentors provide personalized guidance, industry insights, and practical advice to help you navigate challenges and seize opportunities.',
    color: 'bg-teal-500',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Insights',
    description:
      'Leverage advanced AI to generate personalized career milestones, analyze your resume, and receive smart recommendations. Our technology learns from successful career paths to help you make informed decisions.',
    color: 'bg-amber-500',
  },
  {
    icon: HandHeart,
    title: 'Accountability & Collaboration',
    description:
      'Stay on track with accountability partners and collaborative features. Share your plans, celebrate milestones together, and maintain momentum through regular check-ins and mutual support.',
    color: 'bg-pink-500',
  },
];

const values = [
  {
    title: 'Accessibility',
    description: 'Career development tools should be available to everyone, regardless of background or resources.',
  },
  {
    title: 'Innovation',
    description: 'We continuously improve our platform with cutting-edge AI and user-centered design.',
  },
  {
    title: 'Community',
    description: 'Success is better when shared. We foster connections between professionals at all stages.',
  },
  {
    title: 'Empowerment',
    description: 'We give you the tools and insights to take control of your career journey.',
  },
];

const footerLinks = {
  Product: ['Features', 'Pricing', 'Templates', 'Resources'],
  Company: ['About', 'Contact'],
  Support: ['Privacy Policy', 'Terms & Conditions', 'Contact Us'],
};

export default function About() {
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
                  <Link
                    key={item}
                    to={item === 'About' ? '/about' : `/#${item.toLowerCase()}`}
                    className={`text-sm font-medium transition-smooth ${
                      item === 'About'
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item}
                  </Link>
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-teal-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-pill mb-6">
              <Target className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-600">
                About Us
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              About Career Playbook
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              A comprehensive platform designed to help professionals plan, execute, and accelerate their career growth through AI-powered guidance, expert mentorship, and collaborative support.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="section-label mb-4">Our Mission</div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Democratizing Career Development
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  We believe that everyone deserves access to the tools, guidance, and support needed to achieve their career aspirations. Our mission is to democratize career development by providing a platform that combines cutting-edge AI technology with human expertise.
                </p>
                <p>
                  Whether you're just starting your career journey, looking to make a transition, or aiming for the next level, Career Playbook provides the structure, accountability, and insights you need to succeed.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-gray-100">
                <div>
                  <p className="font-display text-3xl font-bold text-primary-500">5K+</p>
                  <p className="text-sm text-gray-500 mt-1">Active Users</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-primary-500">10K+</p>
                  <p className="text-sm text-gray-500 mt-1">Goals Achieved</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-primary-500">95%</p>
                  <p className="text-sm text-gray-500 mt-1">Success Rate</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-teal-100 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-primary-500 rounded-3xl flex items-center justify-center shadow-elevated">
                    <TrendingUp className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>

              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-elevated p-5 hidden lg:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success-500" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-bold text-gray-900">52-Week</p>
                    <p className="text-sm text-gray-500">Career Roadmaps</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="section-label justify-center mb-4">What We Offer</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600">
              Powerful tools and expert support to plan, execute, and accelerate your career growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-smooth"
              >
                <div
                  className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-button`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="section-label justify-center mb-4">Our Values</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Drives Us
            </h2>
            <p className="text-lg text-gray-600">
              The principles that guide everything we do at Career Playbook
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="text-center p-6"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="font-display text-xl font-bold text-primary-500">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="section-label justify-center mb-4">The Creator</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Meet Ragid Kader
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Career Playbook was created by Ragid Kader, the mind behind Smart Career Planner and Beyond Your Career. With a passion for helping professionals reach their full potential, Ragid built this platform to make career development accessible, structured, and achievable for everyone.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-200 hover:bg-primary-500 hover:text-white rounded-xl flex items-center justify-center transition-smooth text-gray-600"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-200 hover:bg-primary-500 hover:text-white rounded-xl flex items-center justify-center transition-smooth text-gray-600"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
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
            Join thousands of professionals who are taking control of their career development.
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
