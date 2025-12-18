import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/shared/Toast';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Features from './pages/Features';
import Resources from './pages/Resources';
import Templates from './pages/Templates';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Canvas from './pages/Canvas';
import Plan from './pages/Plan';
import PlanDetail from './pages/PlanDetail';
import PlanEdit from './pages/PlanEdit';
import InviteCollaborators from './pages/InviteCollaborators';
import AcceptPlanInvitation from './pages/AcceptPlanInvitation';
import Resume from './pages/Resume';
import ResumeBuilder from './pages/ResumeBuilder';
import CRM from './pages/CRM';
import Jobs from './pages/Jobs';
import Interviews from './pages/Interviews';
import Mentors from './pages/Mentors';
import AcceptInvitation from './pages/AcceptInvitation';
import Settings from './pages/Settings';
import Sessions from './pages/Sessions';
import ProtectedRoute from './components/shared/ProtectedRoute';
import AdminRoute from './components/shared/AdminRoute';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/shared/LoadingSpinner';

// Lazy load Admin page to reduce bundle size for non-admin users
const Admin = lazy(() => import('./pages/Admin'));

// NotFound component for catch-all route
function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Handle recovery tokens and auth errors that land on the root URL
function AuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/') return;

    const hash = window.location.hash;
    if (!hash) return;

    // Check for auth errors in hash (e.g., otp_expired)
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorCode = params.get('error_code');
      const errorDescription = params.get('error_description');

      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname);

      // Redirect to forgot-password with error info
      if (errorCode === 'otp_expired') {
        navigate('/forgot-password?error=expired', { replace: true });
      } else {
        navigate(`/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`, { replace: true });
      }
      return;
    }

    // Check if we have a recovery token in the hash
    if (hash.includes('type=recovery')) {
      // Redirect to reset password page with the hash preserved
      navigate('/auth/reset-password' + hash, { replace: true });
    }
  }, [navigate, location.pathname]);

  return null;
}

function App() {
  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthRedirectHandler />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />

            {/* Protected routes with Layout */}
            <Route element={<ProtectedRoute />}>
              {/* Onboarding - no layout */}
              <Route path="/onboarding" element={<Onboarding />} />

              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/canvas" element={<Canvas />} />
                <Route path="/plan" element={<Plan />} />
                <Route path="/plans/:id" element={<PlanDetail />} />
                <Route path="/plans/:id/edit" element={<PlanEdit />} />
                <Route path="/plans/:id/collaborators" element={<InviteCollaborators />} />
                <Route path="/accept-plan-invitation" element={<AcceptPlanInvitation />} />
                <Route path="/resume" element={<Resume />} />
                <Route path="/resume-builder" element={<ResumeBuilder />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/interviews" element={<Interviews />} />
                <Route path="/mentoring" element={<Mentors />} />
                <Route path="/mentors" element={<Mentors />} />
                <Route path="/accept-invitation" element={<AcceptInvitation />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Admin routes - requires admin role, lazy loaded */}
              <Route element={<AdminRoute />}>
                <Route element={<Layout />}>
                  <Route
                    path="/admin"
                    element={
                      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
                        <Admin />
                      </Suspense>
                    }
                  />
                </Route>
              </Route>
            </Route>

            {/* Public pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
            <Route path="/terms_of_service" element={<TermsOfService />} />

            {/* Backward-compatible redirects */}
            <Route path="/mentor-view" element={<Navigate to="/mentoring" replace />} />

            {/* Catch-all 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ToastProvider>
  );
}

export default App;
