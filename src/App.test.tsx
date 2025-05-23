import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App'; // Import the App component itself

// Import the actual components. Vitest's vi.mock will replace these imports
// with our mocked versions defined below.
import AuthManager from './components/AuthManager/AuthManager';
import Navigation from './components/Navigation/Navigation';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import WorkoutLogger from './components/WorkoutLogger/WorkoutLogger';
import WorkoutHistory from './components/WorkoutHistory/WorkoutHistory';
import Settings from './components/Settings/Settings';
import CreateWorkout from './components/CreateWorkout/CreateWorkout';

// Mock specific components used by App.tsx
vi.mock('./components/Login/Login', () => ({
  default: vi.fn(() => <div>Login Component</div>),
}));
vi.mock('./components/Signup/Signup', () => ({
  default: vi.fn(() => <div>Signup Component</div>),
}));
vi.mock('./components/Dashboard/Dashboard', () => ({
  default: vi.fn(() => <div>Dashboard Component</div>),
}));
vi.mock('./components/WorkoutLogger/WorkoutLogger', () => ({
  default: vi.fn(({ userId, isInitialized }) => (
    <div>
      WorkoutLogger Component
      <span data-testid="wl-userid">{userId}</span>
      <span data-testid="wl-isinitialized">{isInitialized.toString()}</span>
    </div>
  )),
}));
vi.mock('./components/WorkoutHistory/WorkoutHistory', () => ({
  default: vi.fn(() => <div>WorkoutHistory Component</div>),
}));
vi.mock('./components/Settings/Settings', () => ({
  default: vi.fn(() => <div>Settings Component</div>),
}));
vi.mock('./components/CreateWorkout/CreateWorkout', () => ({
  default: vi.fn(() => <div>CreateWorkout Component</div>),
}));

// Mock AuthManager to control isAuthenticated and isInitialized state for tests
let mockIsInitialized: boolean;
let mockUserId: string | null;
const mockHandleLogout = vi.fn();

vi.mock('./components/AuthManager/AuthManager', () => ({
  default: vi.fn(({ children }) => {
    return (
      <div data-testid="mock-auth-manager">
        {children({
          handleLogout: mockHandleLogout,
          isInitialized: mockIsInitialized,
          userId: mockUserId,
        })}
      </div>
    );
  }),
}));

vi.mock('./components/Navigation/Navigation', () => ({
  default: vi.fn(({ isAuthenticated, logout }) => (
    <nav data-testid="mock-navigation">
      <span data-testid="nav-is-authenticated">
        {isAuthenticated.toString()}
      </span>
      <button data-testid="nav-logout-button" onClick={logout}>
        Logout
      </button>
      Navigation Component Mock
    </nav>
  )),
}));

// Mock useNavigate from react-router-dom for redirect tests
const mockUseNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('react-router-dom');
  return {
    ...actual,
    useNavigate: (): Mock => mockUseNavigate,
    // Mock the Navigate component directly to capture its 'to' prop
    Navigate: vi.fn(({ to }) => <div data-testid="mock-navigate" data-to={to}></div>),
  };
});

describe('App Component', () => {
  beforeEach((): void => {
    // Reset mock states for AuthManager
    mockIsInitialized = true; // Default to true for most tests unless overridden
    mockUserId = 'test-user-id';
    // Clear all mocks before each test.
    vi.clearAllMocks();
    mockHandleLogout.mockClear();
    mockUseNavigate.mockClear();
  });

  const renderApp = (initialEntries: string[] = ['/']): void => {
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>,
    );
  };

  it('renders without crashing', (): void => {
    renderApp();
    expect(screen.getByTestId('app-container')).toBeInTheDocument();
  });

  it('renders the AuthManager component', (): void => {
    renderApp();
    // Use vi.mocked() on the imported component to assert on its mock calls
    expect(vi.mocked(AuthManager)).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mock-auth-manager')).toBeInTheDocument();
  });

  it('renders the Navigation component', async (): Promise<void> => {
    renderApp();
    await waitFor(() => {
      expect(vi.mocked(Navigation)).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('mock-navigation')).toBeInTheDocument();
    });
  });

  it('renders the Routes component', (): void => {
    renderApp();
    // This test implicitly checks the Routes component by verifying the AuthManager's children rendering.
    expect(screen.getByTestId('mock-auth-manager')).toBeInTheDocument();
  });

  it('ensures the main application div has the expected Tailwind CSS classes', (): void => {
    renderApp();
    const appContainer = screen.getByTestId('app-container');
    expect(appContainer).toHaveClass(
      'min-h-screen',
      'bg-gray-100',
      'text-gray-900',
      'flex',
      'flex-col',
      'items-center',
      'justify-start',
    );
  });

  it('renders the Login component when navigating to /login', async (): Promise<void> => {
    renderApp(['/login']);
    await waitFor(() => {
      expect(vi.mocked(Login)).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Login Component')).toBeInTheDocument();
    });
  });

  it('renders the Signup component when navigating to /signup', async (): Promise<void> => {
    renderApp(['/signup']);
    await waitFor(() => {
      expect(vi.mocked(Signup)).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Signup Component')).toBeInTheDocument();
    });
  });

  it('renders the Dashboard component when navigating to /dashboard', async (): Promise<void> => {
    renderApp(['/dashboard']);
    await waitFor(() => {
      expect(vi.mocked(Dashboard)).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
    });
  });

  it('renders the WorkoutLogger component when navigating to /log-workout', async (): Promise<void> => {
    renderApp(['/log-workout']);
    await waitFor(() => {
      expect(vi.mocked(WorkoutLogger)).toHaveBeenCalledTimes(1);
      expect(screen.getByText('WorkoutLogger Component')).toBeInTheDocument();
    });
  });

  it('passes the userId prop to WorkoutLogger when available', async (): Promise<void> => {
    renderApp(['/log-workout']);
    await waitFor(() => {
      expect(screen.getByTestId('wl-userid').textContent).toBe('test-user-id');
      expect(vi.mocked(WorkoutLogger)).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'test-user-id' }),
        undefined, // Expect the second argument to be undefined
      );
    });
  });

  it('renders the WorkoutHistory component when navigating to /history', async (): Promise<void> => {
    renderApp(['/history']);
    await waitFor(() => {
      expect(vi.mocked(WorkoutHistory)).toHaveBeenCalledTimes(1);
      expect(screen.getByText('WorkoutHistory Component')).toBeInTheDocument();
    });
  });

  it('renders the Settings component when navigating to /settings', async (): Promise<void> => {
    renderApp(['/settings']);
    await waitFor(() => {
      expect(vi.mocked(Settings)).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Settings Component')).toBeInTheDocument();
    });
  });

  it('renders the CreateWorkout component when navigating to /create-workout', async (): Promise<void> => {
    renderApp(['/create-workout']);
    await waitFor(() => {
      expect(vi.mocked(CreateWorkout)).toHaveBeenCalledTimes(1);
      expect(screen.getByText('CreateWorkout Component')).toBeInTheDocument();
    });
  });

  it('passes the isAuthenticated prop to the Navigation component', async (): Promise<void> => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByTestId('nav-is-authenticated').textContent).toBe(
        'true',
      );
      expect(vi.mocked(Navigation)).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: true }),
        undefined, // Expect the second argument to be undefined
      );
    });
  });

  it('passes the logout prop (handleLogout) to the Navigation component', async (): Promise<void> => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByTestId('nav-logout-button')).toBeInTheDocument();
      expect(vi.mocked(Navigation)).toHaveBeenCalledWith(
        expect.objectContaining({ logout: expect.any(Function) }),
        undefined, // Expect the second argument to be undefined
      );
    });
  });

  it('passes the isInitialized prop to WorkoutLogger', async (): Promise<void> => {
    renderApp(['/log-workout']);
    await waitFor(() => {
      expect(screen.getByTestId('wl-isinitialized').textContent).toBe('true');
      expect(vi.mocked(WorkoutLogger)).toHaveBeenCalledWith(
        expect.objectContaining({ isInitialized: true }),
        undefined, // Expect the second argument to be undefined
      );
    });
  });

  // --- New tests for default and fallback routes ---

  it('redirects to /login from / if not initialized', async () => {
    mockIsInitialized = false; // Set AuthManager to not initialized
    renderApp(['/']);
    await waitFor(() => {
      // Check that the Navigate component was rendered with the correct 'to' prop
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/login');
    });
  });

  it('redirects to /dashboard from / if initialized', async () => {
    mockIsInitialized = true; // Set AuthManager to initialized
    renderApp(['/']);
    await waitFor(() => {
      // Check that the Navigate component was rendered with the correct 'to' prop
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/dashboard');
    });
  });

  it('redirects to /login from an unknown route if not initialized', async () => {
    mockIsInitialized = false; // Set AuthManager to not initialized
    renderApp(['/some-unknown-route']);
    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/login');
    });
  });

  it('redirects to /dashboard from an unknown route if initialized', async () => {
    mockIsInitialized = true; // Set AuthManager to initialized
    renderApp(['/another-bad-route']);
    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/dashboard');
    });
  });
});
