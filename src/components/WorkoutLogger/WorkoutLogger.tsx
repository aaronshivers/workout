import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import type { Database } from '../../types/supabase';

interface WorkoutLoggerProps {
  userId: string;
  exerciseId?: number | null;
  sets?: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  setWorkouts: React.Dispatch<
    React.SetStateAction<Database['public']['Tables']['workouts']['Row'][]>
  >;
  isInitialized: boolean;
}

interface ProgressionSuggestion {
  weight: number;
  sets: number;
  suggestion: string;
}

const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({
  userId,
  exerciseId = null,
  sets = 3,
  reps = 10,
  weight = 100,
  rpe = 7,
  setWorkouts,
  isInitialized,
}) => {
  const [isLogging, setIsLogging] = useState(false);
  const [progression, setProgression] = useState<ProgressionSuggestion | null>(
    null,
  );

  useEffect(() => {
    const fetchLastWorkout = async () => {
      if (!userId || !exerciseId) return;
      const { data } = await supabase
        .from('workout_sets')
        .select('weight, sets, rpe')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        let suggestion = '';
        let newWeight = data.weight;
        let newSets = data.sets;
        if (data.rpe < 7) {
          suggestion = `RPE ${data.rpe} is low. Increase weight by 5-10% or add 1 set.`;
          newWeight *= 1.05;
          newSets += 1;
        } else if (data.rpe > 8) {
          suggestion = `RPE ${data.rpe} is high. Decrease weight by 5-10% or reduce 1 set.`;
          newWeight *= 0.95;
          if (newSets > 1) newSets -= 1;
        } else {
          suggestion = `RPE ${data.rpe} is optimal. Maintain current weight and sets.`;
        }
        setProgression({ weight: newWeight, sets: newSets, suggestion });
      }
    };
    fetchLastWorkout();
  }, [userId, exerciseId]);

  const handleLogWorkout = async () => {
    if (!isInitialized || !exerciseId || !userId) {
      console.error('Initialization or exercise/user not ready.');
      return;
    }

    setIsLogging(true);

    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({ user_id: userId, created_at: new Date().toISOString() })
        .select()
        .single();

      if (workoutError) throw workoutError;

      const workoutId = workoutData.id;

      const setData = Array.from({ length: progression?.sets ?? sets }, () => ({
        workout_id: workoutId,
        exercise_id: exerciseId,
        sets: progression?.sets ?? sets,
        reps,
        weight: progression?.weight ?? weight,
        rpe,
        created_at: new Date().toISOString(),
      }));

      const { error: setError } = await supabase
        .from('workout_sets')
        .insert(setData);

      if (setError) throw setError;

      const { data: newWorkouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId);
      setWorkouts(newWorkouts || []);
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to log workout. Check console for details.');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="mt-4">
      {progression && (
        <div className="text-gray-700 mb-2">{progression.suggestion}</div>
      )}
      <button
        onClick={handleLogWorkout}
        disabled={isLogging || !isInitialized || !exerciseId}
        className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {isLogging ? 'Logging...' : 'Log Workout'}
      </button>
    </div>
  );
};

export default WorkoutLogger;
