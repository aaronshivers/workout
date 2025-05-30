import { supabase } from '@/utils/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

export interface Exercise {
  id: string;
  name: string;
  type: 'global' | 'custom';
}

export interface Set {
  id?: string;
  reps: number;
  weight_kg?: number | null;
  rpe?: number | null;
}

export interface ExerciseEntry {
  id?: string;
  exerciseId: string;
  sets: Set[];
}

export interface Feedback {
  joint_pain: 'LOW' | 'MODERATE' | 'A_LOT';
  pump: 'LOW' | 'MODERATE' | 'AMAZING';
  workload: 'EASY' | 'PRETTY_GOOD' | 'PUSHED_LIMITS' | 'TOO_MUCH';
  performance: 1 | 2 | 3 | 4;
}

export class WorkoutService {
  static async fetchWorkoutData(
    workoutId: string,
    userId: string,
  ): Promise<{
    workout: Tables<'workouts'> | null;
    mesocycles: Tables<'mesocycles'>[];
    exercises: Exercise[];
    exerciseEntries: ExerciseEntry[];
  }> {
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .eq('user_id', userId)
      .single();
    if (workoutError) throw workoutError;

    const { data: mesocycles, error: mesoError } = await supabase
      .from('mesocycles')
      .select('*')
      .eq('user_id', userId);
    if (mesoError) throw mesoError;

    const { data: globalExercises, error: geError } = await supabase
      .from('exercises')
      .select('id, name')
      .eq('user_id', null as any);
    if (geError) throw geError;

    const { data: customExercises, error: ceError } = await supabase
      .from('custom_exercises')
      .select('id, name')
      .eq('user_id', userId);
    if (ceError) throw ceError;

    const exercises: Exercise[] = [
      ...(globalExercises || []).map((e) => ({ ...e, type: 'global' as const })),
      ...(customExercises || []).map((e) => ({ ...e, type: 'custom' as const })),
    ];

    const { data: workoutExercises, error: weError } = await supabase
      .from('workout_exercises')
      .select('id, exercise_id, order_index')
      .eq('workout_id', workoutId)
      .eq('user_id', userId)
      .order('order_index', { ascending: true });
    if (weError) throw weError;

    const exerciseEntries: ExerciseEntry[] = [];
    for (const we of workoutExercises) {
      const { data: sets, error: setError } = await supabase
        .from('workout_sets')
        .select('id, reps, weight_kg, rpe')
        .eq('workout_exercise_id', we.id)
        .eq('user_id', userId)
        .order('set_number', { ascending: true });
      if (setError) throw setError;

      if (we.exercise_id) {
      exerciseEntries.push({
        id: we.id,
        exerciseId: we.exercise_id,
        sets: sets || [],
      });
      }
    }

    return { workout, mesocycles: mesocycles || [], exercises, exerciseEntries };
  }

  static async saveWorkout(
    workoutId: string,
    userId: string,
    workoutData: TablesUpdate<'workouts'>,
    exerciseEntries: ExerciseEntry[],
  ): Promise<void> {
    const { error: workoutError } = await supabase
      .from('workouts')
      .update(workoutData)
      .eq('id', workoutId)
      .eq('user_id', userId);
    if (workoutError) throw workoutError;

    const { data: existingExercises, error: weError } = await supabase
      .from('workout_exercises')
      .select('id')
      .eq('workout_id', workoutId)
      .eq('user_id', userId);
    if (weError) throw weError;

    if (existingExercises?.length > 0) {
      const { error: deleteError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', workoutId)
        .eq('user_id', userId);
      if (deleteError) throw deleteError;
    }

    for (let i = 0; i < exerciseEntries.length; i++) {
      const entry = exerciseEntries[i];
      if (!entry.exerciseId) continue;

      const { data: workoutExercise, error: weInsertError } = await supabase
        .from('workout_exercises')
        .insert({
          workout_id: workoutId,
          exercise_id: entry.exerciseId,
          order_index: i,
          user_id: userId,
        })
        .select()
        .single();
      if (weInsertError) throw weInsertError;

      for (let j = 0; j < entry.sets.length; j++) {
        const set = entry.sets[j];
        const { error: setError } = await supabase
          .from('workout_sets')
          .insert({
            workout_exercise_id: workoutExercise.id,
            set_number: j + 1,
            reps: set.reps,
            weight_kg: set.weight_kg ?? null,
            rpe: set.rpe ?? null,
            user_id: userId,
          });
        if (setError) throw setError;
      }
    }
  }

  static async saveFeedback(
    userId: string,
    workoutId: string,
    exerciseId: string,
    feedback: Feedback,
  ): Promise<void> {
    const { data: workoutExercise, error: weError } = await supabase
      .from('workout_exercises')
      .select('id')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('user_id', userId)
      .single();
    if (weError) throw weError;

    const feedbackData: TablesInsert<'feedback'> = {
      user_id: userId,
      workout_exercise_id: workoutExercise.id,
      joint_pain: feedback.joint_pain,
      pump: feedback.pump,
      workload: feedback.workload,
      performance: feedback.performance,
    };

    const { error: feedbackError } = await supabase
      .from('feedback')
      .insert(feedbackData);
    if (feedbackError) throw feedbackError;
  }
}
