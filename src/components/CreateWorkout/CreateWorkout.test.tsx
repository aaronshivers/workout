import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CreateWorkout from './CreateWorkout';
import * as supabase from '../../utils/supabase';
import '@testing-library/jest-dom';

vi.mock('../../utils/supabase', () => ({
  default: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-id' } } }, error: null }),
    },
  },
}));

describe('CreateWorkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
          <Route path="/" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Create Workout')).toBeInTheDocument();
  });

  it('displays input fields for workout details', () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration')).toBeInTheDocument();
    expect(screen.getByLabelText('Exercises')).toBeInTheDocument();
  });

  it('displays a "Save" button', () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('displays a "Cancel" button', () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('updates the corresponding state for each input field on change', () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
        </Routes>
      </MemoryRouter>
    );
    const dateInput = screen.getByLabelText('Date');
    const typeInput = screen.getByLabelText('Type');
    const durationInput = screen.getByLabelText('Duration');
    const exercisesInput = screen.getByLabelText('Exercises');

    fireEvent.change(dateInput, { target: { value: '2025-05-18' } });
    fireEvent.change(typeInput, { target: { value: 'Strength' } });
    fireEvent.change(durationInput, { target: { value: '60' } });
    fireEvent.change(exercisesInput, { target: { value: 'Bench Press' } });

    expect(dateInput).toHaveValue('2025-05-18');
    expect(typeInput).toHaveValue('Strength');
    expect(durationInput).toHaveValue('60');
    expect(exercisesInput).toHaveValue('Bench Press');
  });

  it('calls the API to create a new workout on "Save" button click', async () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
          <Route path="/" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );

    const dateInput = screen.getByLabelText('Date');
    const typeInput = screen.getByLabelText('Type');
    const durationInput = screen.getByLabelText('Duration');
    const exercisesInput = screen.getByLabelText('Exercises');
    const saveButton = screen.getByText('Save');

    fireEvent.change(dateInput, { target: { value: '2025-05-18' } });
    fireEvent.change(typeInput, { target: { value: 'Strength' } });
    fireEvent.change(durationInput, { target: { value: '60' } });
    fireEvent.change(exercisesInput, { target: { value: 'Bench Press' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(supabase.default.from().insert).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('redirects to the workout list page after successful workout creation', async () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
          <Route path="/" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );

    const dateInput = screen.getByLabelText('Date');
    const typeInput = screen.getByLabelText('Type');
    const durationInput = screen.getByLabelText('Duration');
    const exercisesInput = screen.getByLabelText('Exercises');
    const saveButton = screen.getByText('Save');

    fireEvent.change(dateInput, { target: { value: '2025-05-18' } });
    fireEvent.change(typeInput, { target: { value: 'Strength' } });
    fireEvent.change(durationInput, { target: { value: '60' } });
    fireEvent.change(exercisesInput, { target: { value: 'Bench Press' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Workout List')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('displays validation errors for invalid input', async () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
        </Routes>
      </MemoryRouter>
    );

    const dateInput = screen.getByLabelText('Date');
    const durationInput = screen.getByLabelText('Duration');
    const saveButton = screen.getByText('Save');

    fireEvent.change(dateInput, { target: { value: 'invalid-date' } });
    fireEvent.change(durationInput, { target: { value: 'abc' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid date format')).toBeInTheDocument();
      expect(screen.getByText('Duration must be a number')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('disables the "Save" button while the API call is in progress', async () => {
    (supabase.default.from as any).mockReturnValue({
      insert: vi.fn().mockImplementation(() => new Promise(() => {})), // Simulate pending
    });

    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
        </Routes>
      </MemoryRouter>
    );

    const dateInput = screen.getByLabelText('Date');
    const saveButton = screen.getByText('Save');

    fireEvent.change(dateInput, { target: { value: '2025-05-18' } });
    fireEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
    await waitFor(() => expect(saveButton).not.toBeDisabled(), { timeout: 1000 });
  });

  it('displays a loading indicator while the API call is in progress', async () => {
    (supabase.default.from as any).mockReturnValue({
      insert: vi.fn().mockImplementation(() => new Promise(() => {})), // Simulate pending
    });

    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
        </Routes>
      </MemoryRouter>
    );

    const dateInput = screen.getByLabelText('Date');
    const saveButton = screen.getByText('Save');

    fireEvent.change(dateInput, { target: { value: '2025-05-18' } });
    fireEvent.click(saveButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Saving...')).not.toBeInTheDocument(), { timeout: 1000 });
  });

  it('handles errors during workout creation', async () => {
    (supabase.default.from as any).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Creation error' } }),
    });

    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
        </Routes>
      </MemoryRouter>
    );

    const dateInput = screen.getByLabelText('Date');
    const saveButton = screen.getByText('Save');

    fireEvent.change(dateInput, { target: { value: '2025-05-18' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Error creating workout: Creation error')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('clears the input fields after successful workout creation', async () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
          <Route path="/" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );

    const dateInput = screen.getByLabelText('Date');
    const saveButton = screen.getByText('Save');

    fireEvent.change(dateInput, { target: { value: '2025-05-18' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(dateInput).toHaveValue('');
    }, { timeout: 1000 });
  });

  it('navigates back to the workout list page on "Cancel" button click', () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
          <Route path="/" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.getByText('Workout List')).toBeInTheDocument();
  });
});
