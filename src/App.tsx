import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router';
import { LoginPage } from './Pages/LoginPage/LoginPage';
import HomeLayout from './components/HomeLayout/HomeLayout';
import HomePage from './Pages/HomePage/HomePage';
import ProtectedLayout from './components/ProtectedLayout/ProtectedLayout';
import SettingsPage from './Pages/SettingsPage/SettingsPage';
import ProfilePage from './Pages/ProfilePage/ProfilePage';
import { AuthLayout } from './components/AuthLayout/AuthLayout';
import WorkoutLogger from './components/WorkoutLogger/WorkoutLogger';
import WorkoutHistory from './components/WorkoutHistory/WorkoutHistory';
import CreateWorkout from './components/CreateWorkout/CreateWorkout';
import { CustomExercises } from './components/CustomExercises/CustomExercises';
import Dashboard from './components/Dashboard/Dashboard';
import { WorkoutProvider } from './components/WorkoutProvider';
import { SupabaseAuthService } from './services/authService';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={<AuthLayout />}
      loader={() => ({ userPromise: SupabaseAuthService.getUserData() })}
    >
      <Route element={<HomeLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route
        element={
          <WorkoutProvider>
            <ProtectedLayout />
          </WorkoutProvider>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/log-workout" element={<WorkoutLogger />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/history" element={<WorkoutHistory />} />
        <Route path="/templates" element={<div>Templates Page</div>} />
        <Route path="/custom-exercises" element={<CustomExercises />} />
        <Route path="/create-workout" element={<CreateWorkout />} />
      </Route>
    </Route>,
  ),
);

export default router;
