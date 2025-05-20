import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EditWorkout from './EditWorkout';
import supabase from '../../utils/supabase';
import '@testing-library/jest-dom';

// Mock Supabase
vi.mock('../../utils/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: '1' })),
  };
});

describe('EditWorkout Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: '1',
              date: '2025-05-18',
              type: 'Strength',
              duration: 60,
              exercises: 'Bench Press',
              sets: 3,
            },
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        })),
      })),
    });
  });

  it('renders without crashing', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/edit workout/i)).toBeInTheDocument();
    });
  });

  it('displays a loading state while fetching the workout details', () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays input fields pre-filled with the workout’s existing data', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/date/i)).toHaveValue('2025-05-18');
      expect(screen.getByLabelText(/type/i)).toHaveValue('Strength');
      expect(screen.getByLabelText(/duration/i)).toHaveValue('60');
      expect(screen.getByLabelText(/exercises/i)).toHaveValue('Bench Press');
      expect(screen.getByLabelText(/sets/i)).toHaveValue('3');
    });
  });

  it('displays an "Update" button', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /update/i }),
      ).toBeInTheDocument();
    });
  });

  it('displays a "Cancel" button', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /cancel/i }),
      ).toBeInTheDocument();
    });
  });

  it('updates the corresponding state for each input field on change', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    await waitFor(async () => {
      const setsInput = screen.getByLabelText(/sets/i);
      await user.clear(setsInput);
      await user.type(setsInput, '4');
      expect(setsInput).toHaveValue('4');
    });
  });

  it('calls the API to update the workout on "Update" button click', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /update/i }));
      expect(supabase.from).toHaveBeenCalledWith('workouts');
      expect(supabase.from().update).toHaveBeenCalled();
    });
  });

  it('redirects to the workout list page after successful workout update', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
          <Route path="/workouts" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /update/i }));
      expect(screen.getByText(/workout list/i)).toBeInTheDocument();
    });
  });

  it('displays validation errors for invalid input', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    await waitFor(async () => {
      const setsInput = screen.getByLabelText(/sets/i);
      await user.clear(setsInput);
      await user.type(setsInput, '0');
      await user.click(screen.getByRole('button', { name: /update/i }));
      expect(
        screen.getByText(/sets must be a positive number/i),
      ).toBeInTheDocument();
    });
  });

  it('disables the "Update" button while the API call is in progress', async () => {
    let resolveUpdate: (value: any) => void;
    (supabase.from().update().eq().single as any).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /update/i }));
      expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
      resolveUpdate!({ data: {}, error: null });
    });
  });

  it('displays a loading indicator while the API call is in progress', async () => {
    (supabase.from().update().eq().single as any).mockReturnValue(
      new Promise(() => {}),
    );
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /update/i }));
      expect(screen.getByText(/updating/i)).toBeInTheDocument();
    });
  });

  it('handles errors during workout update', async () => {
    (supabase.from().update().eq().single as any).mockResolvedValue({
      data: null,
      error: { message: 'Update error' },
    });
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /update/i }));
      expect(screen.getByText(/update error/i)).toBeInTheDocument();
    });
  });

  it('navigates back to the workout list page on "Cancel" button click', async () => {
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <Routes>
          <Route path="/edit/:id" element={<EditWorkout />} />
          <Route path="/workouts" element={<div>Workout List</div>} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.getByText(/workout list/i)).toBeInTheDocument();
    });
  });

  it('handles errors if the workout ID in the URL is invalid', async () => {
    (supabase.from().select().eq().single as any).mockResolvedValue({
      data: null,
      error: { message: 'Workout not found' },
    });
    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <EditWorkout />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/workout not found/i)).toBeInTheDocument();
    });
  });
});
