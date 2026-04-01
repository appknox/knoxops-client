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

            {/* Google SSO Button for Invite Acceptance */}
            <a
              href={`${import.meta.env.VITE_API_URL || '/api'}/auth/oidc`}
              className="flex items-center justify-center gap-3 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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
              Accept Invitation with Google
            </a>

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
