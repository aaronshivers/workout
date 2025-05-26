import { useAuth } from './useAuth';

export const useLogout = () => {
  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  return handleLogout;
};
