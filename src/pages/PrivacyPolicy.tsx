import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
} from 'lucide-react';

const footerLinks = {
  Product: ['Features', 'Pricing', 'Templates', 'Resources'],
  Company: ['About', 'Contact'],
  Support: ['Privacy Policy', 'Terms & Conditions', 'Contact Us'],
};

export default function PrivacyPolicy() {
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
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-smooth"
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-pill mb-6">
              <Shield className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-600">
                Legal
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Privacy Policy
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed">
              Last updated: December 15, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Introduction
            </h2>
            <p className="text-gray-600 mb-6">
              Career Playbook ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our career development platform and services.
            </p>
            <p className="text-gray-600 mb-8">
              By accessing or using Career Playbook, you agree to this Privacy Policy. If you do not agree with our policies and practices, please do not use our services.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Information We Collect
            </h2>

            <h3 className="font-display text-xl font-semibold text-gray-900 mb-3">
              Personal Information
            </h3>
            <p className="text-gray-600 mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Account information (name, email address, password)</li>
              <li>Profile information (professional background, career goals, skills)</li>
              <li>Resume and career documents you upload</li>
              <li>Career plans, milestones, and progress data</li>
              <li>Communication preferences</li>
              <li>Mentor and mentee relationship information</li>
              <li>Job application tracking data</li>
            </ul>

            <h3 className="font-display text-xl font-semibold text-gray-900 mb-3">
              Automatically Collected Information
            </h3>
            <p className="text-gray-600 mb-4">
              When you use our platform, we automatically collect:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
              <li>Device information (browser type, operating system)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>IP address and general location data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              How We Use Your Information
            </h2>
            <p className="text-gray-600 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Create and manage your account</li>
              <li>Generate AI-powered career recommendations and milestones</li>
              <li>Analyze resumes and provide career insights</li>
              <li>Facilitate mentor-mentee connections</li>
              <li>Send notifications about your career plans and sessions</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Monitor and analyze usage trends to improve user experience</li>
              <li>Protect against fraud and unauthorized access</li>
            </ul>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Information Sharing
            </h2>
            <p className="text-gray-600 mb-4">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
              <li><strong>With Mentors/Mentees:</strong> When you establish a mentor-mentee relationship, relevant career plan information is shared with your mentor or mentee as configured by you.</li>
              <li><strong>With Collaborators:</strong> When you invite collaborators to view or edit your career plans.</li>
              <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform (hosting, analytics, AI processing).</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
            </ul>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Data Security
            </h2>
            <p className="text-gray-600 mb-8">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, regular security assessments, and access controls. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Your Rights and Choices
            </h2>
            <p className="text-gray-600 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
              <li>Access, update, or delete your personal information</li>
              <li>Export your career data in a portable format</li>
              <li>Opt-out of promotional communications</li>
              <li>Request restriction of processing</li>
              <li>Withdraw consent where applicable</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
            <p className="text-gray-600 mb-8">
              To exercise these rights, please contact us at privacy@careerplaybook.app or through your account settings.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Cookies and Tracking
            </h2>
            <p className="text-gray-600 mb-8">
              We use cookies and similar technologies to enhance your experience, analyze usage, and personalize content. You can manage cookie preferences through your browser settings. Essential cookies are required for the platform to function properly.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Data Retention
            </h2>
            <p className="text-gray-600 mb-8">
              We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time. Some information may be retained for legal, accounting, or security purposes.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Third-Party Services
            </h2>
            <p className="text-gray-600 mb-8">
              Our platform integrates with third-party services including Supabase (authentication and database), OpenAI (AI-powered features), and analytics providers. These services have their own privacy policies governing their use of your information.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Children's Privacy
            </h2>
            <p className="text-gray-600 mb-8">
              Career Playbook is not intended for users under 16 years of age. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete the information.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              International Data Transfers
            </h2>
            <p className="text-gray-600 mb-8">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Changes to This Policy
            </h2>
            <p className="text-gray-600 mb-8">
              We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a notice on our platform. Your continued use of Career Playbook after changes constitutes acceptance of the updated policy.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <p className="text-gray-600">
                <strong>Career Playbook</strong><br />
                Email: privacy@careerplaybook.app<br />
                Website: https://careerplaybook.app
              </p>
            </div>
          </div>
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
                      <Link
                        to={link === 'Privacy Policy' ? '/PrivacyPolicy' : link === 'About' ? '/about' : '#'}
                        className="text-gray-400 hover:text-white transition-smooth"
                      >
                        {link}
                      </Link>
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
              <Link
                to="/PrivacyPolicy"
                className="text-sm text-gray-500 hover:text-gray-300 transition-smooth"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
