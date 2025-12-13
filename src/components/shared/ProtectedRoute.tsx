import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute() {
  const { user, loading, authReady } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile(user?.id);
  const location = useLocation();

  // Wait for auth to be ready before making routing decisions
  // This prevents redirect flicker on page load
  if (!authReady || loading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wait for profile to load
  if (profileLoading) {
    return <LoadingSpinner />;
  }

  // Check if user needs to complete onboarding
  // Skip this check if already on the onboarding page
  const isOnboardingPage = location.pathname === '/onboarding';
  const needsOnboarding = profile && !profile.profile_completed;

  if (needsOnboarding && !isOnboardingPage) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
