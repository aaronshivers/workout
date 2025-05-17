import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import { Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import WorkoutTracker from './components/WorkoutTracker';
import Login from './components/Login/Login';

const App: React.FC  = () => (
  <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<WorkoutTracker />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
  </Router>
);

export default App;
