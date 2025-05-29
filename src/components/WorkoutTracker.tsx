import React, { useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useWorkout } from './WorkoutProvider';
import WorkoutForm from './WorkoutForm';
import WorkoutHistory from './Workout/WorkoutDetail';
import WorkoutLogger from './WorkoutLogger/WorkoutLogger';
import type { Database } from '../types/supabase';
import { supabase } from '@/utils/supabase';

type Exercise = Database['public']['Tables']['exercises']['Row'];
type WorkoutSet = Database['public']['Tables']['workout_sets']['Row'];
type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
type Workout = Database['public']['Tables']['workouts']['Row'] & {
  workout_exercises: (WorkoutExercise & { workout_sets: WorkoutSet[] })[];
};

const muscleGroups: string[] = [
  'Chest',
  'Back',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Biceps',
  'Triceps',
  'Traps',
  'Forearms',
  'Side Delts',
  'Front Delts',
  'Rear Delts',
  'Calves',
  'Abs',
];

const WorkoutTracker: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { workouts, exercises, setWorkouts, isLoading } = useWorkout();
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [muscleGroup, setMuscleGroup] = useState<string>('');
  const [sets, setSets] = useState<number>(3);
  const [reps, setReps] = useState<number>(10);
  const [weight, setWeight] = useState<number>(100);
  const [rpe, setRpe] = useState<number>(7);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Workout Tracker</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Log Out
          </button>
        </div>
        <WorkoutForm
          exercises={exercises}
          muscleGroups={muscleGroups}
          exerciseId={exerciseId}
          setExerciseId={setExerciseId}
          muscleGroup={muscleGroup}
          setMuscleGroup={setMuscleGroup}
          sets={sets}
          setSets={setSets}
          reps={reps}
          setReps={setReps}
          weight={weight}
          setWeight={setWeight}
          rpe={rpe}
          setRpe={setRpe}
        />
        <WorkoutLogger
          userId={user.id}
          exerciseId={exerciseId}
          sets={sets}
          reps={reps}
          weight={weight}
          rpe={rpe}
          setWorkouts={setWorkouts}
          isInitialized={true}
        />
        <WorkoutHistory workouts={workouts} />
      </div>
    </div>
  );
};

export default WorkoutTracker;
