import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../services/supabase';
import Button from '../components/shared/Button';
import { useToast } from '../components/shared/Toast';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Process the recovery token from URL hash on mount
  useEffect(() => {
    const processRecoveryToken = async () => {
      const hash = window.location.hash;

      // Check for error in hash
      if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1));
        const errorCode = params.get('error_code');

        if (errorCode === 'otp_expired') {
          setLinkError('This password reset link has expired. Please request a new one.');
        } else {
          setLinkError(params.get('error_description') || 'Invalid reset link.');
        }
        setVerifying(false);
        return;
      }

      // Check if we have a recovery token
      if (hash.includes('access_token') && hash.includes('type=recovery')) {
        try {
          // Supabase client automatically processes the hash and sets up the session
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            setLinkError('Failed to verify reset link. Please request a new one.');
          } else if (!data.session) {
            setLinkError('Invalid or expired reset link. Please request a new one.');
          }
          // Clear the hash from URL for cleaner display
          window.history.replaceState(null, '', window.location.pathname);
        } catch {
          setLinkError('Failed to process reset link. Please try again.');
        }
      } else {
        // No token in URL, check if we already have a valid session
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setLinkError('No valid reset link found. Please request a new password reset.');
        }
      }

      setVerifying(false);
    };

    processRecoveryToken();
  }, []);

  // Listen for auth state changes (helps with PKCE flow)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setVerifying(false);
        setLinkError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true);
      setLinkError(null);

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        // Check for invalid/expired link errors
        if (error.message.includes('session') || error.message.includes('expired')) {
          setLinkError('This password reset link has expired or is invalid. Please request a new one.');
        } else {
          throw error;
        }
        return;
      }

      showToast('Password reset successfully!', 'success');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while verifying token
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {linkError && (
          <div className="rounded-md bg-error/10 p-4">
            <p className="text-sm text-error">{linkError}</p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Request a new reset link
            </button>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="new-password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-error">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!!linkError}
            className="w-full"
          >
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}
