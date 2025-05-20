import { NavLink, useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase'; // Changed to default import

interface NavigationProps {
  isAuthenticated: boolean;
  logout?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isAuthenticated, logout }) => {
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut();
    if (logout) logout();
    navigate('/login');
  };

  const loggedInLinks = [
    { to: '/dashboard', text: 'Dashboard', ariaLabel: 'Navigate to Dashboard' },
    {
      to: '/log-workout',
      text: 'Log Workout',
      ariaLabel: 'Navigate to Log Workout',
    },
    {
      to: '/history',
      text: 'Workout History',
      ariaLabel: 'Navigate to Workout History',
    },
    { to: '/settings', text: 'Settings', ariaLabel: 'Navigate to Settings' },
  ];

  const loggedOutLinks = [
    { to: '/login', text: 'Login', ariaLabel: 'Navigate to Login' },
    { to: '/signup', text: 'Sign Up', ariaLabel: 'Navigate to Sign Up' },
  ];

  const links = isAuthenticated ? loggedInLinks : loggedOutLinks;

  return (
    <nav className="flex space-x-4 p-4" aria-label="Main navigation">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `text-gray-700 hover:text-blue-500 ${isActive ? 'text-blue-500' : ''}`
          }
          aria-label={link.ariaLabel}
          tabIndex={0}
        >
          {link.text}
        </NavLink>
      ))}
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600"
          aria-label="Log out of your account"
        >
          Logout
        </button>
      )}
    </nav>
  );
};

export default Navigation;
