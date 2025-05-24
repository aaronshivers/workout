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

    // Mock onAuthStateChange to capture the callback, but not trigger it initially
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

    // Default mocks for getSession and getUser
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: createMockAuthError('No active session', '400', 400),
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    // Clear mockChild calls for each test
    mockChild.mockClear();
  });

  afterEach((): void => {
    onAuthStateChangeCallback = undefined;
  });

  // Test 1: Renders its children when not initialized
  it('renders its children when not initialized', async (): Promise<void> => {
    // No initial session, so AuthManager will start uninitialized
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);

    // Initially, it should render with isInitialized: false
    expect(mockChild).toHaveBeenCalledWith(
      expect.objectContaining({ isInitialized: false }),
    );

    // Wait for the initial session check to complete
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
    });

    // After initialization, it should be called again with isInitialized: true
    expect(mockChild).toHaveBeenCalledWith(
      expect.objectContaining({ isInitialized: true }),
    );
  });

  // Test 2: Sets isInitialized to true after successful initialization
  it('sets isInitialized to true after successful initialization', async (): Promise<void> => {
    // Simulate no initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);

    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
    });
  });

  // Test 3: Sets userId to null if no authentication token is found on initialization
  it('sets userId to null if no authentication token is found on initialization', async (): Promise<void> => {
    // Simulate no initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);

    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('null');
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    });
  });

  // Test 4: Sets userId to the correct ID if a valid authentication token is found on initialization
  it('sets userId to the correct ID if a valid authentication token is found on initialization', async (): Promise<void> => {
    const mockSession = {
      user: { id: 'test-user-id', email: 'test@example.com' } as User,
      access_token: 'valid-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'refresh-token',
    };

    // Mock getSession to return a valid session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });
    // Mock getUser to return the user from that session
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: mockSession.user },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);

    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('test-user-id');
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });
  });

  // Test 5: Handles an invalid or expired authentication token on initialization
  it('handles an invalid or expired authentication token on initialization', async (): Promise<void> => {
    const invalidSession = {
      user: { id: 'invalid-user-id' } as User,
      access_token: 'invalid-token',
      token_type: 'Bearer',
      expires_in: 0,
      expires_at: 1234567890,
      refresh_token: 'refresh-token',
    };

    // Mock getSession to return an invalid session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: invalidSession },
      error: null,
    });
    // Mock getUser to return data with a null user and an error
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: createMockAuthError('Invalid token', '401', 401),
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    render(<AuthManager>{mockChild}</AuthManager>);

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user-id').textContent).toBe('null');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'supabase.auth.token',
      );
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1); // Should sign out on validation failure
    });
  });

  // Test 6: Updates isAuthenticated to true when a login event occurs (via onAuthStateChange)
  it('updates isAuthenticated to true when a login event occurs', async (): Promise<void> => {
    // Simulate no initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    });

    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' } as User,
      access_token: 'valid-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'refresh-token',
    };

    // Trigger the SIGNED_IN event
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });
  });

  // Test 7: Updates userId to the correct ID when a login event occurs (via onAuthStateChange)
  it('updates userId to the correct ID when a login event occurs', async (): Promise<void> => {
    // Simulate no initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);
    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('null');
    });

    const mockSession = {
      user: { id: 'user-456', email: 'test@example.com' } as User,
      access_token: 'valid-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'refresh-token',
    };

    // Trigger the SIGNED_IN event
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('user-456');
    });
  });

  // Test 8: Updates isAuthenticated to false when a logout event occurs (via onAuthStateChange)
  it('updates isAuthenticated to false when a logout event occurs', async (): Promise<void> => {
    const initialSession = {
      user: { id: 'user-initial', email: 'test@example.com' } as User,
      access_token: 'initial-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'initial-refresh',
    };
    // Simulate initial authenticated session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: initialSession },
      error: null,
    });
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: initialSession.user },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });

    // Trigger the SIGNED_OUT event
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    });
  });

  // Test 9: Sets userId to null when a logout event occurs (via onAuthStateChange)
  it('sets userId to null when a logout event occurs', async (): Promise<void> => {
    const initialSession = {
      user: { id: 'user-initial', email: 'test@example.com' } as User,
      access_token: 'initial-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'initial-refresh',
    };
    // Simulate initial authenticated session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: initialSession },
      error: null,
    });
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: initialSession.user },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);
    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('user-initial');
    });

    // Trigger the SIGNED_OUT event
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('null');
    });
  });

  // Test 10: Clears the authentication token from storage on logout (via onAuthStateChange)
  it('clears the authentication token from storage on logout', async (): Promise<void> => {
    const initialSession = {
      user: { id: 'user-initial', email: 'test@example.com' } as User,
      access_token: 'initial-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'initial-refresh',
    };
    // Simulate initial authenticated session and localStorage
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: initialSession },
      error: null,
    });
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: initialSession.user },
      error: null,
    });
    localStorageMock.setItem(
      'supabase.auth.token',
      JSON.stringify(initialSession),
    );

    render(<AuthManager>{mockChild}</AuthManager>);
    await waitFor(() => {
      expect(localStorageMock.getItem('supabase.auth.token')).not.toBeNull();
    });

    // Trigger the SIGNED_OUT event
    await act(async () => {
      onAuthStateChangeCallback!('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'supabase.auth.token',
      );
    });
  });

  // Test 11: Passes handleLogout function to its children
  it('passes handleLogout function to its children', async (): Promise<void> => {
    // Simulate no initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);
    await waitFor(() => {
      expect(mockChild).toHaveBeenCalledWith(
        expect.objectContaining({
          handleLogout: expect.any(Function),
        }),
      );
    });
  });

  // Test 12: Passes isInitialized boolean to its children
  it('passes isInitialized boolean to its children', async (): Promise<void> => {
    // Simulate no initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);
    await waitFor(() => {
      // Expect the child to be called with isInitialized true after initial check
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
    });
  });

  // Test 13: Passes userId to its children
  it('passes userId to its children', async (): Promise<void> => {
    const mockSession = {
      user: { id: 'child-user-id', email: 'test@example.com' } as User,
      access_token: 'valid-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'refresh-token',
    };

    // Mock getSession to return a valid session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });
    // Mock getUser to return the user from that session
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: mockSession.user },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);

    await waitFor(() => {
      expect(screen.getByTestId('user-id').textContent).toBe('child-user-id');
    });
  });

  // Test 14: Stores the authentication token in local storage on successful login (via onAuthStateChange)
  it('stores the authentication token in local storage on successful login', async (): Promise<void> => {
    // Simulate no initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
    });

    const mockSession = {
      user: { id: 'storage-user', email: 'test@example.com' } as User,
      access_token: 'storage-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'storage-refresh',
    };

    // Trigger the SIGNED_IN event
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

  // Test 15: Retrieves the authentication token from storage on component mount
  it('retrieves the authentication token from storage on component mount', async (): Promise<void> => {
    const storedSession = {
      user: { id: 'stored-user-id', email: 'test@example.com' } as User,
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

    // Mock getSession to return the stored session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: storedSession },
      error: null,
    });
    // Mock getUser to return the validated user from stored session
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: storedSession.user },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);

    await waitFor(() => {
      // getSession should be called once on mount
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('user-id').textContent).toBe('stored-user-id');
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });
  });

  // Test 16: Removes the authentication token from storage if invalid on initialization
  it('removes the authentication token from storage if invalid on initialization', async (): Promise<void> => {
    const invalidSession = {
      user: { id: 'invalid-user', email: 'test@example.com' } as User,
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

    // Mock getSession to return the invalid session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: invalidSession },
      error: null,
    });
    // Mock getUser to return data with a null user and an error, aligning with UserResponse type
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: createMockAuthError('Token expired', '401', 401),
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    render(<AuthManager>{mockChild}</AuthManager>);

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'supabase.auth.token',
      );
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user-id').textContent).toBe('null');
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });
  });

  // Test 17: Handles logout via handleLogout function
  it('handles logout via handleLogout function', async (): Promise<void> => {
    const initialSession = {
      user: { id: 'user-to-logout', email: 'test@example.com' } as User,
      access_token: 'token-to-logout',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'refresh-to-logout',
    };
    // Simulate initial authenticated session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: initialSession },
      error: null,
    });
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: initialSession.user },
      error: null,
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    render(<AuthManager>{mockChild}</AuthManager>);

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });

    await act(async () => {
      // Get the handleLogout function from the rendered child props
      const handleLogoutFromProps =
        mockChild.mock.calls[mockChild.mock.calls.length - 1][0].handleLogout;
      await handleLogoutFromProps();
      // Manually trigger SIGNED_OUT event after signOut resolves
      onAuthStateChangeCallback!('SIGNED_OUT', null);
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

  // Test 18: Handles errors during logout gracefully
  it('handles errors during logout gracefully', async (): Promise<void> => {
    const initialSession = {
      user: { id: 'error-user', email: 'test@example.com' } as User,
      access_token: 'error-token',
      token_type: 'Bearer',
      expires_in: 3600,
      expires_at: 1234567890,
      refresh_token: 'error-refresh',
    };
    // Simulate initial authenticated session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: initialSession },
      error: null,
    });
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

    render(<AuthManager>{mockChild}</AuthManager>);

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
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'supabase.auth.token',
      );
    });
    consoleErrorSpy.mockRestore();
  });

  // Test 19: Handles rapid successive authentication state changes gracefully
  it('handles rapid successive authentication state changes gracefully', async (): Promise<void> => {
    // Simulate no initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(<AuthManager>{mockChild}</AuthManager>);
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
    });

    const mockSession = {
      user: { id: 'user-rapid', email: 'test@example.com' } as User,
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

  // Test 20: Does not re-initialize or re-fetch token unnecessarily (Corrected expectation)
  it('does not re-initialize or re-fetch token unnecessarily', async (): Promise<void> => {
    // Simulate no initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    // Render the component once
    const { rerender } = render(<AuthManager>{mockChild}</AuthManager>);

    await waitFor(() => {
      expect(screen.getByTestId('is-initialized').textContent).toBe('true');
      // getSession should be called exactly once for the initial check
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

    // Simulate a re-render without re-mounting (e.g., parent state change)
    // This should NOT cause getSession to be called again as useEffect has empty deps
    rerender(<AuthManager>{mockChild}</AuthManager>);

    await waitFor(() => {
      // getSession should still only have been called once after re-render
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    });
  });
});
