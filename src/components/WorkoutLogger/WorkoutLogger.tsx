// src/components/WorkoutLogger/WorkoutLogger.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useWorkout } from '../WorkoutProvider';
import { toast } from 'sonner';
import type { Database } from '../../types/supabase';

type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
type WorkoutSet = Database['public']['Tables']['workout_sets']['Row'];
type Exercise = Database['public']['Tables']['exercises']['Row'];

interface WorkoutLoggerProps {
  userId: string;
  exerciseId: string | null;
  sets: number;
  reps: number;
  weight: number | null;
  rpe: number | null;
  setWorkouts: React.Dispatch<
    React.SetStateAction<
      (Database['public']['Tables']['workouts']['Row'] & {
        workout_exercises: (WorkoutExercise & { workout_sets: WorkoutSet[] })[];
      })[]
    >
  >;
  isInitialized: boolean;
}

interface ProgressionSuggestion {
  weight: number | null;
  sets: number;
  reps: number;
  suggestion: string;
}

const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({
  userId,
  exerciseId,
  sets = 3,
  reps = 10,
  weight = null,
  rpe = null,
  setWorkouts,
  isInitialized,
}) => {
  const [isLogging, setIsLogging] = useState(false);
  const [progression, setProgression] = useState<ProgressionSuggestion | null>(
    null,
  );
  const [formData, setFormData] = useState({ sets, reps, weight, rpe });
  const { exercises } = useWorkout();

  useEffect(() => {
    const fetchLastWorkout = async () => {
      if (!userId || !exerciseId) return;
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(
          `
          *,
          workout_sets (
            set_number,
            reps,
            weight_kg,
            rpe,
            created_at
          )
        `,
        )
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching last workout:', error);
        return;
      }

      if (data && data.workout_sets.length > 0) {
        const lastSet = data.workout_sets.reduce((max, set) =>
          new Date(set.created_at || '') > new Date(max.created_at || '')
            ? set
            : max,
        );
        let suggestion = '';
        let newWeight = lastSet.weight_kg;
        let newSets = data.workout_sets.length;
        let newReps = lastSet.reps;

        // RP Set Progression Algorithm
        if (lastSet.rpe && lastSet.rpe < 7) {
          suggestion = `RPE ${lastSet.rpe} is low. Increase weight by 5-10% or add 1 set.`;
          newWeight = newWeight
            ? Math.round(newWeight * 1.075 * 10) / 10
            : null;
          newSets = newSets < 4 ? newSets + 1 : newSets;
        } else if (lastSet.rpe && lastSet.rpe > 8) {
          suggestion = `RPE ${lastSet.rpe} is high. Decrease weight by 5-10% or reduce 1 set.`;
          newWeight = newWeight
            ? Math.round(newWeight * 0.925 * 10) / 10
            : null;
          newSets = newSets > 1 ? newSets - 1 : newSets;
        } else {
          suggestion = `RPE ${lastSet.rpe || 'N/A'} is optimal. Increase weight by 2.5-5% for next session.`;
          newWeight = newWeight
            ? Math.round(newWeight * 1.0375 * 10) / 10
            : null;
        }

        setProgression({
          weight: newWeight,
          sets: newSets,
          reps: newReps,
          suggestion,
        });
      }
    };
    fetchLastWorkout();
  }, [userId, exerciseId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : parseFloat(value),
    }));
  };

  const handleLogWorkout = async () => {
    if (!isInitialized || !exerciseId || !userId) {
      toast('Please select an exercise and ensure you are logged in.', {
        style: { background: 'red', color: 'white' },
      });
      return;
    }

    setIsLogging(true);

    try {
      // Insert workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          date: new Date().toISOString().split('T')[0],
          name: `Workout ${new Date().toLocaleDateString()}`,
        })
        .select('id')
        .single();

      if (workoutError) {
        throw new Error(`Failed to insert workout: ${workoutError.message}`);
      }

      const workoutId = workoutData.id;

      // Insert workout_exercise
      const { data: workoutExerciseData, error: workoutExerciseError } =
        await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutId,
            exercise_id: exerciseId,
            user_id: userId,
            order_index: 0,
          })
          .select('id')
          .single();

      if (workoutExerciseError) {
        throw new Error(
          `Failed to insert workout exercise: ${workoutExerciseError.message}`,
        );
      }

      const workoutExerciseId = workoutExerciseData.id;

      // Insert sets
      const setData = Array.from(
        { length: progression?.sets ?? formData.sets },
        (_, i) => ({
          workout_exercise_id: workoutExerciseId,
          user_id: userId,
          set_number: i + 1,
          reps: progression?.reps ?? formData.reps,
          weight_kg: progression?.weight ?? formData.weight,
          rpe: formData.rpe,
        }),
      );

      const { error: setError } = await supabase
        .from('workout_sets')
        .insert(setData);

      if (setError) {
        throw new Error(`Failed to insert sets: ${setError.message}`);
      }

      // Refresh workouts
      const { data: newWorkouts, error: fetchError } = await supabase
        .from('workouts')
        .select(
          `
          *,
          workout_exercises (
            *,
            workout_sets (*)
          )
        `,
        )
        .eq('user_id', userId);

      if (fetchError) {
        throw new Error(
          `Failed to fetch updated workouts: ${fetchError.message}`,
        );
      }

      setWorkouts(newWorkouts || []);
      toast('Workout logged successfully!');
    } catch (error: any) {
      console.error('Error logging workout:', error);
      toast(`Failed to log workout: ${error.message}`, {
        style: { background: 'red', color: 'white' },
      });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Log Workout</h3>
      {progression && (
        <div className="text-gray-700 mb-4 bg-gray-50 p-2 rounded">
          <p>
            <strong>Suggestion:</strong> {progression.suggestion}
          </p>
          <p>
            <strong>Recommended Weight:</strong>{' '}
            {progression.weight ? `${progression.weight.toFixed(1)} kg` : 'N/A'}
          </p>
          <p>
            <strong>Recommended Sets:</strong> {progression.sets}
          </p>
          <p>
            <strong>Recommended Reps:</strong> {progression.reps}
          </p>
        </div>
      )}
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sets
          </label>
          <input
            type="number"
            name="sets"
            value={formData.sets || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reps
          </label>
          <input
            type="number"
            name="reps"
            value={formData.reps || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Weight (kg)
          </label>
          <input
            type="number"
            name="weight"
            value={formData.weight || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            RPE (1-10)
          </label>
          <input
            type="number"
            name="rpe"
            value={formData.rpe || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            min="1"
            max="10"
            step="0.5"
          />
        </div>
      </div>
      <button
        onClick={handleLogWorkout}
        disabled={isLogging || !isInitialized || !exerciseId}
        className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {isLogging ? 'Logging...' : 'Log Workout'}
      </button>
    </div>
  );
};

export default WorkoutLogger;
