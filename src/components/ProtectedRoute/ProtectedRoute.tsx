import React from 'react';
import { Navigate } from 'react-router-dom';
import type { JSX } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const {user} = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Navigate to="/dashboard" />;
}

export default ProtectedRoute;
