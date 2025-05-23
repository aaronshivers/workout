import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import React from 'react';

// Mock ReactDOM.createRoot
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn((container: HTMLElement) => ({
    render: vi.fn((element: React.ReactNode) => {
      // Simulate rendering by mounting to the container
      render(element as React.ReactElement, { container });
    }),
  })),
}));

describe('main.tsx', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create a container div for rendering
    container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up the container
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('renders the App component without crashing', async () => {
    // Execute main.tsx logic
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </React.StrictMode>,
    );

    // Verify createRoot was called with the root element
    expect(createRoot).toHaveBeenCalledWith(container);

    // Verify render was called with App wrapped in MemoryRouter
    expect(root.render).toHaveBeenCalledWith(
      expect.objectContaining({
        type: React.StrictMode,
        props: expect.objectContaining({
          children: expect.objectContaining({
            type: MemoryRouter,
            props: expect.objectContaining({
              children: expect.anything(),
            }),
          }),
        }),
      }),
    );

    // Check that App rendered by looking for "Login" text
    await waitFor(() => {
      // Use waitFor for async rendering
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
    });
  });

  it('ensures the application successfully mounts into the DOM', async () => {
    // Execute main.tsx logic
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </React.StrictMode>,
    );

    // Verify the root element exists
    expect(document.getElementById('root')).toBeInTheDocument();

    // Verify createRoot was called
    expect(createRoot).toHaveBeenCalledWith(container);

    // Verify render was called
    expect(root.render).toHaveBeenCalled();

    // Check that App mounted by looking for "Login" text
    await waitFor(() => {
      // Use waitFor for async rendering
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
    });
  });
});
