import { Navigate, useOutlet } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import {AppSidebar} from '../AppSidebar/AppSidebar';
import { Card, CardContent } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
export const ProtectedLayout = () => {
    const { isAuthenticated } = useAuth();
    const outlet = useOutlet();

    if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
    }

    return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-100">
        <AppSidebar />
        <div className="flex-1 flex flex-col items-center justify-start p-6">
          <SidebarTrigger className="mb-4 self-start" />
            <Card className="w-full max-w-full sm:max-w-4xl flex-grow flex flex-col items-center justify-start">
                <CardContent className="w-full">
                {outlet}
                </CardContent>
            </Card>
        </div>
      </div>
    </SidebarProvider>
    );
};

export default ProtectedLayout;
