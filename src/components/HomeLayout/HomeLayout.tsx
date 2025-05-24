import { useAuth } from "../../hooks/useAuth";
import { Navigate, Outlet } from "react-router";
import Navigation from "../Navigation/Navigation";

export const HomeLayout: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 w-full">
      <header className="w-full max-w-4xl bg-white shadow-xl rounded-lg p-6 mb-8 border border-blue-100">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-6">Welcome Home!</h1>
        <Navigation isAuthenticated={isAuthenticated} logout={logout} /> {/* Pass props to Navigation */}
      </header>
      <main className="w-full max-w-4xl bg-white shadow-xl rounded-lg p-8 border border-blue-100">
      <Outlet />
      </main>
    </div>
  );
}

export default HomeLayout;
