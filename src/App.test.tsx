import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import Navigation from './components/Navigation/Navigation';
import AuthManager from './components/AuthManager/AuthManager';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import WorkoutLogger from './components/WorkoutLogger/WorkoutLogger';
import WorkoutHistory from './components/WorkoutHistory/WorkoutHistory';
import Settings from './components/Settings/Settings';
import CreateWorkout from './components/CreateWorkout/CreateWorkout';
import * as router from 'react-router-dom';

// Mock Navigation component
vi.mock('./components/Navigation/Navigation', () => ({
  default: vi.fn(() => <div>Navigation Component</div>),
}));

// Mock AuthManager to control authentication state
vi.mock('./components/AuthManager/AuthManager', () => ({
  default: vi.fn(({ children }) =>
    children({
      handleLogout: vi.fn(),
      isInitialized: true,
      userId: 'test-user-id',
      isAuthenticated: true,
    }),
  ),
}));

// Mock other components
vi.mock('./components/Login/Login', () => ({
  default: () => <div>Login Component</div>,
}));
vi.mock('./components/Signup/Signup', () => ({
  default: () => <div>Signup Component</div>,
}));
vi.mock('./components/Dashboard/Dashboard', () => ({
  default: () => <div>Dashboard Component</div>,
}));
vi.mock('./components/WorkoutLogger/WorkoutLogger', () => ({
  default: vi.fn(() => <div>WorkoutLogger Component</div>),
}));
vi.mock('./components/WorkoutHistory/WorkoutHistory', () => ({
  default: () => <div>WorkoutHistory Component</div>,
}));
vi.mock('./components/Settings/Settings', () => ({
  default: () => <div>Settings Component</div>,
}));
vi.mock('./components/CreateWorkout/CreateWorkout', () => ({
  default: () => <div>CreateWorkout Component</div>,
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Navigation Component/i)).toBeInTheDocument();
  });

  it('renders the AuthManager component', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(AuthManager).toHaveBeenCalled();
  });

  it('renders the Navigation component', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(Navigation).toHaveBeenCalled();
  });

  it('renders the Routes component', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Navigation Component/i)).toBeInTheDocument();
  });

  it('ensures the main application div has the expected Tailwind CSS classes', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    const mainDiv = screen.getByText(/Navigation Component/i).parentElement;
    expect(mainDiv).toHaveClass('min-h-screen', 'bg-gray-100');
  });

  it('renders the Login component when navigating to /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Login Component/i)).toBeInTheDocument();
  });

  it('renders the Signup component when navigating to /signup', () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Signup Component/i)).toBeInTheDocument();
  });

  it('renders the Dashboard component when navigating to /dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Dashboard Component/i)).toBeInTheDocument();
  });

  it('renders the WorkoutLogger component when navigating to /log-workout', () => {
    render(
      <MemoryRouter initialEntries={['/log-workout']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/WorkoutLogger Component/i)).toBeInTheDocument();
  });

  it('passes the userId prop to WorkoutLogger when available', () => {
    render(
      <MemoryRouter initialEntries={['/log-workout']}>
        <App />
      </MemoryRouter>,
    );
    expect(WorkoutLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'test-user-id',
        isInitialized: true,
      }),
      expect.anything(),
    );
  });

  it('renders the WorkoutHistory component when navigating to /history', () => {
    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/WorkoutHistory Component/i)).toBeInTheDocument();
  });

  it('renders the Settings component when navigating to /settings', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Settings Component/i)).toBeInTheDocument();
  });

  it('renders the CreateWorkout component when navigating to /create-workout', () => {
    render(
      <MemoryRouter initialEntries={['/create-workout']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/CreateWorkout Component/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated users from protected routes to /login', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(AuthManager).mockImplementationOnce(({ children }) =>
      children({
        handleLogout: vi.fn(),
        isInitialized: true,
        userId: null,
        isAuthenticated: false,
      }),
    );

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.anything());
  });

  it('passes the isAuthenticated prop to the Navigation component', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(Navigation).toHaveBeenCalledWith(
      expect.objectContaining({
        isAuthenticated: true,
        logout: expect.any(Function),
      }),
      expect.anything(),
    );
  });

  it('passes the logout prop (handleLogout) to the Navigation component', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(Navigation).toHaveBeenCalledWith(
      expect.objectContaining({
        logout: expect.any(Function),
      }),
      expect.anything(),
    );
  });

  it('passes the isInitialized prop to WorkoutLogger', () => {
    render(
      <MemoryRouter initialEntries={['/log-workout']}>
        <App />
      </MemoryRouter>,
    );
    expect(WorkoutLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        isInitialized: true,
      }),
      expect.anything(),
    );
  });
});
