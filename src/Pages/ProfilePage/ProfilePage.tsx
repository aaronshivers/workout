import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="text-center p-8 bg-white rounded-lg shadow-md border border-blue-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Your User Profile</h2>
      {user ? (
        <div className="bg-blue-50 p-8 rounded-lg shadow-inner inline-block border border-blue-200">
          <p className="text-lg text-gray-800 mb-3">
            <strong className="text-blue-700">User ID:</strong> <span className="font-mono break-all">{user.id}</span>
          </p>
          <p className="text-lg text-gray-800">
            <strong className="text-blue-700">Email:</strong> <span className="font-medium">{user.email}</span>
          </p>
          {/* You can display more user details here, e.g., metadata */}
          {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
            <div className="mt-6 text-left">
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Additional Details:</h3>
              <ul className="list-disc list-inside space-y-2">
                {Object.entries(user.user_metadata).map(([key, value]) => (
                  <li key={key} className="text-gray-700">
                    <strong>{key}:</strong> {String(value)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600 text-lg">User data not available. Please log in to view your profile.</p>
      )}
    </div>
  );
};

export default ProfilePage;
