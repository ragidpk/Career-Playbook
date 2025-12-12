import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/shared/Toast';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Features from './pages/Features';
import Resources from './pages/Resources';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Canvas from './pages/Canvas';
import Plan from './pages/Plan';
import Resume from './pages/Resume';
import CRM from './pages/CRM';
import Jobs from './pages/Jobs';
import Interviews from './pages/Interviews';
import Mentors from './pages/Mentors';
import MentorView from './pages/MentorView';
import AcceptInvitation from './pages/AcceptInvitation';
import Settings from './pages/Settings';
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

function App() {
  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />

            {/* Protected routes with Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/canvas" element={<Canvas />} />
                <Route path="/plan" element={<Plan />} />
                <Route path="/resume" element={<Resume />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/interviews" element={<Interviews />} />
                <Route path="/mentors" element={<Mentors />} />
                <Route path="/mentor-view" element={<MentorView />} />
                <Route path="/accept-invitation" element={<AcceptInvitation />} />
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
            <Route path="/resources" element={<Resources />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ToastProvider>
  );
}

export default App;
