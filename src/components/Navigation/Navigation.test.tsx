import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Navigation from './Navigation';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';

// Mock the useNavigate hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock supabase.auth.signOut
vi.mock('../../utils/supabase', () => ({
  default: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

const mockLogout = vi.fn();

const renderWithRouter = (
  isAuthenticated: boolean,
  initialRoute: string = '/dashboard',
): ReturnType<typeof render> => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/*"
          element={
            <Navigation isAuthenticated={isAuthenticated} logout={mockLogout} />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
};

describe('Navigation Component (Logged-In User)', () => {
  it('renders without crashing', () => {
    renderWithRouter(true);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('displays NavLink for Dashboard with correct props', () => {
    renderWithRouter(true);
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(dashboardLink).toHaveAttribute(
      'aria-label',
      'Navigate to Dashboard',
    );
  });

  it('applies text-blue-500 class to active Dashboard NavLink', () => {
    renderWithRouter(true, '/dashboard');
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink).toHaveClass('text-blue-500');
  });

  it('displays NavLink for Log Workout with correct props', () => {
    renderWithRouter(true);
    const logWorkoutLink = screen.getByText('Log Workout');
    expect(logWorkoutLink).toHaveAttribute('href', '/log-workout');
    expect(logWorkoutLink).toHaveAttribute(
      'aria-label',
      'Navigate to Log Workout',
    );
  });

  it('applies text-blue-500 class to active Log Workout NavLink', () => {
    renderWithRouter(true, '/log-workout');
    const logWorkoutLink = screen.getByText('Log Workout');
    expect(logWorkoutLink).toHaveClass('text-blue-500');
  });

  it('displays NavLink for Workout History with correct props', () => {
    renderWithRouter(true);
    const historyLink = screen.getByText('Workout History');
    expect(historyLink).toHaveAttribute('href', '/history');
    expect(historyLink).toHaveAttribute(
      'aria-label',
      'Navigate to Workout History',
    );
  });

  it('applies text-blue-500 class to active Workout History NavLink', () => {
    renderWithRouter(true, '/history');
    const historyLink = screen.getByText('Workout History');
    expect(historyLink).toHaveClass('text-blue-500');
  });

  it('displays NavLink for Settings with correct props', () => {
    renderWithRouter(true);
    const settingsLink = screen.getByText('Settings');
    expect(settingsLink).toHaveAttribute('href', '/settings');
    expect(settingsLink).toHaveAttribute('aria-label', 'Navigate to Settings');
  });

  it('applies text-blue-500 class to active Settings NavLink', () => {
    renderWithRouter(true, '/settings');
    const settingsLink = screen.getByText('Settings');
    expect(settingsLink).toHaveClass('text-blue-500');
  });

  it('displays Logout button with correct styling', () => {
    renderWithRouter(true);
    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toHaveClass('bg-red-500', 'text-white', 'rounded-md');
  });

  it('calls logout function and navigates to /login when Logout button is clicked', async () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);
    renderWithRouter(true);
    const logoutButton = screen.getByText('Logout');
    await fireEvent.click(logoutButton);
    expect(vi.mocked(supabase.auth.signOut)).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('has accessible navigation with keyboard support', () => {
    renderWithRouter(true);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('tabindex', '0');
    });
  });

  it('renders with expected base Tailwind classes', () => {
    renderWithRouter(true);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('flex', 'space-x-4', 'p-4');
  });
});

describe('Navigation Component (Logged-Out User)', () => {
  it('renders without crashing', () => {
    renderWithRouter(false);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('displays NavLink for Login with correct props', () => {
    renderWithRouter(false);
    const loginLink = screen.getByText('Login');
    expect(loginLink).toHaveAttribute('href', '/login');
    expect(loginLink).toHaveAttribute('aria-label', 'Navigate to Login');
  });

  it('applies text-blue-500 class to active Login NavLink', () => {
    renderWithRouter(false, '/login');
    const loginLink = screen.getByText('Login');
    expect(loginLink).toHaveClass('text-blue-500');
  });

  it('displays NavLink for Sign Up with correct props', () => {
    renderWithRouter(false);
    const signUpLink = screen.getByText('Sign Up');
    expect(signUpLink).toHaveAttribute('href', '/signup');
    expect(signUpLink).toHaveAttribute('aria-label', 'Navigate to Sign Up');
  });

  it('applies text-blue-500 class to active Sign Up NavLink', () => {
    renderWithRouter(false, '/signup');
    const signUpLink = screen.getByText('Sign Up');
    expect(signUpLink).toHaveClass('text-blue-500');
  });

  it('does not display NavLinks for protected routes', () => {
    renderWithRouter(false);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Log Workout')).not.toBeInTheDocument();
    expect(screen.queryByText('Workout History')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('renders with expected base Tailwind classes', () => {
    renderWithRouter(false);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('flex', 'space-x-4', 'p-4');
  });
});
