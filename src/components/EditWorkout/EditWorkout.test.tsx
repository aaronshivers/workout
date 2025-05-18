// src/components/EditWorkout/EditWorkout.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EditWorkout from './EditWorkout';
import * as supabase from '../../utils/supabase';
import '@testing-library/jest-dom';

vi.mock('../../utils/supabase', () => ({
  default: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [{ id: 1, created_at: '2025-05-18', workout_sets: [{ sets: 3, reps: 10, weight: 100, rpe: 7 }] }], error: null }),
      }),
      update: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-id' } } }, error: null }),
    },
  },
}));

describe('EditWorkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
          <Route path="/" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Edit Workout')).toBeInTheDocument();
  });

  it('displays a loading state while fetching the workout details', () => {
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(() => new Promise(() => {})), // Simulate pending
      }),
    });

    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays input fields pre-filled with the workout\'s existing data', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByLabelText('Date')).toHaveValue('2025-05-18');
      expect(screen.getByLabelText('Sets')).toHaveValue('3');
      expect(screen.getByLabelText('Reps')).toHaveValue('10');
      expect(screen.getByLabelText('Weight')).toHaveValue('100');
      expect(screen.getByLabelText('RPE')).toHaveValue('7');
    });
  });

  it('displays an "Update" button', () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('displays a "Cancel" button', () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('updates the corresponding state for each input field on change', () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
        </Routes>
      </MemoryRouter>
    );
    const setsInput = screen.getByLabelText('Sets');
    fireEvent.change(setsInput, { target: { value: '4' } });
    expect(setsInput).toHaveValue('4');
  });

  it('calls the API to update the workout on "Update" button click', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
          <Route path="/" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );

    const updateButton = screen.getByText('Update');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(supabase.default.from().update).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('redirects to the workout list page after successful workout update', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
          <Route path="/" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );

    const updateButton = screen.getByText('Update');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Workout List')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('displays validation errors for invalid input', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
        </Routes>
      </MemoryRouter>
    );

    const setsInput = screen.getByLabelText('Sets');
    const updateButton = screen.getByText('Update');

    fireEvent.change(setsInput, { target: { value: 'abc' } });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Sets must be a number')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('disables the "Update" button while the API call is in progress', async () => {
    (supabase.default.from as any).mockReturnValue({
      update: vi.fn().mockImplementation(() => new Promise(() => {})), // Simulate pending
    });

    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
        </Routes>
      </MemoryRouter>
    );

    const updateButton = screen.getByText('Update');
    fireEvent.click(updateButton);

    expect(updateButton).toBeDisabled();
    await waitFor(() => expect(updateButton).not.toBeDisabled(), { timeout: 1000 });
  });

  it('displays a loading indicator while the API call is in progress', async () => {
    (supabase.default.from as any).mockReturnValue({
      update: vi.fn().mockImplementation(() => new Promise(() => {})), // Simulate pending
    });

    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
        </Routes>
      </MemoryRouter>
    );

    const updateButton = screen.getByText('Update');
    fireEvent.click(updateButton);

    expect(screen.getByText('Updating...')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Updating...')).not.toBeInTheDocument(), { timeout: 1000 });
  });

  it('handles errors during workout update', async () => {
    (supabase.default.from as any).mockReturnValue({
      update: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update error' } }),
    });

    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
        </Routes>
      </MemoryRouter>
    );

    const updateButton = screen.getByText('Update');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Error updating workout: Update error')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('navigates back to the workout list page on "Cancel" button click', () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
          <Route path="/" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.getByText('Workout List')).toBeInTheDocument();
  });

  it('handles errors if the workout ID in the URL is invalid', async () => {
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Workout not found' } }),
      }),
    });

    render(
      <MemoryRouter initialEntries={['/edit/invalid']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Workout not found')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
