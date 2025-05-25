import { Navigate, useOutlet } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import Navigation from '../Navigation/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const ProtectedLayout = () => {
    const { isAuthenticated, logout } = useAuth();
    const outlet = useOutlet();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-screen w-full">
            <Card className="w-full max-w-full sm:max-w-4xl mb-4">
                <CardHeader>
                    <CardTitle>Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                <Navigation isAuthenticated={isAuthenticated} logout={logout} />
                </CardContent>
            </Card>
            <Card className="w-full max-w-full sm:max-w-4xl flex-grow flex flex-col items-center justify-start">
                <CardContent className="w-full">
                {outlet}
                </CardContent>
            </Card>
        </div>
    );
};

export default ProtectedLayout;
