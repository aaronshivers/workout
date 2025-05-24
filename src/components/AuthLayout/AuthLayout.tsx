import { Await, useLoaderData, useOutlet } from "react-router-dom";
import { AuthProvider } from "../../hooks/useAuth";
import { Suspense } from "react";

export const AuthLayout: React.FC = () => {
    const outlet = useOutlet();

    const {userPromise} = useLoaderData();

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-gray-500">Loading...</div>
            </div>
        }>
            <Await
            resolve={userPromise}
            errorElement={
                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-red-500">Error loading user data</div>
                </div>}
            children={(user) => (
                <AuthProvider userData={user}>
                    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-start">
                        {outlet}
                    </div>
                </AuthProvider>
                )}
            />
        </Suspense>
    );
};
