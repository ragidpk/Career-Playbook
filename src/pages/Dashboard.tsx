import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Welcome back, {user?.user_metadata?.full_name || 'there'}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick action cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Career Canvas</h2>
            <p className="text-gray-600 mb-4">Define your career value proposition</p>
            <button
              onClick={() => navigate('/canvas')}
              className="text-primary-500 hover:text-primary-600 font-medium"
              type="button"
            >
              Get Started &rarr;
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">90-Day Plan</h2>
            <p className="text-gray-600 mb-4">Build your structured job search plan</p>
            <button
              onClick={() => navigate('/plan')}
              className="text-primary-500 hover:text-primary-600 font-medium"
              type="button"
            >
              Create Plan &rarr;
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Resume Analysis</h2>
            <p className="text-gray-600 mb-4">Get AI-powered ATS scoring</p>
            <button
              onClick={() => navigate('/resume')}
              className="text-primary-500 hover:text-primary-600 font-medium"
              type="button"
            >
              Upload Resume &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
