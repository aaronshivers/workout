import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import type { Database } from '../types/supabase';
import { useAuth } from '../hooks/useAuth';

type Workout = Database['public']['Tables']['workouts']['Row'] & {
  workout_exercises: (Database['public']['Tables']['workout_exercises']['Row'] & {
    workout_sets: Database['public']['Tables']['workout_sets']['Row'][];
  })[];
};
type Exercise = Database['public']['Tables']['exercises']['Row'];

interface WorkoutContextType {
  workouts: Workout[];
  exercises: Exercise[];
  setWorkouts: React.Dispatch<React.SetStateAction<Workout[]>>;
  setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
  isLoading: boolean;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: workoutData, error: workoutError } = await supabase
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
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (workoutError) throw workoutError;
        setWorkouts(workoutData || []);

        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercises')
          .select('*')
          .eq('user_id', user.id)
          .order('name');
        if (exerciseError) throw exerciseError;
        setExercises(exerciseData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  const value = {
    workouts,
    exercises,
    setWorkouts,
    setExercises,
    isLoading,
  };

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
