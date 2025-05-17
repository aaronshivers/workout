import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import WorkoutLogger from './WorkoutLogger';
import * as supabase from '../../utils/supabase';
import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';

vi.mock('../../utils/supabase', () => {
  const from = vi.fn();
  from.mockImplementation((table: string) => {
    if (table === 'workouts') {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    }
    if (table === 'workout_sets') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    return {};
  });

  return {
    default: {
      from,
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
    },
  };
});

describe('WorkoutLogger', () => {
  const mockSetWorkouts = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <WorkoutLogger
        userId="5f9452e4-ddca-4b55-99f7-f956be84a46f"
        exerciseId={1}
        sets={3}
        reps={10}
        weight={100}
        rpe={7}
        setWorkouts={mockSetWorkouts}
        isInitialized={true}
      />
    );
    expect(screen.getByText('Log Workout')).toBeInTheDocument();
  });

  it('disables the "Log Workout" button while the API call is in progress', async () => {
    render(
      <WorkoutLogger
        userId="5f9452e4-ddca-4b55-99f7-f956be84a46f"
        exerciseId={1}
        sets={3}
        reps={10}
        weight={100}
        rpe={7}
        setWorkouts={mockSetWorkouts}
        isInitialized={true}
      />
    );

    const button = screen.getByText('Log Workout');
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Logging...');
    await waitFor(() => expect(button).toHaveTextContent('Log Workout'));
  });

  it('calls the API to create a new workout on "Log Workout" button click', async () => {
    render(
      <WorkoutLogger
        userId="5f9452e4-ddca-4b55-99f7-f956be84a46f"
        exerciseId={1}
        sets={3}
        reps={10}
        weight={100}
        rpe={7}
        setWorkouts={mockSetWorkouts}
        isInitialized={true}
      />
    );

    const button = screen.getByText('Log Workout');
    fireEvent.click(button);

    await waitFor(() => {
      expect(supabase.default.from).toHaveBeenCalledWith('workouts');
      expect(mockSetWorkouts).toHaveBeenCalled();
    });
  });

  it('disables the "Log Workout" button when not initialized', () => {
    render(
      <WorkoutLogger
        userId="5f9452e4-ddca-4b55-99f7-f956be84a46f"
        exerciseId={1}
        sets={3}
        reps={10}
        weight={100}
        rpe={7}
        setWorkouts={mockSetWorkouts}
        isInitialized={false}
      />
    );

    const button = screen.getByText('Log Workout');
    expect(button).toBeDisabled();
  });
});
