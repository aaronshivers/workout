import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WorkoutHistory from './WorkoutHistory';
import * as supabase from '../../utils/supabase';
import '@testing-library/jest-dom';

vi.mock('../../utils/supabase', () => {
  const from = vi.fn();
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

describe('WorkoutHistory', () => {
  const muscleGroups = ['Chest', 'Back'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<WorkoutHistory workouts={[]} muscleGroups={muscleGroups} />);
    expect(screen.getByText('Workout History')).toBeInTheDocument();
  });

  it('displays a "No workouts found" message when the list is empty', () => {
    render(<WorkoutHistory workouts={[]} muscleGroups={muscleGroups} />);
    expect(screen.getByText('No workouts found.')).toBeInTheDocument();
  });

  it('displays a list of workouts fetched from the API', () => {
    const workouts = [
      {
        id: 1,
        user_id: 'user-id',
        created_at: '2025-05-18T12:00:00Z',
        workout_sets: [
          { id: 1, exercise_id: 1, sets: 3, reps: 10, weight: 100, rpe: 7, exercises: { name: 'Bench Press' } },
        ],
      },
    ];
    render(<WorkoutHistory workouts={workouts} muscleGroups={muscleGroups} />);
    expect(screen.getByText(/Bench Press/)).toBeInTheDocument();
  });

  it('renders each workout with its relevant details', () => {
    const workouts = [
      {
        id: 1,
        user_id: 'user-id',
        created_at: '2025-05-18T12:00:00Z',
        workout_sets: [
          { id: 1, exercise_id: 1, sets: 3, reps: 10, weight: 100, rpe: 7, exercises: { name: 'Bench Press' } },
        ],
      },
    ];
    render(<WorkoutHistory workouts={workouts} muscleGroups={muscleGroups} />);
    expect(screen.getByText((content, element) => content.includes('Date:') && content.includes('2025-05-18'))).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.includes('Exercise:') && content.includes('Bench Press'))).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.includes('Sets:') && content.includes('3'))).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.includes('Reps:') && content.includes('10'))).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.includes('Weight:') && content.includes('100'))).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.includes('RPE:') && content.includes('7'))).toBeInTheDocument();
  });
});
