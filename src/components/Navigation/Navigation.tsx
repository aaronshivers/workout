import { NavLink, useNavigate } from 'react-router';
import { supabase } from '../../utils/supabase'; // Changed to default import

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
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally, show a user-friendly message
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
    <nav className="flex flex-wrap justify-center space-x-4 p-4 bg-blue-50 rounded-lg shadow-inner border border-blue-100" aria-label="Main navigation">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `text-gray-700 hover:text-blue-700 px-4 py-2 rounded-md transition-all duration-300 ease-in-out
            ${isActive ? 'bg-blue-200 text-blue-800 font-semibold shadow-md' : 'hover:bg-blue-100'}`
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
          className="bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600 transition-colors duration-200 shadow-md ml-4"
          aria-label="Log out of your account"
        >
          Logout
        </button>
      )}
    </nav>
  );
};

export default Navigation;
