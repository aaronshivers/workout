import { Await, useLoaderData, useOutlet } from "react-router";
import { AuthProvider } from "../../hooks/useAuth";
import { Suspense } from "react";

export const AuthLayout: React.FC = () => {
    const outlet = useOutlet();
    const { userPromise } = useLoaderData() as { userPromise: Promise<any> };

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-blue-700 text-2xl font-bold animate-pulse">Loading application...</div>
            </div>
        }>
            <Await
            resolve={userPromise}
            errorElement={
                    <div className="flex items-center justify-center min-h-screen bg-red-100">
                        <div className="text-red-700 text-xl font-semibold">Error loading user data. Please try again.</div>
                    </div>
                }
            children={(user) => (
                <AuthProvider userData={user}>
                    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900 flex flex-col items-center justify-start w-full">
                        {outlet}
                    </div>
                </AuthProvider>
                )}
            />
        </Suspense>
    );
};
