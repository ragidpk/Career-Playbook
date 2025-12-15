import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle } from 'lucide-react';
import { signupSchema } from '../utils/validation';
import { signUp, signInWithGoogle } from '../services/auth.service';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';

type SignupFormData = {
  email: string;
  password: string;
  fullName: string;
};

export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign up with Google';
      setError(message);
      setGoogleLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true);
      setError(null);
      await signUp(data.email, data.password, data.fullName);
      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to create account. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-elevated p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-success-50 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success-500" />
              </div>
            </div>
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">
              Check your email
            </h2>
            <div className="rounded-2xl bg-primary-50 p-4 mb-6">
              <p className="text-sm text-gray-700">
                We've sent you a verification link. Please check your email and
                click the link to verify your account.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:flex-1 relative">
        <img
          src="/images/signup-img.webp"
          alt="Start your career journey"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/40 to-primary-600/20" />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <blockquote className="text-white">
            <p className="text-2xl font-display font-semibold leading-relaxed mb-4">
              "The best investment you can make is in yourself and your career."
            </p>
            <footer className="text-white/80">
              <span className="font-medium">Join 5,000+</span>
              <span className="mx-2">•</span>
              <span>Professionals growing their careers</span>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/">
              <img
                src="/images/logo.svg"
                alt="Career Playbook"
                className="h-10"
              />
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-gray-500">
              Start your career journey today
            </p>
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700 font-medium">
              {googleLoading ? 'Signing up...' : 'Continue with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-2xl bg-error-50 border border-error-100 p-4">
                <p className="text-sm text-error-600">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <Input
                {...register('fullName')}
                id="fullName"
                type="text"
                label="Full Name"
                autoComplete="name"
                error={errors.fullName?.message}
              />

              <Input
                {...register('email')}
                id="email"
                type="email"
                label="Email address"
                autoComplete="email"
                error={errors.email?.message}
              />

              <div>
                <Input
                  {...register('password')}
                  id="password"
                  type="password"
                  label="Password"
                  autoComplete="new-password"
                  error={errors.password?.message}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, and
                  number
                </p>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Create account
            </Button>
          </form>

          <p className="mt-8 text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-500 transition-smooth"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 lg:left-1/2 py-4 px-4">
        <p className="text-xs text-gray-400 text-center">
          © 2025 Ragid Kader. Creator of Smart Career Planner | Beyond Your Career. All rights reserved.
        </p>
      </div>
    </div>
  );
}
