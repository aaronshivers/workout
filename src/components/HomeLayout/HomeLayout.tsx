import { useAuth } from "../../hooks/useAuth";
import { Link, Navigate, Outlet } from "react-router-dom";

export const HomeLayout: React.FC = () => {
  const user = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div>
      <h1>Home Layout</h1>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
      </nav>
      <Outlet />
    </div>
  );
}

export default HomeLayout;
