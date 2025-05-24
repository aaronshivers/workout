import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import { LoginPage } from './Pages/LoginPage/LoginPage.tsx';
import HomeLayout from './components/HomeLayout/HomeLayout';
import HomePage from './Pages/HomePage/HomePage.tsx';
import ProtectedLayout from './components/ProtectedLayout/ProtectedLayout';
import SettingsPage from './Pages/SettingsPage/SettingsPage.tsx';
import ProfilePage from './Pages/ProfilePage/ProfilePage.tsx';
import { AuthLayout } from './components/AuthLayout/AuthLayout.tsx';

const getUserData = () =>
  new Promise((resolve) =>
    setTimeout(() => {
      const user = window.localStorage.getItem("user");
      resolve(user);
    }, 3000)
  );

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={<AuthLayout />}
      loader={() => ({userPromise: getUserData()})}
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
