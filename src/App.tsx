import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/shared/Toast';
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
import Layout from './components/layout/Layout';

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
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ToastProvider>
  );
}

export default App;
