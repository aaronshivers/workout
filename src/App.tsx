import React from 'react';
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

const App: React.FC = () => {
  return (
    <AuthManager>
      {({ handleLogout, isInitialized, userId }) => (
        <div
          className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-start"
          data-testid="app-container"
        >
          <Navigation isAuthenticated={isInitialized} logout={handleLogout} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/log-workout"
              element={
                <WorkoutLogger
                  userId={userId || ''}
                  setWorkouts={() => {}} // Placeholder, replace with actual state management
                  isInitialized={isInitialized}
                />
              }
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
