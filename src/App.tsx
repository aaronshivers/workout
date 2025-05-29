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
import { CustomExercises } from './components/CustomExercises/CustomExercises';
import Dashboard from './components/Dashboard/Dashboard';
import { WorkoutProvider } from './components/WorkoutProvider';
import { SupabaseAuthService } from './services/authService';
import { MesocycleList } from './components/Mesocycle/MesocycleList';
import { MesocycleCreate } from './components/Mesocycle/MesocycleCreate';
import { MesocycleDetail } from './components/Mesocycle/MesocycleDetail';
import { MesocycleEdit } from './components/Mesocycle/MesocycleEdit';
import WorkoutList from './components/Workout/WorkoutList';
import WorkoutEdit from './components/Workout/WorkoutEdit';
import WorkoutDetail from './components/Workout/WorkoutDetail';
import WorkoutCreate from './components/Workout/WorkoutCreate';

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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/templates" element={<div>Templates Page</div>} />
        <Route path="/custom-exercises" element={<CustomExercises />} />
        <Route path="/workouts" element={<WorkoutList />} />
        <Route path="/workout/create" element={<WorkoutCreate />} />
        <Route path="/workouts/:id" element={<WorkoutDetail />} />
        <Route path="/workouts/:id/edit" element={<WorkoutEdit />} />
        <Route path="/mesocycles" element={<MesocycleList />} />
        <Route path="/mesocycles/create" element={<MesocycleCreate />} />
        <Route path="/mesocycles/:id" element={<MesocycleDetail />} />
        <Route path="/mesocycles/:id/edit" element={<MesocycleEdit />} />
      </Route>
    </Route>,
  ),
);

export default router;
