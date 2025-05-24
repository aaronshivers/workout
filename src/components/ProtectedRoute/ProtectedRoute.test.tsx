import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AuthManager from '../AuthManager/AuthManager'; // Import AuthManager to mock it

// Mock AuthManager to control its props (isAuthenticated, isInitialized)
let mockIsAuthenticated: boolean;
let mockIsInitialized: boolean;
let mockUserId: string | null; // Not directly used by ProtectedRoute, but part of AuthManager's children prop
const mockHandleLogout = vi.fn(); // Not directly used by ProtectedRoute, but part of AuthManager's children prop

vi.mock('../AuthManager/AuthManager', () => ({
  default: vi.fn(({ children }) => {
    return (
      <div data-testid="mock-auth-manager-for-protected-route">
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

// Mock the Navigate component from react-router-dom to assert on its 'to' prop
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => (
      <div data-testid="mock-navigate" data-to={to}></div>
    )),
  };
});

describe('ProtectedRoute', () => {
  const TestComponent: React.FC = () => (
    <div data-testid="test-component">Protected Content</div>
  );

  beforeEach(() => {
    // Reset mocks and state before each test
    vi.clearAllMocks();
    mockIsAuthenticated = false; // Default to not authenticated
    mockIsInitialized = false; // Default to not initialized
    mockUserId = null;
  });

  it('renders null when AuthManager is not initialized', async () => {
    mockIsInitialized = false;
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>,
    );

    // Expect AuthManager to be called
    expect(AuthManager).toHaveBeenCalledTimes(1);

    // Expect no children or Navigate to be rendered initially
    expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    // Since it returns null, there won't be a direct element to query in the DOM for ProtectedRoute itself
  });

  it('redirects to /login when not authenticated and initialized', async () => {
    mockIsInitialized = true;
    mockIsAuthenticated = false; // Not authenticated
    render(
      <MemoryRouter initialEntries={['/some-protected-path']}>
        {' '}
        {/* Simulate being on a protected path */}
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>,
    );

    await waitFor(() => {
      // Expect Navigate to be called with /login
      expect(screen.getByTestId('mock-navigate')).toHaveAttribute(
        'data-to',
        '/login',
      );
      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    });
  });

  it('renders children when authenticated and initialized', async () => {
    mockIsInitialized = true;
    mockIsAuthenticated = true; // Authenticated
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        {' '}
        {/* Simulate being on a protected path */}
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>,
    );

    await waitFor(() => {
      // Expect the children component to be rendered
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    });
  });

  it('does not redirect if AuthManager is initializing (isInitialized is false)', async () => {
    mockIsInitialized = false; // Simulating initial state
    mockIsAuthenticated = false; // Even if not authenticated, shouldn't redirect yet

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>,
    );

    // Give it a moment, but it should still be null or loading, not redirecting
    await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay to allow potential redirects
    expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
    expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
  });
});
