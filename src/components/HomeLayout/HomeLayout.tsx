import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AppSidebar } from '../AppSidebar/AppSidebar';
import { Outlet, useLocation } from 'react-router';
import { SidebarProvider } from '@/components/ui/sidebar';

export const HomeLayout: React.FC = () => {
  const location = useLocation();

  return (
    <SidebarProvider>
    <div className="flex flex-col min-h-screen w-full bg-gray-100">
        <AppSidebar />
        <div className="flex-1 flex flex-col items-center justify-start p-6">
          <Card className="w-full max-w-full sm:max-w-4xl flex-grow flex flex-col items-center justify-start">
          {location.pathname === '/' && (
        <CardHeader>
          <CardTitle>Welcome Home!</CardTitle>
        </CardHeader>
          )}
        <CardContent className="w-full">
            <Outlet />
        </CardContent>
      </Card>
    </div>
      </div>
    </SidebarProvider>
  );
};

export default HomeLayout;
