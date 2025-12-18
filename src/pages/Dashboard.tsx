import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  FileText,
  Upload,
  Building2,
  Briefcase,
  Calendar,
  Users,
  ArrowRight,
  AlertCircle,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';

const REMINDER_DISMISSED_KEY = 'career_playbook_profile_reminder_dismissed';

const quickActions = [
  {
    title: 'Your Career Plans',
    description: 'Define your career value proposition',
    icon: Target,
    path: '/canvas',
    cta: 'Get Started',
  },
  {
    title: '12 Weeks Plan',
    description: 'Build your structured career plan',
    icon: FileText,
    path: '/plan',
    cta: 'Create Plan',
  },
  {
    title: 'Resume Analysis',
    description: 'Get AI-powered ATS scoring',
    icon: Upload,
    path: '/resume',
    cta: 'Upload Resume',
  },
  {
    title: 'Job Hunt CRM',
    description: 'Track companies, contacts, and opportunities',
    icon: Building2,
    path: '/crm',
    cta: 'Manage CRM',
  },
  {
    title: 'Job Board',
    description: 'Track job applications and opportunities',
    icon: Briefcase,
    path: '/jobs',
    cta: 'View Jobs',
  },
  {
    title: 'Interview Prep',
    description: 'Track interviews and prep notes',
    icon: Calendar,
    path: '/interviews',
    cta: 'Manage Interviews',
  },
  {
    title: 'Mentoring',
    description: 'Invite mentors or view your mentees',
    icon: Users,
    path: '/mentoring',
    cta: 'Go to Mentoring',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, isProfileComplete } = useProfile(user?.id);
  const navigate = useNavigate();
  const [showReminder, setShowReminder] = useState(false);

  // Check if we should show the profile completion reminder
  useEffect(() => {
    if (profile && !isProfileComplete) {
      // Check if user dismissed the reminder in this session
      const dismissedUntil = sessionStorage.getItem(REMINDER_DISMISSED_KEY);
      if (!dismissedUntil || Date.now() > parseInt(dismissedUntil, 10)) {
        setShowReminder(true);
      }
    } else {
      setShowReminder(false);
    }
  }, [profile, isProfileComplete]);

  const handleDismissReminder = () => {
    // Dismiss for 1 hour (they'll see it again next login or after 1 hour)
    const dismissUntil = Date.now() + 60 * 60 * 1000;
    sessionStorage.setItem(REMINDER_DISMISSED_KEY, dismissUntil.toString());
    setShowReminder(false);
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.user_metadata?.full_name || profile?.full_name || 'there'}!
          </h1>
          <p className="text-gray-500 text-lg">
            Here's an overview of your career journey
          </p>
        </div>

        {/* Profile Completion Reminder */}
        {showReminder && (
          <div className="mb-8 bg-warning-50 border border-warning-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-warning-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-warning-800 mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-warning-700 mb-3">
                  Your profile is incomplete. A complete profile helps us personalize your experience and provide better career recommendations.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/onboarding')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-warning-600 rounded-lg hover:bg-warning-700 transition-colors"
                  >
                    Complete Profile
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissReminder}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-warning-700 hover:text-warning-800 transition-colors"
                  >
                    Remind me later
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissReminder}
                className="flex-shrink-0 p-1 text-warning-500 hover:text-warning-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        {user && (
          <div className="mb-12">
            <AnalyticsDashboard userId={user.id} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12">
          <span className="section-label mb-6">Quick Actions</span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                type="button"
                className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover p-6 text-left transition-smooth"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-smooth">
                  <action.icon className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-500 text-sm mb-4">{action.description}</p>
                <span className="inline-flex items-center gap-1 text-primary-500 font-medium text-sm group-hover:gap-2 transition-all">
                  {action.cta}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
