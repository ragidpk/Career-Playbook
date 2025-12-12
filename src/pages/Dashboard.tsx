import { useAuth } from '../hooks/useAuth';
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
} from 'lucide-react';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';

const quickActions = [
  {
    title: 'Career Canvas',
    description: 'Define your career value proposition',
    icon: Target,
    path: '/canvas',
    cta: 'Get Started',
  },
  {
    title: '90-Day Plan',
    description: 'Build your structured job search plan',
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
    title: 'Mentor Collaboration',
    description: 'Invite mentors to guide your journey',
    icon: Users,
    path: '/mentors',
    cta: 'Invite Mentors',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.user_metadata?.full_name || 'there'}!
          </h1>
          <p className="text-gray-500 text-lg">
            Here's an overview of your career journey
          </p>
        </div>

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
