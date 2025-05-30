import { useState, useEffect, type FormEvent, type JSX } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { supabase } from '@/utils/supabase';
import type { Tables, TablesInsert } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FeedbackDialog } from './FeedbackDialog';
import type { Feedback } from '@/services/WorkoutService';

interface ExerciseEntry {
  exerciseId: string;
  sets: { id?: string; reps: number; weight_kg?: number; rpe?: number }[];
}

export function WorkoutCreate(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedMesocycleId = (location.state as { mesocycleId?: string })
    ?.mesocycleId;
  const [name, setName] = useState<string>('');
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [mesocycle, setMesocycle] = useState<Tables<'mesocycles'> | null>(null);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([]);
  const [exercises, setExercises] = useState<
    Array<{ id: string; name: string; type: 'global' | 'custom' }>
  >([]);
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false);
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(
    null,
  );
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<
    number | null
  >(null);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated.');
        return;
      }

      try {
        if (preselectedMesocycleId) {
          const { data: mesoData, error: mesoError } = await supabase
            .from('mesocycles')
            .select('*')
            .eq('id', preselectedMesocycleId)
            .eq('user_id', user.id)
            .single();
          if (mesoError) throw mesoError;
          setMesocycle(mesoData);

          const initialEntries = mesoData.exercise_ids.map((id: string) => ({
            exerciseId: id,
            sets: [{ reps: 0 }],
          }));
          setExerciseEntries(initialEntries);
        }

        const { data: globalExercises, error: geError } = await supabase
          .from('exercises')
          .select('id, name')
          .is('user_id', null);
        if (geError) throw geError;

        const { data: customExercises, error: ceError } = await supabase
          .from('custom_exercises')
          .select('id, name')
          .eq('user_id', user.id);
        if (ceError) throw ceError;

        setExercises([
          ...(globalExercises || []).map((e) => ({
            ...e,
            type: 'global' as const,
          })),
          ...(customExercises || []).map((e) => ({
            ...e,
            type: 'custom' as const,
          })),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data.');
      }
    }
    fetchData();
  }, [preselectedMesocycleId]);

  const addExercise = (): void => {
    if (exerciseEntries.length >= MAX_EXERCISES) {
      setError('Cannot exceed 12 exercises per workout.');
      return;
    }
    setExerciseEntries([
      ...exerciseEntries,
      { exerciseId: '', sets: [{ reps: 0 }] },
    ]);
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

  const handleSaveSets = async (exerciseIndex: number): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      setError('User not authenticated.');
      return;
    }

    try {
      // Create workout if not already created
      let currentWorkoutId = workoutId;
      if (!currentWorkoutId) {
        const workoutData: TablesInsert<'workouts'> = {
          name: name || 'Unnamed Workout',
          date,
          mesocycle_id: mesocycle?.id || null,
          user_id: user.id,
        };
        const { data: workout, error: workoutError } = await supabase
          .from('workouts')
          .insert(workoutData)
          .select()
          .single();
        if (workoutError) throw workoutError;
        currentWorkoutId = workout.id;
        setWorkoutId(currentWorkoutId);
      }

      const entry = exerciseEntries[exerciseIndex];
      if (!entry.exerciseId) {
        setError('Please select an exercise.');
        return;
      }

      // Insert workout exercise
      const workoutExerciseData: TablesInsert<'workout_exercises'> = {
        workout_id: currentWorkoutId,
        exercise_id: entry.exerciseId,
        order_index: exerciseIndex,
        user_id: user.id,
      };
      const { data: workoutExercise, error: weError } = await supabase
        .from('workout_exercises')
        .insert(workoutExerciseData)
        .select()
        .single();
      if (weError) throw weError;

      // Insert sets
      for (let j = 0; j < entry.sets.length; j++) {
        const set = entry.sets[j];
        const setData: TablesInsert<'workout_sets'> = {
          workout_exercise_id: workoutExercise.id,
          set_number: j + 1,
          reps: set.reps,
          weight_kg: set.weight_kg || null,
          rpe: set.rpe || null,
          user_id: user.id,
        };
        const { error: setError } = await supabase
          .from('workout_sets')
          .insert(setData);
        if (setError) throw setError;
      }

      setCurrentExerciseId(entry.exerciseId);
      setCurrentExerciseIndex(exerciseIndex);
      setFeedbackOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exercise.');
    }
  };

  const handleSaveFeedback = async (): Promise<void> => {
    if (!currentExerciseId || currentExerciseIndex === null || !workoutId)
      return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      setError('User not authenticated.');
      return;
    }

    try {
      const { data: weData, error: weError } = await supabase
        .from('workout_exercises')
        .select('id')
        .eq('exercise_id', currentExerciseId)
        .eq('workout_id', workoutId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (weError) throw weError;

      const feedbackData: TablesInsert<'feedback'> = {
        user_id: user.id,
        workout_exercise_id: weData.id,
        joint_pain: feedback.joint_pain,
        pump: feedback.pump,
        workload: feedback.workload,
        performance: feedback.performance,
      };

      const { error: feedbackError } = await supabase
        .from('feedback')
        .insert(feedbackData);
      if (feedbackError) throw feedbackError;

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

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      setError('User not authenticated.');
      return;
    }

    if (exerciseEntries.length > MAX_EXERCISES) {
      setError('Cannot exceed 12 exercises per workout.');
      return;
    }

    if (!workoutId) {
      setError('Please save at least one exercise before submitting.');
      return;
    }

    try {
      // Update workout details if needed
      const workoutData: TablesInsert<'workouts'> = {
        name,
        date,
        mesocycle_id: mesocycle?.id || null,
        user_id: user.id,
      };
      const { error: workoutError } = await supabase
        .from('workouts')
        .update(workoutData)
        .eq('id', workoutId)
        .eq('user_id', user.id);
      if (workoutError) throw workoutError;

      navigate('/workouts');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update workout.',
      );
    }
  };

  return (
    <div className="max-w-[390px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Workout</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Week 1 Day 1"
            required
          />
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <h2 className="text-xl font-semibold mt-4">Exercises</h2>
        {exerciseEntries.map((entry, exerciseIndex) => (
          <Card key={exerciseIndex} className="mb-4">
            <CardHeader>
              <CardTitle>
                {exercises.find((e) => e.id === entry.exerciseId)?.name ||
                  'Select Exercise'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <Label htmlFor={`exercise-${exerciseIndex}`}>Exercise</Label>
                <Select
                  onValueChange={(value) =>
                    updateExercise(exerciseIndex, value)
                  }
                  value={entry.exerciseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name} ({exercise.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {entry.sets.map((set, setIndex) => (
                <div key={setIndex} className="space-y-2 mb-2">
                  <Label>Set {setIndex + 1}</Label>
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={set.reps}
                    onChange={(e) =>
                      updateSet(
                        exerciseIndex,
                        setIndex,
                        'reps',
                        parseInt(e.target.value, 10),
                      )
                    }
                    min="0"
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Weight (kg)"
                    value={set.weight_kg || ''}
                    onChange={(e) =>
                      updateSet(
                        exerciseIndex,
                        setIndex,
                        'weight_kg',
                        parseFloat(e.target.value),
                      )
                    }
                    min="0"
                    step="0.1"
                  />
                  <Input
                    type="number"
                    placeholder="RPE"
                    value={set.rpe || ''}
                    onChange={(e) =>
                      updateSet(
                        exerciseIndex,
                        setIndex,
                        'rpe',
                        parseFloat(e.target.value),
                      )
                    }
                    min="0"
                    max="10"
                    step="0.5"
                  />
                </div>
              ))}
              <Button
                type="button"
                onClick={() => addSet(exerciseIndex)}
                variant="outline"
                className="w-full mb-2"
              >
                Add Set
              </Button>
              <Button
                type="button"
                onClick={() => handleSaveSets(exerciseIndex)}
                className="w-full"
              >
                Save Exercise
              </Button>
            </CardContent>
          </Card>
        ))}
        <Button type="button" onClick={addExercise} className="w-full">
          Add Exercise
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full">
          Create
        </Button>
      </form>
      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        feedback={feedback}
        setFeedback={setFeedback}
        onSave={handleSaveFeedback}
      />
    </div>
  );
}
