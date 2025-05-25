import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router';
import { LoginPage } from './Pages/LoginPage/LoginPage';
import HomeLayout from './components/HomeLayout/HomeLayout';
import HomePage from './Pages/HomePage/HomePage';
import ProtectedLayout from './components/ProtectedLayout/ProtectedLayout';
import SettingsPage from './Pages/SettingsPage/SettingsPage';
import ProfilePage from './Pages/ProfilePage/ProfilePage';
import { AuthLayout } from './components/AuthLayout/AuthLayout';
import { supabase } from './utils/supabase';
import WorkoutLogger from './components/WorkoutLogger/WorkoutLogger';
import WorkoutHistory from './components/WorkoutHistory/WorkoutHistory';
import CreateWorkout from './components/CreateWorkout/CreateWorkout';

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
        <Route index element={<WorkoutLogger />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="history" element={<WorkoutHistory />} />
        <Route path="templates" element={<div>Templates Page</div>} />
        <Route path="custom-exercises" element={<div>Custom Exercises Page</div>} />
        <Route path="create-workout" element={<CreateWorkout />} />
      </Route>
    </Route>
  )
);

export default router;
