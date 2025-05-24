import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation/Navigation';
import AuthManager from './components/AuthManager/AuthManager';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import WorkoutLogger from './components/WorkoutLogger/WorkoutLogger';
import WorkoutHistory from './components/WorkoutHistory/WorkoutHistory';
import Settings from './components/Settings/Settings';
import CreateWorkout from './components/CreateWorkout/CreateWorkout';
import Signup from './components/Signup/Signup';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

const App: React.FC = () => {
  return (
    <AuthManager>
      {({ handleLogout, isAuthenticated, isInitialized, userId }) => (
        <div
          className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-start"
          data-testid="app-container"
        >
          <Navigation isAuthenticated={isAuthenticated} logout={handleLogout} />
          <Routes>
            {/* Root path redirection */}
            <Route
              path="/"
              element={
                !isInitialized ? null : isAuthenticated ? ( // If NOT initialized, render null (or a loading spinner)
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Login and Signup routes: Redirect if already authenticated OR render null if not initialized */}
            <Route
              path="/login"
              element={
                !isInitialized ? null : isAuthenticated ? ( // If NOT initialized, render null (to prevent flash) // If initialized AND authenticated, redirect
                  <Navigate to="/dashboard" replace />
                ) : (
                  // If initialized AND not authenticated, show login
                  <Login />
                )
              }
            />
            <Route
              path="/signup"
              element={
                !isInitialized ? null : isAuthenticated ? ( // If NOT initialized, render null (to prevent flash) // If initialized AND authenticated, redirect
                  <Navigate to="/dashboard" replace />
                ) : (
                  // If initialized AND not authenticated, show signup
                  <Signup />
                )
              }
            />

            {/* Protected Routes (already handled by ProtectedRoute, which itself handles isInitialized) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/log-workout"
              element={
                <ProtectedRoute>
                  <WorkoutLogger
                    userId={userId || ''}
                    setWorkouts={() => {}} // Placeholder, replace with actual state management
                    isInitialized={isInitialized}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <WorkoutHistory workouts={[]} muscleGroups={[]} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-workout"
              element={
                <ProtectedRoute>
                  <CreateWorkout />
                </ProtectedRoute>
              }
            />

            {/* Fallback for any unmatched routes */}
            <Route
              path="*"
              element={
                !isInitialized ? null : isAuthenticated ? ( // If NOT initialized, render null (to prevent flash)
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </div>
      )}
    </AuthManager>
  );
};

export default App;
