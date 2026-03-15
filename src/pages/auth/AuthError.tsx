import { useSearchParams, Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button, Card, CardBody } from '@/components/ui';

const AuthError = () => {
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('error') || 'An unknown error occurred during authentication';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Authentication Error</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardBody className="text-center">
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <Link to="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
          </CardBody>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-400">
          If this problem persists, please contact your administrator.
        </p>
      </div>
    </div>
  );
};

export { AuthError };
