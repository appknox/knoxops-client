import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/api';
import { useAuthStore } from '@/stores';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse tokens from URL hash fragment
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (!accessToken || !refreshToken) {
          throw new Error('Missing authentication tokens');
        }

        // Store tokens in localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Clear URL hash for security
        window.history.replaceState(null, '', window.location.pathname);

        // Fetch user info and update auth store
        const user = await authApi.getCurrentUser();
        useAuthStore.setState({
          user,
          isAuthenticated: true,
          isInitialized: true,
        });

        // Redirect to devices page
        navigate('/devices', { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setError(message);
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-red-600 text-xl">!</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
        <p className="text-gray-600 text-center mb-4">{error}</p>
        <p className="text-sm text-gray-400">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing sign in...</h2>
      <p className="text-gray-600">Please wait while we authenticate your account.</p>
    </div>
  );
};

export { AuthCallback };
