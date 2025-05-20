import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import WorkoutLogger from './WorkoutLogger';
import supabase from '../../utils/supabase';
import '@testing-library/jest-dom';

vi.mock('../../utils/supabase', () => ({
  default: {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'workouts') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: { id: 1 }, error: null }),
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
    }),
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

describe('WorkoutLogger', () => {
  const mockSetWorkouts = vi.fn();
  const defaultProps = {
    userId: '5f9452e4-ddca-4b55-99f7-f956be84a46f',
    exerciseId: 1,
    sets: 3,
    reps: 10,
    weight: 100,
    rpe: 7,
    setWorkouts: mockSetWorkouts,
    isInitialized: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(screen.getByText('Log Workout')).toBeInTheDocument();
  });

  it('disables the "Log Workout" button while the API call is in progress', async () => {
    render(<WorkoutLogger {...defaultProps} />);
    const button = screen.getByText('Log Workout');
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Logging...');
    await waitFor(() => expect(button).toHaveTextContent('Log Workout'));
  });

  it('calls the API to create a new workout on "Log Workout" button click', async () => {
    render(<WorkoutLogger {...defaultProps} />);
    const button = screen.getByText('Log Workout');
    fireEvent.click(button);
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('workouts');
      expect(mockSetWorkouts).toHaveBeenCalled();
    });
  });

  it('disables the "Log Workout" button when not initialized', () => {
    render(<WorkoutLogger {...defaultProps} isInitialized={false} />);
    const button = screen.getByText('Log Workout');
    expect(button).toBeDisabled();
  });

  it('disables the "Log Workout" button when exerciseId is null', () => {
    render(<WorkoutLogger {...defaultProps} exerciseId={null} />);
    const button = screen.getByText('Log Workout');
    expect(button).toBeDisabled();
  });

  it('displays a loading indicator while the API call is in progress', async () => {
    render(<WorkoutLogger {...defaultProps} />);
    const button = screen.getByText('Log Workout');
    fireEvent.click(button);
    expect(screen.getByText('Logging...')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('Log Workout')).toBeInTheDocument(),
    );
  });

  it('handles errors during workout logging', async () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    (supabase.from as any).mockReturnValueOnce({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insert error' },
          }),
        }),
      }),
    });
    render(<WorkoutLogger {...defaultProps} />);
    const button = screen.getByText('Log Workout');
    fireEvent.click(button);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Failed to log workout. Check console for details.',
      );
    });
  });

  it('renders with correct Tailwind CSS classes', () => {
    render(<WorkoutLogger {...defaultProps} />);
    const container = screen.getByText('Log Workout').parentElement;
    expect(container).toHaveClass('mt-4');
    const button = screen.getByText('Log Workout');
    expect(button).toHaveClass(
      'w-full',
      'bg-green-500',
      'text-white',
      'px-4',
      'py-2',
      'rounded',
    );
  });

  it('updates workouts state with new workout data', async () => {
    const newWorkouts = [
      { id: 1, user_id: defaultProps.userId, created_at: '2025-05-19' },
    ];
    (supabase.from as any)
      .mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: newWorkouts, error: null }),
        }),
      });
    render(<WorkoutLogger {...defaultProps} />);
    const button = screen.getByText('Log Workout');
    fireEvent.click(button);
    await waitFor(() => {
      expect(mockSetWorkouts).toHaveBeenCalledWith(newWorkouts);
    });
  });

  it('displays progression suggestion based on last workout RPE', async () => {
    (supabase.from as any).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { weight: 100, sets: 3, rpe: 6 },
                error: null,
              }),
            }),
          }),
        }),
      }),
    });
    render(<WorkoutLogger {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/RPE 6 is low/i)).toBeInTheDocument();
    });
  });
});
