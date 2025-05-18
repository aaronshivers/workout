import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CreateWorkout from './CreateWorkout';
import supabase from '../../utils/supabase';
import '@testing-library/jest-dom';

// Mock Supabase
vi.mock('../../utils/supabase', () => ({
  default: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  },
}));

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

describe('CreateWorkout Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as any).mockReturnValue({
      insert: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    });
  });

  it('renders without crashing', async () => {
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/create workout/i)).toBeInTheDocument();
    });
  });

  it('displays input fields for workout details', async () => {
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/exercises/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sets/i)).toBeInTheDocument();
    });
  });

  it('displays a "Save" button', async () => {
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  it('displays a "Cancel" button', async () => {
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it('updates the corresponding state for each input field on change', async () => {
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );
    await waitFor(async () => {
      const dateInput = screen.getByLabelText(/date/i);
      await user.type(dateInput, '2025-05-18');
      expect(dateInput).toHaveValue('2025-05-18');

      const typeInput = screen.getByLabelText(/type/i);
      await user.type(typeInput, 'Strength');
      expect(typeInput).toHaveValue('Strength');

      const durationInput = screen.getByLabelText(/duration/i);
      await user.type(durationInput, '60');
      expect(durationInput).toHaveValue('60');

      const exercisesInput = screen.getByLabelText(/exercises/i);
      await user.type(exercisesInput, 'Bench Press');
      expect(exercisesInput).toHaveValue('Bench Press');

      const setsInput = screen.getByLabelText(/sets/i);
      await user.type(setsInput, '3');
      expect(setsInput).toHaveValue('3');
    });
  });

  it('calls the API to create a new workout on "Save" button click', async () => {
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );
    await waitFor(async () => {
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      expect(supabase.from).toHaveBeenCalledWith('workouts');
      expect(supabase.from().insert).toHaveBeenCalled();
    });
  });

  it('redirects to the workout list page after successful workout creation', async () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
          <Route path="/workouts" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(async () => {
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      expect(screen.getByText(/workout list/i)).toBeInTheDocument();
    });
  });

  it('displays validation errors for invalid input', async () => {
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );
    await waitFor(async () => {
      const dateInput = screen.getByLabelText(/date/i);
      await user.type(dateInput, 'invalid-date');
      const durationInput = screen.getByLabelText(/duration/i);
      await user.type(durationInput, 'invalid');
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      expect(screen.getByText(/invalid date format/i)).toBeInTheDocument();
      expect(screen.getByText(/duration must be a number/i)).toBeInTheDocument();
    });
  });

  it('disables the "Save" button while the API call is in progress', async () => {
    let resolveInsert: (value: any) => void;
    (supabase.from().insert().single as any).mockReturnValue(
      new Promise((resolve) => {
        resolveInsert = resolve;
      })
    );
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );
    await waitFor(async () => {
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      expect(saveButton).toBeDisabled();
      resolveInsert!({ data: {}, error: null });
    });
  });

  it('displays a loading indicator while the API call is in progress', async () => {
    (supabase.from().insert().single as any).mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );
    await waitFor(async () => {
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  it('handles errors during workout creation', async () => {
    (supabase.from().insert().single as any).mockResolvedValue({
      data: null,
      error: { message: 'Creation error' },
    });
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );
    await waitFor(async () => {
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      expect(screen.getByText(/error creating workout: creation error/i)).toBeInTheDocument();
    });
  });

  it('clears the input fields after successful workout creation', async () => {
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );
    await waitFor(async () => {
      const dateInput = screen.getByLabelText(/date/i);
      await user.type(dateInput, '2025-05-18');
      const typeInput = screen.getByLabelText(/type/i);
      await user.type(typeInput, 'Strength');
      const durationInput = screen.getByLabelText(/duration/i);
      await user.type(durationInput, '60');
      const exercisesInput = screen.getByLabelText(/exercises/i);
      await user.type(exercisesInput, 'Bench Press');
      const setsInput = screen.getByLabelText(/sets/i);
      await user.type(setsInput, '3');
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      expect(dateInput).toHaveValue('');
      expect(typeInput).toHaveValue('');
      expect(durationInput).toHaveValue('');
      expect(exercisesInput).toHaveValue('');
      expect(setsInput).toHaveValue('');
    });
  });

  it('navigates back to the workout list page on "Cancel" button click', async () => {
    render(
      <MemoryRouter initialEntries={['/create']}>
        <Routes>
          <Route path="/create" element={<CreateWorkout />} />
          <Route path="/workouts" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(async () => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      expect(screen.getByText(/workout list/i)).toBeInTheDocument();
    });
  });
});
