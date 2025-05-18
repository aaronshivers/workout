import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from './Login';
import * as supabase from '../../utils/supabase';
import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';

vi.mock('../../utils/supabase', () => {
  const auth = {
    signInWithPassword: vi.fn(),
    getSession: vi.fn(),
    refreshSession: vi.fn(),
  };
  return {
    default: {
      auth,
    },
  };
});

describe('Login', () => {
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
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('displays the username input field', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('displays the password input field', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('displays the login button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });

  it('updates the username state on input change', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    expect(emailInput).toHaveValue('user@example.com');
  });

  it('updates the password state on input change', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls the login API on button click', async () => {
    (supabase.default.auth.signInWithPassword as any).mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null });
    (supabase.default.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'user-id' } } }, error: null });
    (supabase.default.auth.refreshSession as any).mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByText('Log In');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(supabase.default.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });

  it('displays an error message for invalid credentials', async () => {
    (supabase.default.auth.signInWithPassword as any).mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByText('Log In');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Login failed: Invalid credentials')).toBeInTheDocument();
    });
  });

  it('redirects to the workout list page on successful login', async () => {
    (supabase.default.auth.signInWithPassword as any).mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null });
    (supabase.default.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'user-id' } } }, error: null });
    (supabase.default.auth.refreshSession as any).mockResolvedValue({ error: null });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByText('Log In');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Workout List')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('persists the authentication token after successful login', async () => {
    const mockToken = 'mock-token';
    (supabase.default.auth.signInWithPassword as any).mockResolvedValue({ data: { session: { access_token: mockToken } }, error: null });
    (supabase.default.auth.getSession as any).mockResolvedValue({ data: { session: { access_token: mockToken } }, error: null });
    (supabase.default.auth.refreshSession as any).mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByText('Log In');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(localStorage.getItem('supabase.auth.token')).toBe(mockToken);
    }, { timeout: 2000 });
  });

  it('clears the username and password fields after successful login', async () => {
    (supabase.default.auth.signInWithPassword as any).mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null });
    (supabase.default.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: 'user-id' } } }, error: null });
    (supabase.default.auth.refreshSession as any).mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByText('Log In');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    }, { timeout: 2000 });
  });

  it('disables the login button while the API call is in progress', async () => {
    (supabase.default.auth.signInWithPassword as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { user: { id: 'user-id' } }, error: null }), 200))
    );
    (supabase.default.auth.refreshSession as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 200))
    );
    (supabase.default.auth.getSession as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { session: { user: { id: 'user-id' } } }, error: null }), 200))
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByText('Log In');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    expect(loginButton).toBeDisabled();
    expect(loginButton).toHaveTextContent('Logging In...');
    await waitFor(() => expect(loginButton).not.toBeDisabled(), { timeout: 1000 });
  });

  it('displays a loading indicator while the API call is in progress', async () => {
    (supabase.default.auth.signInWithPassword as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { user: { id: 'user-id' } }, error: null }), 200))
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByText('Log In');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    expect(screen.getByText('Logging In...')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Logging In...')).not.toBeInTheDocument(), { timeout: 1000 });
  });

  it('handles network errors during login', async () => {
    (supabase.default.auth.signInWithPassword as any).mockRejectedValue(new Error('Network Error'));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByText('Log In');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Login failed: Network Error')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('input elements should have autocomplete attributes', () => {
    render(
        <MemoryRouter>
        <Login />
        </MemoryRouter>
    );
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    expect(emailInput).toHaveAttribute('autocomplete', 'username');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });
});
