import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from './Login';
import supabase from '../../utils/supabase';
import '@testing-library/jest-dom';

// Mock Supabase
vi.mock('../../utils/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

describe('Login Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  it('displays the username input field', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('displays the password input field', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('displays the login button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('updates the username state on input change', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('updates the password state on input change', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls the login API on button click', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: { id: '123' }, session: { access_token: 'token' } },
      error: null,
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
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
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: null,
      error: { message: 'Invalid email or password' },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('redirects to the dashboard on successful login', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: { id: '123' }, session: { access_token: 'token' } },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('persists the authentication token after successful login', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: { id: '123' }, session: { access_token: 'token' } },
      error: null,
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(localStorage.getItem('supabase.auth.token')).toBe('token');
    });
  });

  it('clears the username and password fields after successful login', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: { id: '123' }, session: { access_token: 'token' } },
      error: null,
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
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
    let resolveSignIn: (value: any) => void;
    (supabase.auth.signInWithPassword as any).mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      })
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();

    // Resolve the promise to clean up
    resolveSignIn!({
      data: { user: { id: '123' }, session: { access_token: 'token' } },
      error: null,
    });
  });

  it('displays a loading indicator while the API call is in progress', async () => {
    (supabase.auth.signInWithPassword as any).mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
  });

  it('handles network errors during login', async () => {
    (supabase.auth.signInWithPassword as any).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
