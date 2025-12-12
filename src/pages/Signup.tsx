import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, CheckCircle } from 'lucide-react';
import { signupSchema } from '../utils/validation';
import { signUp } from '../services/auth.service';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-elevated p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center shadow-button">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-gray-500">
              Start your career journey today
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

          <p className="mt-8 text-center text-sm text-gray-500">
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
    </div>
  );
}
