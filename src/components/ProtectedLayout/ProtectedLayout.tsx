import { Navigate, useOutlet } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import Navigation from '../Navigation/Navigation';

export const ProtectedLayout = () => {
    const { isAuthenticated, logout } = useAuth();
    const outlet = useOutlet();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4 w-full">
            <header className="w-full max-w-full sm:max-w-4xl bg-white shadow-xl rounded-lg p-4 mb-4 border border-blue-200 transform hover:shadow-2xl transition-shadow duration-300">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-800 mb-4 leading-tight">Dashboard</h1>
                <Navigation isAuthenticated={isAuthenticated} logout={logout} />
            </header>
            <main className="w-full max-w-full sm:max-w-4xl bg-white shadow-xl rounded-lg p-6 border border-blue-200 flex-grow flex flex-col items-center justify-start transform hover:shadow-2xl transition-shadow duration-300">
                {outlet}
            </main>
        </div>
    );
};

export default ProtectedLayout;
