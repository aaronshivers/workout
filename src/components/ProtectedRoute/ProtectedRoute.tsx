import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthManager from '../AuthManager/AuthManager'; // Adjust path as necessary
import type { JSX } from 'react';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return (
    <AuthManager>
      {({ isAuthenticated, isInitialized }) => {
        if (!isInitialized) {
          // If AuthManager hasn't finished its initial check, render nothing or a loading spinner
          // This prevents flashing unauthorized content or immediate redirects before auth state is known.
          return null; // Or a loading component: <div>Loading authentication...</div>
        }

        if (!isAuthenticated) {
          // If not authenticated, redirect to the login page
          console.log(
            'ProtectedRoute - Not authenticated, redirecting to /login',
          );
          return <Navigate to="/login" replace />;
        }

        // If authenticated, render the children (the protected component)
        return children;
      }}
    </AuthManager>
  );
};

export default ProtectedRoute;
