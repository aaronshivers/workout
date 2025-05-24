import { Await, useLoaderData, useOutlet } from "react-router";
import { AuthProvider } from "../../hooks/useAuth";
import { Suspense } from "react";

export const AuthLayout: React.FC = () => {
    const outlet = useOutlet();
    const { userPromise } = useLoaderData() as { userPromise: Promise<any> };

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 animate-gradient-xy">
                <div className="text-white text-3xl font-extrabold animate-pulse tracking-wide drop-shadow-lg">Loading application...</div>
            </div>
        }>
            <Await
            resolve={userPromise}
            errorElement={
                    <div className="flex items-center justify-center min-h-screen bg-red-600">
                        <div className="text-white text-2xl font-semibold p-6 rounded-lg shadow-xl bg-red-700 bg-opacity-80 text-center">Error loading user data. Please try again.</div>
                    </div>
                }
            children={(user) => (
                <AuthProvider userData={user}>
                    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 text-gray-900 flex flex-col items-center justify-start w-full pt-8 pb-4 px-4 sm:px-8">
                        {outlet}
                    </div>
                </AuthProvider>
                )}
            />
        </Suspense>
    );
};
