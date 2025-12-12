import { Navigate, Outlet } from 'react-router-dom';
import { useIsAdmin } from '../../hooks/useAdmin';
import LoadingSpinner from './LoadingSpinner';

export default function AdminRoute() {
  const { isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
