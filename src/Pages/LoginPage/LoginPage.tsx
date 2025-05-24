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
    <div className="flex flex-col items-center w-full py-8 px-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-sm mx-auto border border-blue-100 transform hover:shadow-3xl transition-shadow duration-300">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-800 mb-6">Login</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg relative mb-4 shadow-md animate-shake text-sm" role="alert">
            <span className="block sm:inline font-medium">{error}</span>
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
        <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400"
            placeholder="your.email@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ease-in-out font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Login
          </button>
      </form>
      </div>
    </div>
  );
}

export default LoginPage;
