import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { supabase } from '@/utils/supabase';
import type { Tables, TablesUpdate } from '@/types/supabase';
import { WorkoutService, type Exercise, type ExerciseEntry, type Feedback } from '@/services/WorkoutService';

export function useWorkoutEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [mesocycleId, setMesocycleId] = useState<string | null>(null);
  const [mesocycles, setMesocycles] = useState<Tables<'mesocycles'>[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false);
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({
    joint_pain: 'LOW',
    pump: 'LOW',
    workload: 'EASY',
    performance: 1,
  });
  const [error, setError] = useState<string | null>(null);

  const MAX_EXERCISES = 12;

  useEffect(() => {
    async function fetchData(): Promise<void> {
      if (!id) {
        setError('Invalid workout ID.');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated.');
        return;
      }

      try {
        const { workout, mesocycles, exercises, exerciseEntries } =
          await WorkoutService.fetchWorkoutData(id, user.id);
        if (workout) {
          setName(workout.name);
          setDate(workout.date);
          setMesocycleId(workout.mesocycle_id || null);
          setMesocycles(mesocycles || []);
          setExercises(exercises || []);
          setExerciseEntries(exerciseEntries || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data.');
      }
    }
    fetchData();
  }, [id]);

  const addExercise = (): void => {
    if (exerciseEntries.length >= MAX_EXERCISES) {
      setError('Cannot exceed maximum of 12 exercises per workout.');
      return;
    }
    setExerciseEntries([...exerciseEntries, ...[{ exerciseId: '', sets: [{ reps: 0 }]}]]);
  };

  const updateExercise = (index: number, exerciseId: string): void => {
    const newEntries = [...exerciseEntries];
    newEntries[index] = { ...newEntries[index], exerciseId };
    setExerciseEntries(newEntries);
  };

  const addSet = (exerciseIndex: number): void => {
    const newEntries = [...exerciseEntries];
    newEntries[exerciseIndex].sets.push({ reps: 0 });
    setExerciseEntries(newEntries);
  };

  const updateSet = (
    index: number,
    setIndex: number,
    field: 'reps' | 'weight_kg' | 'rpe',
    value: number,
  ): void => {
    const newEntries = [...exerciseEntries];
    newEntries[index].sets[setIndex] = {
      ...newEntries[index].sets[setIndex],
      [field]: value,
    };
    setExerciseEntries(newEntries);
  };

  const handleSaveSets = (exerciseIndex: number): void => {
    setCurrentExerciseId(exerciseEntries[exerciseIndex].exerciseId);
    setCurrentExerciseIndex(exerciseIndex);
    setFeedbackOpen(true);
  };

  const handleSaveFeedback = async (): Promise<void> => {
    if (!id || !currentExerciseId || currentExerciseIndex === null) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      setError('User not authenticated.');
      return;
    }

    try {
      await WorkoutService.saveFeedback(user.id, id, currentExerciseId, feedback);
      setFeedbackOpen(false);
      setFeedback({
        joint_pain: 'LOW',
        pump: 'LOW',
        workload: 'EASY',
        performance: 1,
      });
      setCurrentExerciseId(null);
      setCurrentExerciseIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save feedback.');
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!id) {
      setError('Invalid workout ID.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      setError('User not authenticated.');
      return;
    }

    if (exerciseEntries.length > MAX_EXERCISES) {
      setError('Cannot exceed 12 exercises per workout.');
      return;
    }

    const workoutData: TablesUpdate<'workouts'> = {
      name,
      date,
      mesocycle_id: mesocycleId || null,
      user_id: user.id,
    };

    try {
      await WorkoutService.saveWorkout(id, user.id, workoutData, exerciseEntries);
      navigate('/workouts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workout.');
    }
  };

  // RP Set Progression Logic
  const getNextWorkoutSuggestion = (entry: ExerciseEntry): { weight_kg?: number; reps?: number } => {
    const lastSet = entry.sets[entry.sets.length - 1];
    if (!lastSet?.weight_kg || !feedback.performance) return {};

    let weightAdjustment = 0;
    let repsAdjustment = 0;

    if (feedback.performance === 1) {
      // Exceeded targets: increase weight
      weightAdjustment = lastSet.weight_kg * 0.05; // +5%
    } else if (feedback.performance === 3 || feedback.performance === 4) {
      // Below targets: decrease weight or reps
      weightAdjustment = -lastSet.weight_kg * 0.05; // -5%
      repsAdjustment = -1;
    }

    return {
      weight_kg: lastSet.weight_kg + weightAdjustment,
      reps: (lastSet.reps || 0) + repsAdjustment,
    };
  };

  return {
    name,
    setName,
    date,
    setDate,
    mesocycleId,
    setMesocycleId,
    mesocycles,
    exercises,
    exerciseEntries,
    feedbackOpen,
    setFeedbackOpen,
    feedback,
    setFeedback,
    error,
    addExercise,
    updateExercise,
    addSet,
    updateSet,
    handleSaveSets,
    handleSaveFeedback,
    handleSubmit,
    getNextWorkoutSuggestion,
  };
}
