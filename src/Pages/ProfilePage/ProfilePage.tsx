import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Card className="w-full max-w-xs sm:max-w-md mx-auto text-center">
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800">
          Your User Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        {user ? (
          <div className="bg-blue-50 p-6 rounded-lg shadow-inner inline-block border border-blue-200 w-full">
            <p className="text-sm sm:text-base text-gray-800 mb-3">
              <strong className="text-blue-700">User ID:</strong>{' '}
              <span className="font-mono break-all text-gray-900 bg-blue-100 px-2 py-1 rounded-md text-xs sm:text-sm">
                {user.id}
              </span>
            </p>
            <p className="text-sm sm:text-base text-gray-800">
              <strong className="text-blue-700">Email:</strong>{' '}
              <span className="font-medium text-gray-900">{user.email}</span>
            </p>
            {user.user_metadata &&
              Object.keys(user.user_metadata).length > 0 && (
                <div className="mt-6 text-left p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-base sm:text-xl font-semibold text-gray-700 mb-3 border-b pb-2 border-gray-200">
                    Additional Details:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                    {Object.entries(user.user_metadata).map(([key, value]) => (
                      <li key={key} className="text-gray-700">
                        <strong className="text-gray-800 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </strong>{' '}
                        <span className="font-normal">{String(value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        ) : (
          <p className="text-gray-600 text-sm sm:text-lg p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm">
            User data not available. Please log in to view your profile.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfilePage;
