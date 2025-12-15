import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/shared/Toast';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Features from './pages/Features';
import Resources from './pages/Resources';
import Templates from './pages/Templates';
import PrivacyPolicy from './pages/PrivacyPolicy';
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
import CRM from './pages/CRM';
import Jobs from './pages/Jobs';
import Interviews from './pages/Interviews';
import Mentors from './pages/Mentors';
import MentorView from './pages/MentorView';
import AcceptInvitation from './pages/AcceptInvitation';
import Settings from './pages/Settings';
import Sessions from './pages/Sessions';
import ProtectedRoute from './components/shared/ProtectedRoute';
import AdminRoute from './components/shared/AdminRoute';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/shared/LoadingSpinner';

// Lazy load Admin page to reduce bundle size for non-admin users
const Admin = lazy(() => import('./pages/Admin'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Handle recovery tokens that land on the root URL
function AuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we have a recovery token in the hash
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery') && location.pathname === '/') {
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
                <Route path="/crm" element={<CRM />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/interviews" element={<Interviews />} />
                <Route path="/mentors" element={<Mentors />} />
                <Route path="/mentor-view" element={<MentorView />} />
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
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ToastProvider>
  );
}

export default App;
