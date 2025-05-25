import { NavLink, useNavigate } from 'react-router';
import { supabase } from '../../utils/supabase';
import {Button} from "@/components/ui/button";


interface NavigationProps {
  isAuthenticated: boolean;
  logout?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isAuthenticated, logout }) => {
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    if (logout) logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const loggedInLinks = [
    { to: '/dashboard', text: 'Dashboard', ariaLabel: 'Navigate to Dashboard' },
    { to: '/dashboard/profile', text: 'Profile', ariaLabel: 'Navigate to Profile' },
    { to: '/dashboard/settings', text: 'Settings', ariaLabel: 'Navigate to Settings' },
  ];

  const loggedOutLinks = [
    { to: '/', text: 'Home', ariaLabel: 'Navigate to Home' },
    { to: '/login', text: 'Login', ariaLabel: 'Navigate to Login' },
  ];

  const links = isAuthenticated ? loggedInLinks : loggedOutLinks;

  return (
    <nav className="flex flex-wrap justify-center gap-2">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `px-3 py-1 rounded-md
            ${isActive
              ? 'bg-accent text-accent-foreground'
              : 'text-foreground hover:bg-muted'
            }`
          }
          aria-label={link.ariaLabel}
          tabIndex={0}
        >
          {link.text}
        </NavLink>
      ))}
      {isAuthenticated && (
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="sm"
          className="ml-2"
          aria-label="Log out of your account"
        >
          Logout
        </Button>
      )}
    </nav>
  );
};

export default Navigation;
