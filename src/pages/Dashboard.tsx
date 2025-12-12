import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import NotificationBell from '../components/notifications/NotificationBell';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.full_name || 'there'}!
          </h1>
          {user && <NotificationBell userId={user.id} />}
        </div>

        {/* Analytics Dashboard */}
        {user && (
          <div className="mb-12">
            <AnalyticsDashboard userId={user.id} />
          </div>
        )}

        {/* Quick action cards */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-4">Career Canvas</h3>
              <p className="text-gray-600 mb-4">Define your career value proposition</p>
              <button
                onClick={() => navigate('/canvas')}
                className="text-primary-500 hover:text-primary-600 font-medium"
                type="button"
              >
                Get Started &rarr;
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-4">90-Day Plan</h3>
              <p className="text-gray-600 mb-4">Build your structured job search plan</p>
              <button
                onClick={() => navigate('/plan')}
                className="text-primary-500 hover:text-primary-600 font-medium"
                type="button"
              >
                Create Plan &rarr;
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-4">Resume Analysis</h3>
              <p className="text-gray-600 mb-4">Get AI-powered ATS scoring</p>
              <button
                onClick={() => navigate('/resume')}
                className="text-primary-500 hover:text-primary-600 font-medium"
                type="button"
              >
                Upload Resume &rarr;
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-4">Company Tracker</h3>
              <p className="text-gray-600 mb-4">Track companies in your job search</p>
              <button
                onClick={() => navigate('/crm')}
                className="text-primary-500 hover:text-primary-600 font-medium"
                type="button"
              >
                Manage Companies &rarr;
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-4">Job Board</h3>
              <p className="text-gray-600 mb-4">Track job applications and opportunities</p>
              <button
                onClick={() => navigate('/jobs')}
                className="text-primary-500 hover:text-primary-600 font-medium"
                type="button"
              >
                View Jobs &rarr;
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-4">Interview Prep</h3>
              <p className="text-gray-600 mb-4">Track interviews and prep notes</p>
              <button
                onClick={() => navigate('/interviews')}
                className="text-primary-500 hover:text-primary-600 font-medium"
                type="button"
              >
                Manage Interviews &rarr;
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-4">Mentor Collaboration</h3>
              <p className="text-gray-600 mb-4">Invite mentors to guide your journey</p>
              <button
                onClick={() => navigate('/mentors')}
                className="text-primary-500 hover:text-primary-600 font-medium"
                type="button"
              >
                Invite Mentors &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
