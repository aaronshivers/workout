import React from 'react';
import type { Database } from '../../types/supabase';

type ExerciseWithMuscleGroup =
  Database['public']['Tables']['exercises']['Row'] & {
    muscle_groups: { name: string }[] | null;
  };

type WorkoutSet = Database['public']['Tables']['workout_sets']['Row'] & {
  exercises: ExerciseWithMuscleGroup | null;
};

type Workout = Database['public']['Tables']['workouts']['Row'] & {
  workout_sets: WorkoutSet[];
};

type WorkoutHistoryProps = {
  workouts: Workout[];
  muscleGroups: string[];
};

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  workouts,
}) => {
  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Workout History</h2>
        <p className="text-gray-600">No workouts found.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Workout History</h2>
      <div className="space-y-4">
        {workouts.map((workout) => (
          <div key={workout.id} className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
            <p className="text-lg text-gray-800 mb-2">
              <strong>Date:</strong>{' '}
              {new Date(workout.created_at).toISOString().split('T')[0]}
            </p>
            {workout.workout_sets && workout.workout_sets.length > 0 ? (
              workout.workout_sets.map((set) => (
                <div key={set.id} className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-100">
                  <p className="text-md text-gray-700">
                    <strong>Exercise:</strong>{' '}
                    {set.exercises?.name || 'Unknown Exercise'}
                  </p>
                  <p className="text-md text-gray-700">
                    <strong>Sets:</strong> {set.sets}
                  </p>
                  <p className="text-md text-gray-700">
                    <strong>Reps:</strong> {set.reps}
                  </p>
                  <p className="text-md text-gray-700">
                    <strong>Weight:</strong> {set.weight}
                  </p>
                  <p className="text-md text-gray-700">
                    <strong>RPE:</strong> {set.rpe}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-600 mt-2">No sets recorded for this workout.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutHistory;
