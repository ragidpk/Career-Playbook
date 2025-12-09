import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute() {
  const { user, loading, authReady } = useAuth();

  // Wait for auth to be ready before making routing decisions
  // This prevents redirect flicker on page load
  if (!authReady || loading) {
    return <LoadingSpinner />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
