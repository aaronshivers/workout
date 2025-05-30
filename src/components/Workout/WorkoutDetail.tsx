import { useEffect, useState, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../../utils/supabase';
import type { Tables } from '../../types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkoutExerciseWithSets extends Tables<'workout_exercises'> {
  exercise: Tables<'exercises'>;
  sets: Tables<'workout_sets'>[];
}

export function WorkoutDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Tables<'workouts'> | null>(null);
  const [mesocycle, setMesocycle] = useState<Tables<'mesocycles'> | null>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseWithSets[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData(): Promise<void> {
      if (!id) {
        setError('Invalid workout ID.');
        return;
      }

      const user = (await supabase.auth.getUser()).data.user;
      if (!user?.id) {
        setError('User not authenticated.');
        return;
      }

      try {
        // Fetch workout
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        if (workoutError) {
          setError(workoutError.message);
          return;
        }
        setWorkout(workoutData);

        // Fetch mesocycle
        if (workoutData.mesocycle_id) {
          const { data: mesocycleData, error: mesocycleError } = await supabase
            .from('mesocycles')
            .select('*')
            .eq('id', workoutData.mesocycle_id)
            .eq('user_id', user.id)
            .single();
          if (mesocycleError) {
            setError(mesocycleError.message);
            return;
          }
          setMesocycle(mesocycleData);
        }

        // Fetch exercises and sets
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('workout_exercises')
          .select(
            `
            *,
            exercise:exercises(*),
            sets:workout_sets(*)
          `,
          )
          .eq('workout_id', id)
          .eq('user_id', user.id)
          .order('order_index');
        if (exerciseError) {
          setError(exerciseError.message);
          return;
        }
        setExercises(exerciseData as WorkoutExerciseWithSets[]);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load workout data.',
        );
      }
    }
    fetchData();
  }, [id]);

  if (error) {
    return (
      <div className="max-w-[390px] mx-auto p-4">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="max-w-[390px] mx-auto p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[390px] mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{workout.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Date:</strong> {new Date(workout.date).toLocaleDateString()}
          </p>
          <p>
            <strong>Mesocycle:</strong> {mesocycle?.name || 'None'}
          </p>
          <h2 className="text-xl font-semibold mt-4 mb-2">Exercises</h2>
          {exercises.length === 0 ? (
            <p>No exercises in this workout.</p>
          ) : (
            exercises.map((exercise) => (
              <Card key={exercise.id} className="mb-4">
                <CardHeader>
                  <CardTitle>{exercise.exercise.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {exercise.sets.length === 0 ? (
                    <p>No sets recorded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {exercise.sets.map((set) => (
                        <li key={set.id}>
                          Set {set.set_number}: {set.reps} reps
                          {set.weight_kg ? ` @ ${set.weight_kg} kg` : ''}
                          {set.rpe ? `, RPE ${set.rpe}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))
          )}
          <div className="flex space-x-2 mt-4">
            <Button
              onClick={() => navigate(`/workouts/${workout.id}/edit`)}
              variant="outline"
            >
              Edit
            </Button>
            <Button onClick={() => navigate('/workouts')} variant="secondary">
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
