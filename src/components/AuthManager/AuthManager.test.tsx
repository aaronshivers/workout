import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  afterEach,
  type Mock,
} from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthManager } from './AuthManager';
import supabase from '../../utils/supabase';
import type {
  Session,
  User,
  AuthChangeEvent,
  AuthError,
  Subscription,
} from '@supabase/supabase-js';
import type { JSX } from 'react';

// Mock the Supabase client
vi.mock('../../utils/supabase', () => ({
  default: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

// Define an interface for the mocked localStorage object
interface IMockLocalStorage {
  getItem: Mock<(key: string) => string | null>;
  setItem: Mock<(key: string, value: string) => void>;
  removeItem: Mock<(key: string) => void>;
  clear: Mock<() => void>;
}

// Mock localStorage
const localStorageMock = ((): IMockLocalStorage => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string): string | null => store[key] || null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key];
    }),
    clear: vi.fn((): void => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('AuthManager', () => {
  // Helper to create a mock AuthError that extends Error
  const createMockAuthError = (
    message: string,
    code: string = '500',
    status: number = 500,
  ): AuthError => {
    // Create a real Error instance and then augment it with AuthError public properties
    const error = new Error(message) as AuthError; // Cast to AuthError directly
    error.name = 'AuthApiError';
    error.code = code;
    error.status = status;
    return error;
  };

  const mockChild = vi.fn(
    ({ isAuthenticated, userId, isInitialized, handleLogout }): JSX.Element => (
      <div>
        <span data-testid="is-authenticated">{isAuthenticated.toString()}</span>
        <span data-testid="user-id">{userId || 'null'}</span>
        <span data-testid="is-initialized">{isInitialized.toString()}</span>
        <button data-testid="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    ),
  );

  let onAuthStateChangeCallback:
    | ((event: AuthChangeEvent, session: Session | null) => void)
    | undefined;

  beforeEach((): void => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    localStorageMock.clear();

    // Default mock for onAuthStateChange: It only provides the subscription.
    // Individual tests will trigger the callback explicitly with the desired initial state.
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(
      (callback) => {
        onAuthStateChangeCallback = callback;
        return {
          data: {
            subscription: {
              id: 'mock-subscription-id',
              callback: vi.fn(),
              unsubscribe: vi.fn(),
            } as Subscription,
          },
        };
      },
    );
    // Default mock for getUser: No user means an AuthError, aligning with UserResponse type.
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: createMockAuthError('No active session', '400', 400),
    });
    // Default mock for getSession
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  afterEach((): void => {
    onAuthStateChangeCallback = undefined;
  });

  it('renders its children when not initialized', async (): Promise<void> => {
    render(<AuthManager>{mockChild}</AuthManager>);
    expect(mockChild).toHaveBeenCalledWith(
      expect.objectContaining({ isInitialized: false }),
    );
    // Trigger initial state from onAuthStateChange
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
    });
  });

  it('sets isInitialized to true after successful initialization', async (): Promise<void> => {
    render(<AuthManager>{mockChild}</AuthManager>);
    // Trigger initial state from onAuthStateChange
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
    });
  });

  it('sets userId to null if no authentication token is found on initialization', async (): Promise<void> => {
    render(<AuthManager>{mockChild}</AuthManager>);
    // Trigger initial state from onAuthStateChange
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });
    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('null');
    });
  });

  it('sets userId to the correct ID if a valid authentication token is found on initialization', async (): Promise<void> => {
    const mockSession = {
      user: { id: 'test-user-id' } as User,
      access_token: 'valid-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'refresh-token',
    };

    // Mock getUser to return the validated user BEFORE triggering the auth state change
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('test-user-id');
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });
  });

  it('handles an invalid or expired authentication token on initialization', async (): Promise<void> => {
    const invalidSession = {
      user: { id: 'invalid-user-id' } as User,
      access_token: 'invalid-token',
      token_type: 'Bearer',
      expires_in: 0,
      expires_at: 1234567890,
      refresh_token: 'refresh-token',
    };

    // Mock getUser to return data with a null user and an error
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: createMockAuthError('Invalid token', '401', 401),
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    render(<AuthManager>{mockChild}</AuthManager>);
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', invalidSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user-id').textContent).toBe('null');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'supabase.auth.token',
      );
    });
  });

  it('updates isAuthenticated to true when a login event occurs', async (): Promise<void> => {
    render(<AuthManager>{mockChild}</AuthManager>);
    // Initial state
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    });

    const mockSession = {
      user: { id: 'user-123' } as User,
      access_token: 'valid-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'refresh-token',
    };

    // Mock getUser to return the validated user after login
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: mockSession.user },
      error: null,
    });

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });
  });

  it('updates userId to the correct ID when a login event occurs', async (): Promise<void> => {
    render(<AuthManager>{mockChild}</AuthManager>);
    // Initial state
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
      expect(screen.getByTestId('user-id').textContent).toBe('null');
    });

    const mockSession = {
      user: { id: 'user-456' } as User,
      access_token: 'valid-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'refresh-token',
    };

    // Mock getUser to return the validated user after login
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: mockSession.user },
      error: null,
    });

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('user-456');
    });
  });

  it('updates isAuthenticated to false when a logout event occurs', async (): Promise<void> => {
    const initialSession = {
      user: { id: 'user-initial' } as User,
      access_token: 'initial-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'initial-refresh',
    };
    render(<AuthManager>{mockChild}</AuthManager>);

    // Mock getUser for the initial SIGNED_IN state
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: initialSession.user },
      error: null,
    });

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', initialSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    });
  });

  it('sets userId to null when a logout event occurs', async (): Promise<void> => {
    const initialSession = {
      user: { id: 'user-initial' } as User,
      access_token: 'initial-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'initial-refresh',
    };
    render(<AuthManager>{mockChild}</AuthManager>);

    // Mock getUser for the initial SIGNED_IN state
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: initialSession.user },
      error: null,
    });

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', initialSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('user-initial');
    });

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('null');
    });
  });

  it('clears the authentication token from storage on logout', async (): Promise<void> => {
    const initialSession = {
      user: { id: 'user-initial' } as User,
      access_token: 'initial-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'initial-refresh',
    };
    render(<AuthManager>{mockChild}</AuthManager>);

    // Mock getUser for the initial SIGNED_IN state
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: initialSession.user },
      error: null,
    });
    localStorageMock.setItem(
      'supabase.auth.token',
      JSON.stringify(initialSession),
    );

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', initialSession);
    });

    await waitFor(() => {
      expect(localStorageMock.getItem('supabase.auth.token')).not.toBeNull();
    });

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'supabase.auth.token',
      );
    });
  });

  it('passes handleLogout function to its children', async (): Promise<void> => {
    render(<AuthManager>{mockChild}</AuthManager>);
    // Initial state
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });
    await waitFor(() => {
      expect(mockChild).toHaveBeenCalledWith(
        expect.objectContaining({
          handleLogout: expect.any(Function),
        }),
      );
    });
  });

  it('passes isInitialized boolean to its children', async (): Promise<void> => {
    render(<AuthManager>{mockChild}</AuthManager>);
    // Initial state
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });
    await waitFor(() => {
      expect(mockChild).toHaveBeenCalledWith(
        expect.objectContaining({
          isInitialized: true,
        }),
      );
    });
  });

  it('passes userId to its children', async (): Promise<void> => {
    const mockSession = {
      user: { id: 'child-user-id' } as User,
      access_token: 'valid-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'refresh-token',
    };

    // Mock getUser to return the validated user
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: mockSession.user },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);
    // Initial state: signed in
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(mockChild).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'child-user-id',
        }),
      );
    });
  });

  it('stores the authentication token in local storage on successful login', async (): Promise<void> => {
    render(<AuthManager>{mockChild}</AuthManager>);
    // Initial state
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
    });

    const mockSession = {
      user: { id: 'storage-user' } as User,
      access_token: 'storage-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'storage-refresh',
    };

    // Mock getUser to return the validated user
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: mockSession.user },
      error: null,
    });

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        JSON.stringify(mockSession),
      );
    });
  });

  it('retrieves the authentication token from storage on component mount', async (): Promise<void> => {
    const storedSession = {
      user: { id: 'stored-user-id' } as User,
      access_token: 'stored-valid-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'stored-refresh-token',
    };
    // Simulate localStorage having the token before render
    localStorageMock.setItem(
      'supabase.auth.token',
      JSON.stringify(storedSession),
    );

    // Mock getUser to return the validated user from stored session
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: storedSession.user },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);
    await act(async () => {
      onAuthStateChangeCallback!('INITIAL_SESSION', storedSession);
    });

    await waitFor(() => {
      // getSession should NOT be called by AuthManager itself, as it relies on onAuthStateChange
      expect(supabase.auth.getSession).not.toHaveBeenCalled();
      expect(screen.getByTestId('user-id').textContent).toBe('stored-user-id');
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });
  });

  it('removes the authentication token from storage if invalid on initialization', async (): Promise<void> => {
    const invalidSession = {
      user: { id: 'invalid-user' } as User,
      access_token: 'invalid-token',
      token_type: 'Bearer',
      expires_in: 0,
      expires_at: 1234567890,
      refresh_token: 'invalid-refresh',
    };
    localStorageMock.setItem(
      'supabase.auth.token',
      JSON.stringify(invalidSession),
    );

    // Mock getUser to return data with a null user and an error, aligning with UserResponse type
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: createMockAuthError('Token expired', '401', 401),
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    render(<AuthManager>{mockChild}</AuthManager>);
    await act(async () => {
      onAuthStateChangeCallback!('INITIAL_SESSION', invalidSession);
    });

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'supabase.auth.token',
      );
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user-id').textContent).toBe('null');
    });
  });

  it('handles logout via handleLogout function', async (): Promise<void> => {
    const initialSession = {
      user: { id: 'user-to-logout' } as User,
      access_token: 'token-to-logout',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'refresh-to-logout',
    };
    render(<AuthManager>{mockChild}</AuthManager>);

    // Mock getUser for the initial SIGNED_IN state
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: initialSession.user },
      error: null,
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', initialSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });

    await act(async () => {
      // Get the handleLogout function from the rendered child props
      const handleLogoutFromProps =
        mockChild.mock.calls[mockChild.mock.calls.length - 1][0].handleLogout;
      await handleLogoutFromProps();
    });

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'supabase.auth.token',
      );
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user-id').textContent).toBe('null');
    });
  });

  it('handles errors during logout gracefully', async (): Promise<void> => {
    const initialSession = {
      user: { id: 'error-user' } as User,
      access_token: 'error-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'error-refresh',
    };
    render(<AuthManager>{mockChild}</AuthManager>);

    // Mock getUser for the initial SIGNED_IN state
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: initialSession.user },
      error: null,
    });
    // Mock signOut to reject to simulate an error
    vi.mocked(supabase.auth.signOut).mockRejectedValue(
      createMockAuthError('Logout failed', '500', 500),
    );
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', initialSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });

    await act(async () => {
      // Get the handleLogout function from the rendered child props
      const handleLogoutFromProps =
        mockChild.mock.calls[mockChild.mock.calls.length - 1][0].handleLogout;
      await handleLogoutFromProps();
    });

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
      // Find the specific call that matches our expected error message
      const logoutErrorCall = consoleErrorSpy.mock.calls.find(
        (call) =>
          call[0] === 'Error during logout:' && call[1] instanceof Error,
      );
      expect(logoutErrorCall).toBeDefined(); // Ensure such a call exists
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user-id').textContent).toBe('null');
    });
    consoleErrorSpy.mockRestore();
  });

  it('handles rapid successive authentication state changes gracefully', async (): Promise<void> => {
    render(<AuthManager>{mockChild}</AuthManager>);
    // Initial state
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
    });

    const mockSession = {
      user: { id: 'user-rapid' } as User,
      access_token: 'rapid-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'rapid-refresh',
    };

    // Mock getUser for each state change
    vi.mocked(supabase.auth.getUser)
      .mockResolvedValueOnce({ data: { user: mockSession.user }, error: null }) // For SIGNED_IN
      .mockResolvedValueOnce({
        data: { user: null },
        error: createMockAuthError('No active session', '400', 400),
      }); // For SIGNED_OUT

    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', mockSession);
    });
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user-id').textContent).toBe('null');
    });
  });

  it('does not re-initialize or re-fetch token unnecessarily', async (): Promise<void> => {
    render(<AuthManager>{mockChild}</AuthManager>);
    // Initial state
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
      // getSession should NOT be called by AuthManager itself, as it relies on onAuthStateChange
      expect(supabase.auth.getSession).not.toHaveBeenCalled();
    });

    // Simulate a re-render without re-mounting (e.g., parent state change)
    const { rerender } = render(<AuthManager>{mockChild}</AuthManager>);
    rerender(<AuthManager>{mockChild}</AuthManager>);

    await waitFor(() => {
      // getSession should still NOT be called, as the component only initializes once via onAuthStateChange
      expect(supabase.auth.getSession).not.toHaveBeenCalled();
    });
  });
});
