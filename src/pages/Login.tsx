import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../utils/validation';
import { signIn } from '../services/auth.service';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';

type LoginFormData = {
  email: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);
      await signIn(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to sign in. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
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
              Welcome back
            </h2>
            <p className="mt-2 text-gray-500">
              Sign in to continue to Career Playbook
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-2xl bg-error-50 border border-error-100 p-4">
                <p className="text-sm text-error-600">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <Input
                {...register('email')}
                id="email"
                type="email"
                label="Email address"
                autoComplete="email"
                error={errors.email?.message}
              />

              <Input
                {...register('password')}
                id="password"
                type="password"
                label="Password"
                autoComplete="current-password"
                error={errors.password?.message}
              />
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-smooth"
              >
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-sm text-gray-500">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-primary-600 hover:text-primary-500 transition-smooth"
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:flex-1 relative">
        <img
          src="/images/login-img.webp"
          alt="Professional career development"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/40 to-primary-600/20" />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <blockquote className="text-white">
            <p className="text-2xl font-display font-semibold leading-relaxed mb-4">
              "Career Playbook helped me land my dream job in just 90 days."
            </p>
            <footer className="text-white/80">
              <span className="font-medium">Sarah M.</span>
              <span className="mx-2">•</span>
              <span>Product Manager at Google</span>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 lg:right-1/2 py-4 px-4">
        <p className="text-xs text-gray-400 text-center">
          © 2025 Ragid Kader. Creator of Smart Career Planner | Beyond Your Career. All rights reserved.
        </p>
      </div>
    </div>
  );
}
