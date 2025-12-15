import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
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

export default function TermsOfService() {
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
              <FileText className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-600">
                Legal
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Terms & Conditions
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
              Agreement to Terms
            </h2>
            <p className="text-gray-600 mb-6">
              These Terms and Conditions ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and Career Playbook ("Company," "we," "our," or "us") governing your access to and use of the Career Playbook platform, including our website, applications, and services (collectively, the "Service").
            </p>
            <p className="text-gray-600 mb-8">
              By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the Service.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Eligibility
            </h2>
            <p className="text-gray-600 mb-8">
              You must be at least 16 years of age to use the Service. By using the Service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Account Registration
            </h2>
            <p className="text-gray-600 mb-4">
              To access certain features of the Service, you must create an account. When creating an account, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
            </ul>
            <p className="text-gray-600 mb-8">
              We reserve the right to suspend or terminate accounts that violate these Terms or contain false information.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Service Description
            </h2>
            <p className="text-gray-600 mb-4">
              Career Playbook provides a career development platform that includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
              <li>Career planning tools and 90-day plan builders</li>
              <li>Career Canvas self-assessment features</li>
              <li>AI-powered milestone generation and recommendations</li>
              <li>Resume analysis and ATS scoring</li>
              <li>Job application tracking (CRM)</li>
              <li>Mentor-mentee collaboration features</li>
              <li>Interview scheduling and preparation tools</li>
              <li>Progress tracking and analytics</li>
            </ul>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Acceptable Use
            </h2>
            <p className="text-gray-600 mb-4">
              You agree to use the Service only for lawful purposes. You shall not:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Upload false, misleading, or fraudulent content</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to transmit malware, spam, or harmful content</li>
              <li>Harvest or collect user information without consent</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use the Service to compete with Career Playbook</li>
            </ul>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              User Content
            </h2>
            <p className="text-gray-600 mb-4">
              You retain ownership of content you submit to the Service ("User Content"), including career plans, resumes, and personal information. By submitting User Content, you grant us a non-exclusive, worldwide, royalty-free license to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Store, process, and display your content to provide the Service</li>
              <li>Share content with mentors, collaborators, or others you authorize</li>
              <li>Use anonymized, aggregated data to improve our services</li>
            </ul>
            <p className="text-gray-600 mb-8">
              You are solely responsible for your User Content and represent that you have all necessary rights to submit it. We may remove content that violates these Terms.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              AI-Generated Content
            </h2>
            <p className="text-gray-600 mb-8">
              Our Service uses artificial intelligence to generate career milestones, recommendations, and insights. AI-generated content is provided for informational purposes only and should not be considered professional career advice. You acknowledge that AI outputs may not always be accurate or suitable for your specific situation, and you are responsible for evaluating and applying any AI-generated recommendations.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Mentor-Mentee Relationships
            </h2>
            <p className="text-gray-600 mb-8">
              The Service facilitates connections between mentors and mentees. Career Playbook does not endorse, verify, or guarantee the qualifications of any mentor. Mentors and mentees are solely responsible for their interactions and any advice exchanged. We are not liable for any outcomes resulting from mentor-mentee relationships established through the Service.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Intellectual Property
            </h2>
            <p className="text-gray-600 mb-8">
              The Service, including its design, features, content, trademarks, and technology, is owned by Career Playbook and protected by intellectual property laws. You may not copy, modify, distribute, sell, or create derivative works based on our intellectual property without express written permission. "Career Playbook," our logo, and related marks are trademarks of Career Playbook.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Third-Party Services
            </h2>
            <p className="text-gray-600 mb-8">
              The Service may integrate with or link to third-party services (such as authentication providers, AI services, or analytics tools). These third-party services are governed by their own terms and privacy policies. We are not responsible for the content, functionality, or practices of third-party services.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Subscription and Payment
            </h2>
            <p className="text-gray-600 mb-4">
              Certain features may require a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
              <li>Pay all applicable fees as described at the time of purchase</li>
              <li>Provide accurate billing information</li>
              <li>Authorize recurring charges for subscription renewals</li>
              <li>Cancel before the renewal date to avoid future charges</li>
            </ul>
            <p className="text-gray-600 mb-8">
              We reserve the right to change pricing with reasonable notice. Refunds are provided in accordance with our refund policy.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Disclaimer of Warranties
            </h2>
            <p className="text-gray-600 mb-8">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. CAREER ADVICE AND AI-GENERATED CONTENT ARE NOT SUBSTITUTES FOR PROFESSIONAL GUIDANCE.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Limitation of Liability
            </h2>
            <p className="text-gray-600 mb-8">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAREER PLAYBOOK AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Indemnification
            </h2>
            <p className="text-gray-600 mb-8">
              You agree to indemnify, defend, and hold harmless Career Playbook and its affiliates from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Termination
            </h2>
            <p className="text-gray-600 mb-8">
              We may suspend or terminate your access to the Service at any time, with or without cause, and with or without notice. You may terminate your account at any time through your account settings. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive termination will remain in effect.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Modifications to Terms
            </h2>
            <p className="text-gray-600 mb-8">
              We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use of the Service after changes take effect constitutes acceptance of the modified Terms. If you do not agree to the changes, you must stop using the Service.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Governing Law
            </h2>
            <p className="text-gray-600 mb-8">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Career Playbook operates, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be resolved in the courts of that jurisdiction.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Severability
            </h2>
            <p className="text-gray-600 mb-8">
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Entire Agreement
            </h2>
            <p className="text-gray-600 mb-8">
              These Terms, together with our Privacy Policy and any other policies referenced herein, constitute the entire agreement between you and Career Playbook regarding the Service and supersede all prior agreements and understandings.
            </p>

            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 mb-4">
              If you have questions about these Terms, please contact us at:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <p className="text-gray-600">
                <strong>Career Playbook</strong><br />
                Email: legal@careerplaybook.app<br />
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
                        to={
                          link === 'Privacy Policy' ? '/PrivacyPolicy' :
                          link === 'Terms & Conditions' ? '/terms_of_service' :
                          link === 'About' ? '/about' : '#'
                        }
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
              <Link
                to="/terms_of_service"
                className="text-sm text-gray-500 hover:text-gray-300 transition-smooth"
              >
                Terms and Conditions
              </Link>
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
