import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CreateWorkout from './CreateWorkout';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnValue({ error: null }),
  },
}));

describe('CreateWorkout', () => {
  const mockNavigate = vi.fn();
  vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useNavigate: () => mockNavigate,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <CreateWorkout />
      </MemoryRouter>
    );

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText(/Create Workout/i)).toBeInTheDocument();
  });

  it('displays input fields for workout details', () => {
    renderComponent();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Exercises/i)).toBeInTheDocument();
  });

  it('displays a "Save" button', () => {
    renderComponent();
    expect(screen.getByText(/Save/i)).toBeInTheDocument();
  });

  it('displays a "Cancel" button', () => {
    renderComponent();
    expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
  });

  it('updates the corresponding state for each input field on change', async () => {
    renderComponent();

    await userEvent.type(screen.getByLabelText(/Date/i), '2025-05-18');
    await userEvent.type(screen.getByLabelText(/Type/i), 'Strength');
    await userEvent.type(screen.getByLabelText(/Duration/i), '60');
    await userEvent.type(screen.getByLabelText(/Exercises/i), 'Bench Press');

    expect(screen.getByLabelText(/Date/i)).toHaveValue('2025-05-18');
    expect(screen.getByLabelText(/Type/i)).toHaveValue('Strength');
    expect(screen.getByLabelText(/Duration/i)).toHaveValue('60');
    expect(screen.getByLabelText(/Exercises/i)).toHaveValue('Bench Press');
  });

  it('calls the API to create a new workout on "Save" button click', async () => {
    renderComponent();

    await userEvent.type(screen.getByLabelText(/Date/i), '2025-05-18');
    await userEvent.type(screen.getByLabelText(/Type/i), 'Strength');
    await userEvent.type(screen.getByLabelText(/Duration/i), '60');
    await userEvent.type(screen.getByLabelText(/Exercises/i), 'Bench Press');

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('workouts');
      expect(supabase.insert).toHaveBeenCalled();
    });
  });

  it('redirects to the workout list page after successful workout creation', async () => {
    renderComponent();

    await userEvent.type(screen.getByLabelText(/Date/i), '2025-05-18');
    await userEvent.type(screen.getByLabelText(/Type/i), 'Strength');
    await userEvent.type(screen.getByLabelText(/Duration/i), '60');
    await userEvent.type(screen.getByLabelText(/Exercises/i), 'Bench Press');

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/workouts');
    });
  });

  it('displays validation errors for invalid input', async () => {
    renderComponent();

    await userEvent.type(screen.getByLabelText(/Date/i), 'invalid-date');
    await userEvent.type(screen.getByLabelText(/Duration/i), 'invalid');

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(screen.getByText(/Invalid date format/i)).toBeInTheDocument();
      expect(screen.getByText(/Duration must be a number/i)).toBeInTheDocument();
    });
  });

  it('disables the "Save" button while the API call is in progress', async () => {
    renderComponent();

    await userEvent.type(screen.getByLabelText(/Date/i), '2025-05-18');
    await userEvent.type(screen.getByLabelText(/Type/i), 'Strength');
    await userEvent.type(screen.getByLabelText(/Duration/i), '60');
    await userEvent.type(screen.getByLabelText(/Exercises/i), 'Bench Press');

    fireEvent.click(screen.getByText(/Save/i));

    expect(screen.getByText(/Saving.../i).closest('button')).toBeDisabled();
  });

  it('displays a loading indicator while the API call is in progress', async () => {
    renderComponent();

    await userEvent.type(screen.getByLabelText(/Date/i), '2025-05-18');
    await userEvent.type(screen.getByLabelText(/Type/i), 'Strength');
    await userEvent.type(screen.getByLabelText(/Duration/i), '60');
    await userEvent.type(screen.getByLabelText(/Exercises/i), 'Bench Press');

    fireEvent.click(screen.getByText(/Save/i));

    expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
  });

  it('handles errors during workout creation', async () => {
    (supabase.insert as any).mockReturnValueOnce({ error: new Error('Creation error') });

    renderComponent();

    await userEvent.type(screen.getByLabelText(/Date/i), '2025-05-18');
    await userEvent.type(screen.getByLabelText(/Type/i), 'Strength');
    await userEvent.type(screen.getByLabelText(/Duration/i), '60');
    await userEvent.type(screen.getByLabelText(/Exercises/i), 'Bench Press');

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(screen.getByText(/Error creating workout/i)).toBeInTheDocument();
    });
  });

  it('clears the input fields after successful workout creation', async () => {
    renderComponent();

    await userEvent.type(screen.getByLabelText(/Date/i), '2025-05-18');
    await userEvent.type(screen.getByLabelText(/Type/i), 'Strength');
    await userEvent.type(screen.getByLabelText(/Duration/i), '60');
    await userEvent.type(screen.getByLabelText(/Exercises/i), 'Bench Press');

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/Date/i)).toHaveValue('');
      expect(screen.getByLabelText(/Type/i)).toHaveValue('');
      expect(screen.getByLabelText(/Duration/i)).toHaveValue('');
      expect(screen.getByLabelText(/Exercises/i)).toHaveValue('');
    });
  });

  it('navigates back to the workout list page on "Cancel" button click', async () => {
    renderComponent();

    fireEvent.click(screen.getByText(/Cancel/i));

    expect(mockNavigate).toHaveBeenCalledWith('/workouts');
  });
});
