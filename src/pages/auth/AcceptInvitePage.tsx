import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardBody } from '@/components/ui';
import { invitesApi, type InviteValidationResponse } from '@/api/invites';

const acceptInviteSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

type PageState = 'loading' | 'valid' | 'invalid' | 'expired' | 'success' | 'error';

const AcceptInvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [inviteDetails, setInviteDetails] = useState<InviteValidationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setPageState('invalid');
        return;
      }

      try {
        const response = await invitesApi.validateToken(token);
        setInviteDetails(response);
        setPageState('valid');
      } catch (error: unknown) {
        const err = error as { response?: { status?: number; data?: { message?: string } } };
        if (err.response?.status === 404) {
          setPageState('invalid');
          setErrorMessage('This invitation link is invalid or has already been used.');
        } else if (err.response?.data?.message?.toLowerCase().includes('expired')) {
          setPageState('expired');
          setErrorMessage('This invitation has expired. Please contact your administrator for a new invitation.');
        } else {
          setPageState('invalid');
          setErrorMessage(err.response?.data?.message || 'Unable to validate invitation.');
        }
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: AcceptInviteFormData) => {
    if (!token) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await invitesApi.acceptInvite(token, { password: data.password });
      setPageState('success');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setErrorMessage(err.response?.data?.message || 'Failed to complete registration. Please try again.');
      setPageState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid or expired state
  if (pageState === 'invalid' || pageState === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            {pageState === 'expired' ? 'Invitation Expired' : 'Invalid Invitation'}
          </h2>
          <p className="mt-4 text-center text-gray-600">{errorMessage}</p>
          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Account Created Successfully
          </h2>
          <p className="mt-4 text-center text-gray-600">
            Your account has been set up. You can now sign in with your email and password.
          </p>
          <div className="mt-8 text-center">
            <Button onClick={() => navigate('/login')} className="w-full max-w-xs mx-auto">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Registration form state
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">AK</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Complete Your Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Set up your password to activate your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardBody>
            {/* Invite details */}
            {inviteDetails && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Welcome, <span className="font-semibold text-gray-900">{inviteDetails.firstName} {inviteDetails.lastName}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">{inviteDetails.email}</p>
              </div>
            )}

            {(errorMessage && pageState === 'error') && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  error={errors.password?.message}
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  placeholder="Create a password"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters
                </p>
              </div>

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                placeholder="Confirm your password"
              />

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-400">
          SECURE INTERNAL MANAGEMENT SYSTEM
        </p>
      </div>
    </div>
  );
};

export { AcceptInvitePage };
