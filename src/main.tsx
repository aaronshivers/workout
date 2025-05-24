import React from 'react';
import ReactDOM from 'react-dom/client';
import { router } from './App.tsx';
import './index.css';
import { RouterProvider } from 'react-router';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
      <RouterProvider router={router} />
  </React.StrictMode>,
);
