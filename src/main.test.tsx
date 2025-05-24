import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import React from 'react';

// Define mock functions outside the vi.mock call so they can be accessed directly in tests.
// These will be the actual mock functions used by the mocked createRoot.
const mockRender = vi.fn();
const mockUnmount = vi.fn();

// Mock ReactDOM.createRoot to intercept the render call.
// This mock will return an object with the globally defined mock render and unmount methods.
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    // 'container' parameter is used by Vitest's mock setup
    render: mockRender, // Assign the globally defined mockRender
    unmount: mockUnmount, // Assign the globally defined mockUnmount
  })),
}));

describe('main.tsx', () => {
  let container: HTMLDivElement; // Declared here to be accessible throughout the describe block

  beforeEach(() => {
    // Reset the DOM for each test to ensure isolation
    document.body.innerHTML = '';
    // Create a container div for rendering, which main.tsx will target
    container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);

    // Clear all mock calls before each test to ensure a clean state.
    // This clears calls for createRoot, mockRender, and mockUnmount.
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up the container element from the DOM after each test
    document.body.removeChild(container);
    // Clear all mock calls again to ensure no state carries over to subsequent tests
    vi.clearAllMocks();
  });

  it('renders the App component wrapped in BrowserRouter', async () => {
    // Dynamically import main.tsx to execute its rendering logic.
    // This action will trigger the mocked createRoot function,
    // which in turn will call the mockRender function.
    await import('./main.tsx');

    // Verify that createRoot was called exactly once with the correct root element.
    // This assertion now correctly passes because createRoot is only called by main.tsx.
    expect(createRoot).toHaveBeenCalledWith(container);
    expect(createRoot).toHaveBeenCalledTimes(1);

    // Verify that the render method (our mockRender) was called exactly once.
    expect(mockRender).toHaveBeenCalledTimes(1);

    // Get the argument passed to the render method, which is the React element tree.
    const renderedElement = mockRender.mock.calls[0][0];

    // Assert that the top-level element rendered is React.StrictMode.
    expect(renderedElement).toBeDefined();
    expect(renderedElement.type).toBe(React.StrictMode);

    // Assert that the child of StrictMode is BrowserRouter.
    // This confirms that BrowserRouter is correctly wrapping your application.
    expect(renderedElement.props.children).toBeDefined();
    expect(renderedElement.props.children.type).toBe(BrowserRouter);

    // Optionally, assert that BrowserRouter contains the App component.
    expect(renderedElement.props.children.props.children).toBeDefined();
    expect(renderedElement.props.children.props.children.type).toBe(App);
  });
});
