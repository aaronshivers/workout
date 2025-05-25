import { Await, useLoaderData, useOutlet } from "react-router";
import { AuthProvider } from "../../hooks/useAuth";
import { Suspense } from "react";

export const AuthLayout: React.FC = () => {
    const outlet = useOutlet();
    const { userPromise } = useLoaderData() as { userPromise: Promise<any> };

    return (
    <Suspense
      fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-3xl">Loading application...</div>
            </div>
      }
    >
            <Await
            resolve={userPromise}
            errorElement={
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-xl">Error loading user data. Please try again.</div>
                    </div>
                }
            children={(user) => (
                <AuthProvider userData={user}>
                        {outlet}
                </AuthProvider>
                )}
            />
        </Suspense>
    );
};
