import { useAuth } from "../../hooks/useAuth";
import { Navigate, Outlet } from "react-router";
import Navigation from "../Navigation/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const HomeLayout: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen w-full">
      <Card className="w-full max-w-full sm:max-w-4xl mb-4">
        <CardHeader>
          <CardTitle>Welcome Home!</CardTitle>
        </CardHeader>
        <CardContent>
        <Navigation isAuthenticated={isAuthenticated} logout={logout} />
        </CardContent>
      </Card>
      <Card className="w-full max-w-full sm:max-w-4xl flex-grow flex flex-col items-center justify-start">
        <CardContent className="w-full">
      <Outlet />
        </CardContent>
      </Card>
    </div>
  );
}

export default HomeLayout;
