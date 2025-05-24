import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>(''); // State for confirm password
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false); // Toggle between login and sign-up
  const navigate = useNavigate();

  // Function to clear form fields
  const clearForm = (): void => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // Handle Login submission
  const handleLogin = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );

      if (authError) {
        setError(authError.message);
      } else if (data.user) {
        // Login successful, redirect to dashboard
        clearForm();
        navigate('/', { replace: true });
      } else {
        // This case might occur if data.user is null but no specific error is returned
        setError('An unexpected error occurred during login.');
      }
    } catch (err: unknown) {
      // Explicitly type err as unknown
      // Catch network errors or other unexpected issues
      console.error('Login error:', err);
      // Check if err is an instance of Error to safely access message
      if (err instanceof Error) {
        setError(
          `Network error or unexpected issue: ${err.message}. Please try again.`,
        );
      } else {
        setError(
          'An unknown network error or unexpected issue occurred. Please try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up submission
  const handleSignUp = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Supabase signUp will automatically log in the user upon successful registration
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else if (data.user) {
        // Sign up successful, user is automatically logged in, redirect to dashboard
        clearForm();
        navigate('/', { replace: true });
      } else {
        // This case might occur if data.user is null but no specific error is returned
        setError('An unexpected error occurred during sign up.');
      }
    } catch (err: unknown) {
      // Explicitly type err as unknown
      // Catch network errors or other unexpected issues
      console.error('Sign up error:', err);
      // Check if err is an instance of Error to safely access message
      if (err instanceof Error) {
        setError(
          `Network error or unexpected issue: ${err.message}. Please try again.`,
        );
      } else {
        setError(
          'An unknown network error or unexpected issue occurred. Please try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4 font-inter">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 hover:scale-105">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-900">
          {isSignUpMode ? 'Sign Up' : 'Login'}
        </h2>
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4 text-sm"
            role="alert"
          >
            <strong className="font-semibold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <form
          onSubmit={isSignUpMode ? handleSignUp : handleLogin}
          className="space-y-6"
        >
          {/* Hidden username field for accessibility/password managers */}
          <input
            id="username"
            name="username"
            autoComplete="username"
            className="hidden" // Keep it hidden from the user
            tabIndex={-1} // Prevent focus
            aria-hidden="true" // Hide from accessibility tree
            type="text"
            value={email} // Often, email is used as the username
            onChange={() => {}} // No-op as it's for autofill, not direct user input
          />
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-base transition duration-150 ease-in-out"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete={isSignUpMode ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-base transition duration-150 ease-in-out"
              disabled={loading}
            />
          </div>
          {isSignUpMode && (
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirm-password"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-base transition duration-150 ease-in-out"
                disabled={loading}
              />
            </div>
          )}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out transform hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading ? 'Loading...' : isSignUpMode ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </form>
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsSignUpMode(!isSignUpMode);
              clearForm(); // Clear form fields when switching modes
              setError(null); // Clear any errors
            }}
            className="text-indigo-600 hover:text-indigo-800 text-base font-medium transition duration-150 ease-in-out"
            disabled={loading}
          >
            {isSignUpMode
              ? 'Already have an account? Log In'
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
