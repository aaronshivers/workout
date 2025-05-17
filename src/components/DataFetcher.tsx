import React, { useEffect } from 'react';
import supabase from '../utils/supabase';
import type { Database } from '../types/supabase';

type ExerciseWithMuscleGroup = Database['public']['Tables']['exercises']['Row'] & {
  muscle_groups: { name: string }[] | null;
};

type WorkoutSet = Database['public']['Tables']['workout_sets']['Row'] & {
  exercises: ExerciseWithMuscleGroup | null;
};

type Workout = Database['public']['Tables']['workouts']['Row'] & {
  workout_sets: WorkoutSet[];
};

type Exercise = Database['public']['Tables']['exercises']['Row'] & {
  muscle_groups: { name: string }[] | null;
};

type DataFetcherProps = {
  setWorkouts: React.Dispatch<React.SetStateAction<Workout[]>>;
  setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
  userId: string;
  muscleGroups: string[];
};

const DataFetcher: React.FC<DataFetcherProps> = ({ setWorkouts, setExercises, userId, muscleGroups }) => {
  useEffect(() => {
    Promise.all([fetchWorkouts(), fetchExercises(), seedMuscleGroups()]).catch((error) => {
      console.error('Error fetching data:', error);
      alert('Failed to load data.');
    });
  }, [userId]);

  const seedMuscleGroups = async () => {
    try {
      const { data: existingGroups } = await supabase
        .from('muscle_groups')
        .select('name');
      const existingNames = existingGroups?.map((g: { name: string }) => g.name) || [];
      const missingGroups = muscleGroups.filter((g) => !existingNames.includes(g));

      if (missingGroups.length > 0) {
        const { error } = await supabase
          .from('muscle_groups')
          .upsert(
            missingGroups.map((name) => ({ name })),
            { onConflict: 'name' }
          );
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error seeding muscle groups:', error);
      alert('Failed to initialize muscle groups.');
    }
  };

  const fetchWorkouts = async () => {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_sets (
          *,
          exercises (
            name,
            muscle_group_id,
            muscle_groups (name)
          )
        )
      `)
      .eq('user_id', userId);
    if (error) {
      console.error('Error fetching workouts:', error);
      alert('Failed to fetch workouts.');
      return;
    }
    setWorkouts(data as Workout[]);
  };

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        id,
        name,
        muscle_group_id,
        track_type,
        muscle_groups (name)
      `);
    if (error) {
      console.error('Error fetching exercises:', error);
      alert('Failed to fetch exercises.');
      return;
    }
    setExercises(data as Exercise[]);
  };

  return null; // This component doesn't render anything
};

export default DataFetcher;