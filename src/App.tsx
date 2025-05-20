import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation/Navigation';
import AuthManager from './components/AuthManager/AuthManager';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import WorkoutLogger from './components/WorkoutLogger/WorkoutLogger';
import WorkoutHistory from './components/WorkoutHistory/WorkoutHistory';
import Settings from './components/Settings/Settings';
import CreateWorkout from './components/CreateWorkout/CreateWorkout';
import Signup from './components/Signup/Signup';
import { useState } from 'react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  return (
    <AuthManager setIsAuthenticated={setIsAuthenticated}>
      {({ isAuthenticated: authStatus, handleLogout }) => (
        <div className="min-h-screen bg-gray-100">
          <Navigation
            isAuthenticated={authStatus}
            logout={handleLogout}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/log-workout"
              element={<WorkoutLogger userId="placeholder" />}
            />
            <Route
              path="/history"
              element={<WorkoutHistory workouts={[]} muscleGroups={[]} />}
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="/create-workout" element={<CreateWorkout />} />
          </Routes>
        </div>
      )}
    </AuthManager>
  );
};

export default App;
