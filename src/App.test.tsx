import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App'; // Import the App component itself

// Import the actual components. Vitest's vi.mock will replace these imports
// with our mocked versions defined below.
import AuthManager from './components/AuthManager/AuthManager';
import Navigation from './components/Navigation/Navigation';
import Login from './Pages/LoginPage/LoginPage';
import Dashboard from './components/Dashboard/Dashboard';
import WorkoutLogger from './components/WorkoutLogger/WorkoutLogger';
import WorkoutHistory from './components/WorkoutHistory/WorkoutHistory';
import Settings from './components/Settings/Settings';
import CreateWorkout from './components/CreateWorkout/CreateWorkout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Mock specific components used by App.tsx
vi.mock('./components/Login/Login', () => ({
  default: vi.fn(() => (
    <div data-testid="login-component">Login Component</div>
  )),
}));
vi.mock('./components/Dashboard/Dashboard', () => ({
  default: vi.fn(() => (
    <div data-testid="dashboard-component">Dashboard Component</div>
  )),
}));
vi.mock('./components/WorkoutLogger/WorkoutLogger', () => ({
  default: vi.fn(({ userId, isInitialized }) => (
    <div data-testid="workout-logger-component">
      WorkoutLogger Component
      <span data-testid="wl-userid">{userId}</span>
      <span data-testid="wl-isinitialized">{isInitialized.toString()}</span>
    </div>
  )),
}));
vi.mock('./components/WorkoutHistory/WorkoutHistory', () => ({
  default: vi.fn(() => (
    <div data-testid="workout-history-component">WorkoutHistory Component</div>
  )),
}));
vi.mock('./components/Settings/Settings', () => ({
  default: vi.fn(() => (
    <div data-testid="settings-component">Settings Component</div>
  )),
}));
vi.mock('./components/CreateWorkout/CreateWorkout', () => ({
  default: vi.fn(() => (
    <div data-testid="create-workout-component">CreateWorkout Component</div>
  )),
}));

// Mock AuthManager to control isAuthenticated and isInitialized state for tests
let mockIsAuthenticated: boolean;
let mockIsInitialized: boolean;
let mockUserId: string | null;
const mockHandleLogout = vi.fn();

vi.mock('./components/AuthManager/AuthManager', () => ({
  default: vi.fn(({ children }) => {
    return (
      <div data-testid="mock-auth-manager">
        {children({
          isAuthenticated: mockIsAuthenticated,
          isInitialized: mockIsInitialized,
          userId: mockUserId,
          handleLogout: mockHandleLogout,
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

// Mock ProtectedRoute to simplify App.test.tsx. We test ProtectedRoute separately.
vi.mock('./components/ProtectedRoute/ProtectedRoute', () => ({
  default: vi.fn(({ children }) => {
    if (!mockIsInitialized) {
      return null; // Simulate ProtectedRoute returning null if not initialized
    }
    if (!mockIsAuthenticated) {
      // Simulate ProtectedRoute redirecting to /login if not authenticated
      return <div data-testid="mock-navigate" data-to="/login"></div>;
    }
    return <div data-testid="mock-protected-route">{children}</div>; // Render children if authenticated and initialized
  }),
}));

// Mock useNavigate from react-router-dom for redirect tests
const mockUseNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('react-router-dom');
  return {
    ...actual,
    useNavigate: (): Mock => mockUseNavigate,
    // Mock the Navigate component directly to capture its 'to' prop
    Navigate: vi.fn(({ to }) => (
      <div data-testid="mock-navigate" data-to={to}></div>
    )),
  };
});

describe('App Component', () => {
  beforeEach((): void => {
    // Reset mock states for AuthManager
    mockIsAuthenticated = true; // Default to authenticated for most tests unless overridden
    mockIsInitialized = true; // Default to initialized for most tests unless overridden
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

  it('renders the Login component when navigating to /login and not authenticated', async (): Promise<void> => {
    mockIsAuthenticated = false; // Not authenticated
    mockIsInitialized = true; // AuthManager is done initializing
    renderApp(['/login']);
    await waitFor(() => {
      expect(vi.mocked(Login)).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('login-component')).toBeInTheDocument();
    });
  });

  it('renders the Signup component when navigating to /signup and not authenticated', async (): Promise<void> => {
    mockIsAuthenticated = false; // Not authenticated
    mockIsInitialized = true; // AuthManager is done initializing
    renderApp(['/signup']);
    await waitFor(() => {
      expect(vi.mocked(Signup)).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('signup-component')).toBeInTheDocument();
    });
  });

  it('renders the Dashboard component when navigating to /dashboard and authenticated', async (): Promise<void> => {
    mockIsAuthenticated = true; // Authenticated
    mockIsInitialized = true; // AuthManager is done initializing
    renderApp(['/dashboard']);
    await waitFor(() => {
      expect(vi.mocked(ProtectedRoute)).toHaveBeenCalledTimes(1); // ProtectedRoute wraps it
      expect(vi.mocked(Dashboard)).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
    });
  });

  it('renders the WorkoutLogger component when navigating to /log-workout and authenticated', async (): Promise<void> => {
    mockIsAuthenticated = true; // Authenticated
    mockIsInitialized = true; // AuthManager is done initializing
    renderApp(['/log-workout']);
    await waitFor(() => {
      expect(vi.mocked(ProtectedRoute)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(WorkoutLogger)).toHaveBeenCalledTimes(1);
      expect(
        screen.getByTestId('workout-logger-component'),
      ).toBeInTheDocument();
    });
  });

  it('passes the userId prop to WorkoutLogger when available', async (): Promise<void> => {
    mockIsAuthenticated = true; // Authenticated
    mockIsInitialized = true; // AuthManager is done initializing
    mockUserId = 'test-user-id';
    renderApp(['/log-workout']);
    await waitFor(() => {
      expect(screen.getByTestId('wl-userid').textContent).toBe('test-user-id');
      expect(vi.mocked(WorkoutLogger)).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'test-user-id' }),
        undefined, // Expect the second argument to be undefined
      );
    });
  });

  it('renders the WorkoutHistory component when navigating to /history and authenticated', async (): Promise<void> => {
    mockIsAuthenticated = true; // Authenticated
    mockIsInitialized = true; // AuthManager is done initializing
    renderApp(['/history']);
    await waitFor(() => {
      expect(vi.mocked(ProtectedRoute)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(WorkoutHistory)).toHaveBeenCalledTimes(1);
      expect(
        screen.getByTestId('workout-history-component'),
      ).toBeInTheDocument();
    });
  });

  it('renders the Settings component when navigating to /settings and authenticated', async (): Promise<void> => {
    mockIsAuthenticated = true; // Authenticated
    mockIsInitialized = true; // AuthManager is done initializing
    renderApp(['/settings']);
    await waitFor(() => {
      expect(vi.mocked(ProtectedRoute)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(Settings)).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('settings-component')).toBeInTheDocument();
    });
  });

  it('renders the CreateWorkout component when navigating to /create-workout and authenticated', async (): Promise<void> => {
    mockIsAuthenticated = true; // Authenticated
    mockIsInitialized = true; // AuthManager is done initializing
    renderApp(['/create-workout']);
    await waitFor(() => {
      expect(vi.mocked(ProtectedRoute)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(CreateWorkout)).toHaveBeenCalledTimes(1);
      expect(
        screen.getByTestId('create-workout-component'),
      ).toBeInTheDocument();
    });
  });

  it('passes the isAuthenticated prop to the Navigation component', async (): Promise<void> => {
    mockIsAuthenticated = true; // Authenticated
    mockIsInitialized = true; // AuthManager is done initializing
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
    mockIsInitialized = true; // Initialized
    renderApp(['/log-workout']);
    await waitFor(() => {
      expect(screen.getByTestId('wl-isinitialized').textContent).toBe('true');
      expect(vi.mocked(WorkoutLogger)).toHaveBeenCalledWith(
        expect.objectContaining({ isInitialized: true }),
        undefined, // Expect the second argument to be undefined
      );
    });
  });

  it('redirects to /login from / if not authenticated and initialized', async () => {
    mockIsInitialized = true;
    mockIsAuthenticated = false; // Not authenticated
    renderApp(['/']);
    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute(
        'data-to',
        '/login',
      );
    });
  });

  it('redirects to /dashboard from / if authenticated and initialized', async () => {
    mockIsInitialized = true;
    mockIsAuthenticated = true; // Authenticated
    renderApp(['/']);
    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute(
        'data-to',
        '/dashboard',
      );
    });
  });

  it('redirects to /dashboard from /login if authenticated and initialized', async () => {
    mockIsInitialized = true;
    mockIsAuthenticated = true; // Authenticated
    renderApp(['/login']);
    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute(
        'data-to',
        '/dashboard',
      );
      expect(vi.mocked(Login)).not.toHaveBeenCalled(); // Login component should not be rendered
    });
  });

  it('redirects to /dashboard from /signup if authenticated and initialized', async () => {
    mockIsInitialized = true;
    mockIsAuthenticated = true; // Authenticated
    renderApp(['/signup']);
    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute(
        'data-to',
        '/dashboard',
      );
      expect(vi.mocked(Signup)).not.toHaveBeenCalled(); // Signup component should not be rendered
    });
  });

  it('redirects to /login from a protected route if not authenticated and initialized', async () => {
    mockIsInitialized = true;
    mockIsAuthenticated = false; // Not authenticated
    renderApp(['/dashboard']); // Trying to access a protected route
    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute(
        'data-to',
        '/login',
      );
      expect(vi.mocked(Dashboard)).not.toHaveBeenCalled(); // Dashboard should not be rendered
    });
  });

  it('redirects to /login from an unknown route if not authenticated and initialized', async () => {
    mockIsInitialized = true;
    mockIsAuthenticated = false; // Not authenticated
    renderApp(['/some-unknown-route']);
    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute(
        'data-to',
        '/login',
      );
    });
  });

  it('redirects to /dashboard from an unknown route if authenticated and initialized', async () => {
    mockIsInitialized = true;
    mockIsAuthenticated = true; // Authenticated
    renderApp(['/another-bad-route']);
    await waitFor(() => {
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute(
        'data-to',
        '/dashboard',
      );
    });
  });

  // Test for preventing login/signup flash when AuthManager is NOT initialized
  it('renders null for /login path while AuthManager is not initialized (prevent flash)', async () => {
    mockIsInitialized = false; // AuthManager is still initializing
    renderApp(['/login']);
    // We expect no redirect and no Login component while initializing
    expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument();
  });

  it('renders null for /signup path while AuthManager is not initialized (prevent flash)', async () => {
    mockIsInitialized = false; // AuthManager is still initializing
    renderApp(['/signup']);
    // We expect no redirect and no Signup component while initializing
    expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('signup-component')).not.toBeInTheDocument();
  });

  it('renders null for root path while AuthManager is not initialized', async () => {
    mockIsInitialized = false; // AuthManager is still initializing
    renderApp(['/']);
    // We expect no redirect and no content while initializing
    expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-component')).not.toBeInTheDocument();
  });

  it('renders null for protected path while AuthManager is not initialized', async () => {
    mockIsInitialized = false; // AuthManager is still initializing
    renderApp(['/dashboard']);
    // We expect no redirect and no content while initializing
    expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-component')).not.toBeInTheDocument();
  });

  it('renders null for unknown path while AuthManager is not initialized', async () => {
    mockIsInitialized = false; // AuthManager is still initializing
    renderApp(['/some-random-path']);
    // We expect no redirect and no content while initializing
    expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-component')).not.toBeInTheDocument();
  });
});
