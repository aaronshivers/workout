import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.");
      console.error("Login failed:", error);
    }
  };

  return(
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-md border border-blue-100">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">Login</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 shadow-md" role="alert">
            <span className="block sm:inline font-medium">{error}</span>
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-6">
        <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address:</label>
          <input
            type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base transition-all duration-200"
              placeholder="your.email@example.com"
          />
        </div>
        <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password:</label>
          <input
            type="password"
              id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base transition-all duration-200"
              placeholder="••••••••"
          />
        </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ease-in-out font-semibold text-lg shadow-md hover:shadow-lg"
          >
            Login
          </button>
      </form>
      </div>
    </div>
  );
}

export default LoginPage;
