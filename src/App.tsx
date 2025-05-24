import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router';
import { LoginPage } from './Pages/LoginPage/LoginPage.tsx';
import HomeLayout from './components/HomeLayout/HomeLayout';
import HomePage from './Pages/HomePage/HomePage.tsx';
import ProtectedLayout from './components/ProtectedLayout/ProtectedLayout';
import SettingsPage from './Pages/SettingsPage/SettingsPage.tsx';
import ProfilePage from './Pages/ProfilePage/ProfilePage.tsx';
import { AuthLayout } from './components/AuthLayout/AuthLayout.tsx';
import { supabase } from './utils/supabase.ts';

const getUserData = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error fetching session:", error);
    return null;
  }
  return session?.user || null;
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={<AuthLayout />}
      loader={() => ({ userPromise: getUserData() })}
    >
      <Route element={<HomeLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route path="/dashboard" element={<ProtectedLayout />}>
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Route>
  )
);

export default router;
