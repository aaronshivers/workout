import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Login from './Login';
import supabase from '../../utils/supabase';
import '@testing-library/jest-dom';
import type {
  AuthTokenResponsePassword,
  AuthError,
} from '@supabase/supabase-js';

// Mock supabase
vi.mock('../../utils/supabase', () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /login/i }),
      ).toBeInTheDocument();
    });
  });

  it('password field is contained in a form', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput.closest('form')).toHaveClass('space-y-4');
    });
  });

  it('displays the email input field', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });

  it('displays the password input field', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
  });

  it('displays the login button', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /login/i }),
      ).toBeInTheDocument();
    });
  });

  it('input elements should have autocomplete attributes', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });

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
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls the login API on button click', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: '123', email: 'test@example.com' },
        session: {
          access_token: 'token',
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: '123' },
        },
      },
      error: null,
    } as AuthTokenResponsePassword);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays an error message for invalid credentials', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Invalid credentials',
        code: 'invalid_credentials',
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
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('redirects to the dashboard on successful login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: '123', email: 'test@example.com' },
        session: {
          access_token: 'token',
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: '123' },
        },
      },
      error: null,
    } as AuthTokenResponsePassword);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('persists the authentication token after successful login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: '123', email: 'test@example.com' },
        session: {
          access_token: 'token',
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: '123' },
        },
      },
      error: null,
    } as AuthTokenResponsePassword);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(localStorage.getItem('sb-auth-token')).toBe('token');
    });
  });

  it('clears the email and password fields after successful login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: '123', email: 'test@example.com' },
        session: {
          access_token: 'token',
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: '123' },
        },
      },
      error: null,
    } as AuthTokenResponsePassword);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    });
  });

  it('disables the login button while the API call is in progress', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  user: { id: '123', email: 'test@example.com' },
                  session: {
                    access_token: 'token',
                    refresh_token: '',
                    expires_in: 3600,
                    token_type: 'bearer',
                    user: { id: '123' },
                  },
                },
                error: null,
              } as AuthTokenResponsePassword),
            1000,
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
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(loginButton);

    expect(loginButton).toBeDisabled();
  });

  it('displays a loading indicator while the API call is in progress', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  user: { id: '123', email: 'test@example.com' },
                  session: {
                    access_token: 'token',
                    refresh_token: '',
                    expires_in: 3600,
                    token_type: 'bearer',
                    user: { id: '123' },
                  },
                },
                error: null,
              } as AuthTokenResponsePassword),
            1000,
          ),
        ),
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles network errors during login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue({
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

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
