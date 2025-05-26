import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabase';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '../../types/supabase';

type Exercise = Database['public']['Tables']['exercises']['Row'];
type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];
type WorkoutExerciseInsert =
  Database['public']['Tables']['workout_exercises']['Insert'];
type WorkoutSetInsert = Database['public']['Tables']['workout_sets']['Insert'];

interface WorkoutExercise {
  exercise_id: string;
  sets: {
    set_number: number;
    reps: number;
    weight_kg?: number;
    rpe?: number;
  }[];
}

interface Workout {
  name: string;
  exercises: WorkoutExercise[];
}

interface FormData {
  mesocycle_name: string;
  start_date: string;
  duration_weeks: number;
  workouts: Workout[];
}

export const CreateWorkout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    mesocycle_name: '',
    start_date: new Date().toISOString().split('T')[0],
    duration_weeks: 4,
    workouts: [{ name: 'Day 1', exercises: [] }],
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchExercises = async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, muscle_group, created_at, notes, user_id')
        .eq('user_id', user.id);
      if (error) {
        setError('Failed to fetch exercises: ' + error.message);
        console.error('Fetch exercises error:', error);
      } else {
        setExercises(data || []);
        if (!data?.length) {
          setError('No exercises found. Please add exercises first.');
        }
      }
    };
    fetchExercises();
  }, [user]);

  const addWorkout = () => {
    setFormData({
      ...formData,
      workouts: [
        ...formData.workouts,
        { name: `Day ${formData.workouts.length + 1}`, exercises: [] },
      ],
    });
  };

  const addExercise = (workoutIndex: number) => {
    const updatedWorkouts = [...formData.workouts];
    updatedWorkouts[workoutIndex].exercises.push({
      exercise_id: exercises[0]?.id || '',
      sets: [{ set_number: 1, reps: 8, weight_kg: 0, rpe: 8 }],
    });
    setFormData({ ...formData, workouts: updatedWorkouts });
  };

  const addSet = (workoutIndex: number, exerciseIndex: number) => {
    const updatedWorkouts = [...formData.workouts];
    const sets = updatedWorkouts[workoutIndex].exercises[exerciseIndex].sets;
    updatedWorkouts[workoutIndex].exercises[exerciseIndex].sets = [
      ...sets,
      { set_number: sets.length + 1, reps: 8, weight_kg: 0, rpe: 8 },
    ];
    setFormData({ ...formData, workouts: updatedWorkouts });
  };

  const updateExercise = (
    workoutIndex: number,
    exerciseIndex: number,
    field: keyof WorkoutExercise,
    value: string,
  ) => {
    const updatedWorkouts = [...formData.workouts];
    updatedWorkouts[workoutIndex].exercises[exerciseIndex] = {
      ...updatedWorkouts[workoutIndex].exercises[exerciseIndex],
      [field]: value,
    };
    setFormData({ ...formData, workouts: updatedWorkouts });
  };

  const updateSet = (
    workoutIndex: number,
    exerciseIndex: number,
    setIndex: number,
    field: keyof WorkoutExercise['sets'][0],
    value: number,
  ) => {
    const updatedWorkouts = [...formData.workouts];
    updatedWorkouts[workoutIndex].exercises[exerciseIndex].sets[setIndex] = {
      ...updatedWorkouts[workoutIndex].exercises[exerciseIndex].sets[setIndex],
      [field]: value,
    };
    setFormData({ ...formData, workouts: updatedWorkouts });
  };

  const removeWorkout = (workoutIndex: number) => {
    setFormData({
      ...formData,
      workouts: formData.workouts.filter((_, i) => i !== workoutIndex),
    });
  };

  const removeExercise = (workoutIndex: number, exerciseIndex: number) => {
    const updatedWorkouts = [...formData.workouts];
    updatedWorkouts[workoutIndex].exercises = updatedWorkouts[
      workoutIndex
    ].exercises.filter((_, i) => i !== exerciseIndex);
    setFormData({ ...formData, workouts: updatedWorkouts });
  };

  const removeSet = (
    workoutIndex: number,
    exerciseIndex: number,
    setIndex: number,
  ) => {
    const updatedWorkouts = [...formData.workouts];
    updatedWorkouts[workoutIndex].exercises[exerciseIndex].sets =
      updatedWorkouts[workoutIndex].exercises[exerciseIndex].sets.filter(
        (_, i) => i !== setIndex,
      );
    setFormData({ ...formData, workouts: updatedWorkouts });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('User not authenticated.', {
        style: { background: 'red', color: 'white' },
      });
      return;
    }
    if (!formData.mesocycle_name.trim()) {
      toast('Mesocycle name is required.', {
        style: { background: 'red', color: 'white' },
      });
      return;
    }
    if (formData.workouts.some((w) => !w.name.trim())) {
      toast('All workouts must have a name.', {
        style: { background: 'red', color: 'white' },
      });
      return;
    }
    if (formData.workouts.some((w) => w.exercises.length === 0)) {
      toast('Each workout must have at least one exercise.', {
        style: { background: 'red', color: 'white' },
      });
      return;
    }
    if (
      formData.workouts.some((w) => w.exercises.some((e) => !e.exercise_id))
    ) {
      toast('All exercises must be selected.', {
        style: { background: 'red', color: 'white' },
      });
      return;
    }
    if (
      formData.workouts.some((w) =>
        w.exercises.some((e) => e.sets.length === 0),
      )
    ) {
      toast('Each exercise must have at least one set.', {
        style: { background: 'red', color: 'white' },
      });
      return;
    }
    if (
      !exercises.some((ex) =>
        formData.workouts.some((w) =>
          w.exercises.some((e) => e.exercise_id === ex.id),
        ),
      )
    ) {
      toast('Selected exercises must exist in your exercises.', {
        style: { background: 'red', color: 'white' },
      });
      return;
    }

    setLoading(true);
    try {
      for (const workout of formData.workouts) {
        const workoutInsert: WorkoutInsert = {
          user_id: user.id,
          name: workout.name,
          date: new Date().toISOString().split('T')[0],
          mesocycle_name: formData.mesocycle_name,
          start_date: formData.start_date,
          duration_weeks: formData.duration_weeks,
        };
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .insert(workoutInsert)
          .select('id')
          .single();
        if (workoutError) {
          throw new Error(`Failed to insert workout: ${workoutError.message}`);
        }

        const workoutId = workoutData.id;

        for (const [exerciseIndex, exercise] of workout.exercises.entries()) {
          const exerciseInsert: WorkoutExerciseInsert = {
            workout_id: workoutId,
            exercise_id: exercise.exercise_id,
            user_id: user.id,
            order_index: exerciseIndex,
          };
          const { data: exerciseData, error: exerciseError } = await supabase
            .from('workout_exercises')
            .insert(exerciseInsert)
            .select('id')
            .single();
          if (exerciseError) {
            throw new Error(
              `Failed to insert workout exercise: ${exerciseError.message}`,
            );
          }

          const workoutExerciseId = exerciseData.id;

          for (const set of exercise.sets) {
            const setInsert: WorkoutSetInsert = {
              workout_exercise_id: workoutExerciseId,
              user_id: user.id,
              set_number: set.set_number,
              reps: set.reps,
              weight_kg: set.weight_kg || null,
              rpe: set.rpe || null,
            };
            const { error: setError } = await supabase
              .from('workout_sets')
              .insert(setInsert);
            if (setError) {
              throw new Error(
                `Failed to insert workout set: ${setError.message}`,
              );
            }
          }
        }
      }

      toast('Mesocycle saved successfully!');
      navigate('/history');
    } catch (err: any) {
      toast(err.message || 'Failed to save mesocycle.', {
        style: { background: 'red', color: 'white' },
      });
      console.error('Save mesocycle error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!exercises.length && !error) {
    return (
      <Card className="w-full max-w-full sm:max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Plan a New Mesocycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center">
            No exercises found. Please add exercises in Custom Exercises before
            creating a mesocycle.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-full sm:max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Plan a New Mesocycle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-destructive text-sm">{error}</div>}
          <div className="space-y-4">
            <div>
              <Label htmlFor="mesocycle_name">Mesocycle Name</Label>
              <Input
                id="mesocycle_name"
                value={formData.mesocycle_name}
                onChange={(e) =>
                  setFormData({ ...formData, mesocycle_name: e.target.value })
                }
                placeholder="e.g., Hypertrophy Block"
                required
              />
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="duration_weeks">Duration (Weeks)</Label>
              <Input
                id="duration_weeks"
                type="number"
                min="1"
                value={formData.duration_weeks}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_weeks: parseInt(e.target.value) || 1,
                  })
                }
                required
              />
            </div>
          </div>

          {formData.workouts.map((workout, workoutIndex) => (
            <div key={workoutIndex} className="border p-4 rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <Input
                  value={workout.name}
                  onChange={(e) => {
                    const updatedWorkouts = [...formData.workouts];
                    updatedWorkouts[workoutIndex].name = e.target.value;
                    setFormData({ ...formData, workouts: updatedWorkouts });
                  }}
                  placeholder="e.g., Push Day"
                  className="w-1/2"
                  required
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeWorkout(workoutIndex)}
                  aria-label={`Remove ${workout.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => addExercise(workoutIndex)}
                className="w-full"
                disabled={!exercises.length}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Exercise
              </Button>
              {workout.exercises.map((exercise, exerciseIndex) => (
                <div
                  key={exerciseIndex}
                  className="border p-4 rounded-md space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <Select
                      value={exercise.exercise_id}
                      onValueChange={(value) =>
                        updateExercise(
                          workoutIndex,
                          exerciseIndex,
                          'exercise_id',
                          value,
                        )
                      }
                    >
                      <SelectTrigger className="w-3/4">
                        <SelectValue placeholder="Select an exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {exercises.map((ex) => (
                          <SelectItem key={ex.id} value={ex.id}>
                            {ex.name}{' '}
                            {ex.muscle_group ? `(${ex.muscle_group})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() =>
                        removeExercise(workoutIndex, exerciseIndex)
                      }
                      aria-label="Remove exercise"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addSet(workoutIndex, exerciseIndex)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Set
                  </Button>
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex gap-2 items-end">
                      <div>
                        <Label
                          htmlFor={`set-${workoutIndex}-${exerciseIndex}-${setIndex}`}
                        >
                          Set {set.set_number}
                        </Label>
                        <Input
                          id={`set-${workoutIndex}-${exerciseIndex}-${setIndex}`}
                          type="number"
                          min="1"
                          value={set.reps}
                          onChange={(e) =>
                            updateSet(
                              workoutIndex,
                              exerciseIndex,
                              setIndex,
                              'reps',
                              parseInt(e.target.value) || 1,
                            )
                          }
                          placeholder="Reps"
                          className="w-24"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor={`weight-${workoutIndex}-${exerciseIndex}-${setIndex}`}
                        >
                          Weight (kg)
                        </Label>
                        <Input
                          id={`weight-${workoutIndex}-${exerciseIndex}-${setIndex}`}
                          type="number"
                          min="0"
                          value={set.weight_kg || ''}
                          onChange={(e) =>
                            updateSet(
                              workoutIndex,
                              exerciseIndex,
                              setIndex,
                              'weight_kg',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="Weight"
                          className="w-24"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor={`rpe-${workoutIndex}-${exerciseIndex}-${setIndex}`}
                        >
                          RPE
                        </Label>
                        <Input
                          id={`rpe-${workoutIndex}-${exerciseIndex}-${setIndex}`}
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={set.rpe || ''}
                          onChange={(e) =>
                            updateSet(
                              workoutIndex,
                              exerciseIndex,
                              setIndex,
                              'rpe',
                              parseFloat(e.target.value) || 8,
                            )
                          }
                          placeholder="RPE"
                          className="w-24"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() =>
                          removeSet(workoutIndex, exerciseIndex, setIndex)
                        }
                        aria-label="Remove set"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addWorkout}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Workout
          </Button>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/history')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !exercises.length}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save Mesocycle'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateWorkout;
