import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './LoginPage';
import supabase from '../../utils/supabase';
import '@testing-library/jest-dom';
import type {
  AuthTokenResponsePassword,
  AuthError,
  AuthResponse, // Import AuthResponse for signUp mock
} from '@supabase/supabase-js';
import type { NavigateFunction } from 'react-router-dom';

// Mock supabase
vi.mock('../../utils/supabase', () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(), // Mock the signUp function
    },
  },
}));

// Mock useNavigate to include all actual exports from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom'); // Import actual module
  return {
    ...actual, // Spread all actual exports
    useNavigate: (): NavigateFunction => mockNavigate, // Override useNavigate with explicit type
  };
});

// Mock localStorage to spy on its methods
const localStorageMock = ((): Storage => {
  let store: Record<string, string> = {};
  return {
    length: 0,
    clear: vi.fn(() => {
      store = {};
    }),
    getItem: vi.fn((key: string) => store[key] || null),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Login/Sign Up Component', () => {
  const user = userEvent.setup();

  beforeEach((): void => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  // --- Common Rendering Tests (for initial state) ---
  it('renders without crashing in login mode', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /login/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /login/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Don't have an account\? Sign Up/i),
      ).toBeInTheDocument();
    });
  });

  it('displays the email and password input fields in login mode', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      // Use getByLabelText with a specific name or id if there are multiple password fields
      expect(
        screen.getByLabelText(/password/i, { selector: '#password' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText(/confirm password/i),
      ).not.toBeInTheDocument(); // Confirm password should not be visible
    });
  });

  it('input elements should have autocomplete attributes in login mode', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i, {
        selector: '#password',
      });
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  // --- Toggle Mode Tests ---
  it('switches to sign up mode when "Sign Up" button is clicked', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const signUpButton = screen.getByRole('button', {
      name: /Don't have an account\? Sign Up/i,
    });
    await user.click(signUpButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /sign up/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign up/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Already have an account\? Log In/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument(); // Confirm password should now be visible
    });
  });

  it('switches back to login mode when "Log In" button is clicked and clears form', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    // Switch to sign up mode
    await user.click(
      screen.getByRole('button', { name: /Don't have an account\? Sign Up/i }),
    );
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    // Use specific selectors for password fields
    await user.type(
      screen.getByLabelText(/password/i, { selector: '#password' }),
      'password123',
    );
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    // Switch back to login mode
    const loginButton = screen.getByRole('button', {
      name: /Already have an account\? Log In/i,
    });
    await user.click(loginButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /login/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /login/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(
        screen.getByLabelText(/password/i, { selector: '#password' }),
      ).toHaveValue('');
      expect(
        screen.queryByLabelText(/confirm password/i),
      ).not.toBeInTheDocument();
    });
  });

  // --- Login Specific Tests (re-using existing, ensuring they still work) ---
  it('updates the email state on input change', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('updates the password state on input change', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    const passwordInput = screen.getByLabelText(/password/i, {
      selector: '#password',
    });
    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls the login API on button click', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: '123', email: 'test@example.com' },
        session: {},
      }, // Minimal session mock
      error: null,
    } as AuthTokenResponsePassword);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(
      screen.getByLabelText(/password/i, { selector: '#password' }),
      'password123',
    );
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays an error message for invalid login credentials', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Invalid credentials',
        code: '401',
        status: 401,
        name: 'AuthApiError',
      } as AuthError,
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(
      screen.getByLabelText(/password/i, { selector: '#password' }),
      'wrongpassword',
    );
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('redirects to the dashboard on successful login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: '123', email: 'test@example.com' },
        session: {},
      },
      error: null,
    } as AuthTokenResponsePassword);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(
      screen.getByLabelText(/password/i, { selector: '#password' }),
      'password123',
    );
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('disables the login button and shows loading indicator while API call is in progress', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { user: { id: '123' }, session: {} },
                error: null,
              } as AuthTokenResponsePassword),
            500,
          ),
        ),
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    const loginButton = screen.getByRole('button', { name: /login/i });
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(
      screen.getByLabelText(/password/i, { selector: '#password' }),
      'password123',
    );
    await user.click(loginButton);

    expect(loginButton).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => expect(loginButton).not.toBeDisabled()); // Wait for loading to finish
  });

  // --- Sign Up Specific Tests ---
  it('updates the confirm password state on input change in sign up mode', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole('button', { name: /Don't have an account\? Sign Up/i }),
    );

    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    await user.type(confirmPasswordInput, 'password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });

  it('displays an error if passwords do not match during sign up', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole('button', { name: /Don't have an account\? Sign Up/i }),
    );

    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(
      screen.getByLabelText(/password/i, { selector: '#password' }),
      'password123',
    );
    await user.type(
      screen.getByLabelText(/confirm password/i),
      'differentpassword',
    );
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    expect(supabase.auth.signUp).not.toHaveBeenCalled(); // API should not be called
  });

  it('calls the sign up API on button click with matching passwords', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: { id: '456', email: 'newuser@example.com' },
        session: {},
      },
      error: null,
    } as AuthResponse); // Use AuthResponse for signUp

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole('button', { name: /Don't have an account\? Sign Up/i }),
    );

    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(
      screen.getByLabelText(/password/i, { selector: '#password' }),
      'password123',
    );
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });
    });
  });

  it('redirects to the dashboard on successful sign up', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: { id: '456', email: 'newuser@example.com' },
        session: {},
      },
      error: null,
    } as AuthResponse);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole('button', { name: /Don't have an account\? Sign Up/i }),
    );

    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(
      screen.getByLabelText(/password/i, { selector: '#password' }),
      'password123',
    );
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('clears form fields after successful sign up', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: { id: '456', email: 'newuser@example.com' },
        session: {},
      },
      error: null,
    } as AuthResponse);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole('button', { name: /Don't have an account\? Sign Up/i }),
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i, {
      selector: '#password',
    });
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
      expect(confirmPasswordInput).toHaveValue('');
    });
  });

  it('displays an error message for existing user during sign up', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'User already registered',
        code: '409',
        status: 409,
        name: 'AuthApiError',
      } as AuthError,
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole('button', { name: /Don't have an account\? Sign Up/i }),
    );

    await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await user.type(
      screen.getByLabelText(/password/i, { selector: '#password' }),
      'password123',
    );
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/user already registered/i)).toBeInTheDocument();
    });
  });

  it('displays a loading indicator and disables button during sign up API call', async () => {
    vi.mocked(supabase.auth.signUp).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { user: { id: '456' }, session: {} },
                error: null,
              } as AuthResponse),
            500,
          ),
        ),
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole('button', { name: /Don't have an account\? Sign Up/i }),
    );

    const signUpButton = screen.getByRole('button', { name: /sign up/i });
    await user.type(screen.getByLabelText(/email/i), 'loading@example.com');
    await user.type(
      screen.getByLabelText(/password/i, { selector: '#password' }),
      'password123',
    );
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(signUpButton);

    expect(signUpButton).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => expect(signUpButton).not.toBeDisabled()); // Wait for loading to finish
  });

  it('handles network errors during sign up', async () => {
    vi.mocked(supabase.auth.signUp).mockRejectedValue({
      message: 'Network error',
      code: 'network_error',
      status: 0,
      name: 'AuthApiError',
    } as AuthError);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole('button', { name: /Don't have an account\? Sign Up/i }),
    );

    await user.type(screen.getByLabelText(/email/i), 'network@example.com');
    await user.type(
      screen.getByLabelText(/password/i, { selector: '#password' }),
      'password123',
    );
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
