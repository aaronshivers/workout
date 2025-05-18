import supabase from '../utils/supabase';
import {Database} from '../types/supabase';

type Workout = Database['public']['Tables']['workouts']['Row'] & {
  workout_sets: (Database['public']['Tables']['workout_sets']['Row'] & {
    exercises: Database['public']['Tables']['exercises']['Row'] | null;
  })[];
};

interface FetchWorkoutsResult {
  workouts: Workout[];
  loading: boolean;
  error: string | null;
}

export const fetchWorkouts = async (): Promise<FetchWorkoutsResult> => {
  let loading = true;
  let error = null;
  let workouts: Workout[] = [];

  try {
    const { data, error: fetchError } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_sets (
          *,
          exercises (*)
        )
      `);

    if (fetchError) throw fetchError;

    workouts = (data as unknown) as Workout[];
  } catch (err) {
    error = 'Error fetching workouts';
    console.error(err);
  } finally {
    loading = false;
  }

  return { workouts, loading, error };
};

export default fetchWorkouts;
