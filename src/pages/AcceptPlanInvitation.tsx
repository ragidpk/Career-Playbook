import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, X, Loader2, Target, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { acceptPlanInvitation } from '../services/collaborator.service';

type Status = 'loading' | 'success' | 'error' | 'need_login';

export default function AcceptPlanInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [planId, setPlanId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const token = searchParams.get('token');
  const plan = searchParams.get('plan');

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Check if we have required params
    if (!token || !plan) {
      setStatus('error');
      setMessage('Invalid invitation link. Please check the link and try again.');
      return;
    }

    // If not logged in, show login prompt
    if (!user) {
      setStatus('need_login');
      return;
    }

    // Accept the invitation
    const accept = async () => {
      try {
        const result = await acceptPlanInvitation(token, plan);
        setStatus('success');
        setMessage('You have successfully joined as a collaborator!');
        setPlanTitle(result.planTitle);
        setPlanId(result.planId);
        setRole(result.role);
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to accept invitation');
      }
    };

    accept();
  }, [token, plan, user, authLoading]);

  // Render login prompt
  if (status === 'need_login') {
    const returnUrl = `/accept-plan-invitation?token=${token}&plan=${plan}`;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-primary-600" />
          </div>

          <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">
            Sign In to Accept
          </h1>

          <p className="text-gray-600 mb-6">
            You need to sign in to accept this collaboration invitation. If you don't have an
            account, you can create one for free.
          </p>

          <div className="space-y-3">
            <Link
              to={`/login?redirect=${encodeURIComponent(returnUrl)}`}
              className="block w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              Sign In
            </Link>

            <Link
              to={`/signup?redirect=${encodeURIComponent(returnUrl)}`}
              className="block w-full px-6 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
            >
              Create Account
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            After signing in, you'll be redirected back here to accept the invitation.
          </p>
        </div>
      </div>
    );
  }

  // Render loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>

          <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">
            Accepting Invitation...
          </h1>

          <p className="text-gray-600">
            Please wait while we process your invitation.
          </p>
        </div>
      </div>
    );
  }

  // Render success state
  if (status === 'success') {
    const roleLabel = role === 'mentor' ? 'Mentor' : 'Accountability Partner';

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">
            Invitation Accepted!
          </h1>

          <p className="text-gray-600 mb-2">{message}</p>

          <div className="bg-gray-50 rounded-xl p-4 my-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Target className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-gray-900">{planTitle}</span>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
              {roleLabel}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            You can now view this plan and leave comments to help guide the job seeker on their
            career journey.
          </p>

          <div className="space-y-3">
            {planId && (
              <Link
                to={`/plans/${planId}`}
                className="block w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                View Plan
              </Link>
            )}

            <Link
              to="/dashboard"
              className="block w-full px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <X className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">
          Unable to Accept Invitation
        </h1>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="block w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Go to Dashboard
          </Link>

          <button
            onClick={() => navigate(0)}
            className="block w-full px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
