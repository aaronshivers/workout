import { useAuth } from '../hooks/useAuth';
import { Navigate, Outlet, useLocation } from 'react-router';

export const AuthGuard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Redirect authenticated users away from /login to /dashboard
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect unauthenticated users to /login if not already on /login
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  // Render the Outlet for the current route (e.g., / or /login)
  return <Outlet />;
};
