import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Send,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../services/supabase';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email',
    value: 'hello@careerplaybook.app',
    href: 'mailto:hello@careerplaybook.app',
  },
  {
    icon: Phone,
    title: 'Phone',
    value: '+971 50 123 4567',
    href: 'tel:+971501234567',
  },
  {
    icon: MapPin,
    title: 'Location',
    value: 'Dubai, UAE',
    href: null,
  },
];

const faqs = [
  {
    question: 'How do I get started with Career Playbook?',
    answer: 'Simply sign up for a free account and complete the onboarding process. You can start creating your career plan immediately and explore all the features available to you.',
  },
  {
    question: 'Is Career Playbook free to use?',
    answer: 'Yes! Career Playbook offers a free tier that includes essential features like career planning, milestone tracking, and basic AI assistance. Premium features are available for subscribers.',
  },
  {
    question: 'How does the mentorship feature work?',
    answer: 'You can invite mentors to view your career plans and provide feedback. Mentors can leave comments on your milestones, schedule sessions, and guide you through your career journey.',
  },
  {
    question: 'Can I export my career plan?',
    answer: 'Yes, you can export your career plans and progress reports in PDF format. This is useful for sharing with mentors, coaches, or potential employers.',
  },
  {
    question: 'How does the AI generate milestones?',
    answer: 'Our AI analyzes your career goals, current skills, and industry trends to generate personalized milestones. You can customize these suggestions to fit your specific needs and timeline.',
  },
];

const footerLinks = {
  Product: ['Features', 'Pricing', 'Templates', 'Resources'],
  Company: ['About', 'Contact'],
  Support: ['Privacy Policy', 'Terms & Conditions', 'Contact Us'],
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await (supabase as any)
        .from('contact_submissions')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        });

      if (submitError) throw submitError;

      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center">
              <img
                src="/images/logo.svg"
                alt="Career Playbook"
                className="h-10"
              />
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {['About', 'Features', 'Templates', 'Resources', 'Pricing', 'Contact'].map(
                (item) => (
                  <Link
                    key={item}
                    to={
                      ['About', 'Features', 'Templates', 'Resources', 'Contact'].includes(item)
                        ? `/${item.toLowerCase()}`
                        : `/#${item.toLowerCase()}`
                    }
                    className={`text-sm font-medium transition-smooth ${
                      item === 'Contact'
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item}
                  </Link>
                )
              )}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="inline-flex px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-smooth"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:gap-2 sm:px-5 sm:py-2.5 bg-primary-500 text-white text-xs sm:text-sm font-medium rounded-pill shadow-button hover:bg-primary-600 hover:shadow-button-hover transition-smooth"
              >
                <span className="sm:hidden">Start Free</span>
                <span className="hidden sm:inline">Get Started Free</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-teal-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-pill mb-6">
              <MessageCircle className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-600">
                Get In Touch
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Contact Us
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Have questions or feedback? We'd love to hear from you. Reach out and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Form */}
            <div className="bg-gray-50 rounded-3xl p-8 lg:p-10">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
                Send us a message
              </h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we'll respond within 24 hours.
              </p>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success-500" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out. We'll get back to you soon.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-primary-500 font-medium hover:text-primary-600 transition-smooth"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-smooth"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-smooth"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-smooth"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-smooth resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-500 text-white font-semibold rounded-xl shadow-button hover:bg-primary-600 hover:shadow-button-hover transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Info & Social */}
            <div className="space-y-10">
              {/* Contact Info */}
              <div>
                <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {contactInfo.map((info) => (
                    <div
                      key={info.title}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-6 h-6 text-primary-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{info.title}</p>
                        {info.href ? (
                          <a
                            href={info.href}
                            className="font-medium text-gray-900 hover:text-primary-500 transition-smooth"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="font-medium text-gray-900">{info.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                  Follow Us
                </h2>
                <p className="text-gray-600 mb-4">
                  Stay connected and follow our journey on social media.
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { icon: Instagram, href: '#', label: 'Instagram' },
                    { icon: Facebook, href: '#', label: 'Facebook' },
                    { icon: Twitter, href: '#', label: 'Twitter' },
                    { icon: Linkedin, href: '#', label: 'LinkedIn' },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="w-12 h-12 bg-gray-100 hover:bg-primary-500 rounded-xl flex items-center justify-center transition-smooth group"
                    >
                      <social.icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-smooth" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Office Hours */}
              <div className="bg-primary-50 rounded-2xl p-6">
                <h3 className="font-display text-lg font-semibold text-gray-900 mb-3">
                  Office Hours
                </h3>
                <div className="space-y-2 text-gray-600">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM (GST)</p>
                  <p>Saturday - Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Find quick answers to common questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-medium text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
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
            Ready to Start Your Journey?
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
