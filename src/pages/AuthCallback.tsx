import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for errors in URL (magic link/OAuth failures)
    const urlError = searchParams.get('error');
    const urlErrorDescription = searchParams.get('error_description');

    if (urlError) {
      // Show clearer error message from URL
      const errorMessage = urlErrorDescription || urlError || 'Authentication failed';
      setError(errorMessage);
      return;
    }

    // Handle the OAuth/magic link callback
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message);
        return;
      }

      if (session) {
        // Successfully authenticated, redirect to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // No session, redirect to login
        navigate('/login', { replace: true });
      }
    });
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="rounded-md bg-error/10 p-4">
            <p className="text-sm text-error">{error}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full text-primary-500 hover:text-primary-600 font-medium"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return <LoadingSpinner />;
}
