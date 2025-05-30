import { useEffect, useState, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../../utils/supabase';
import { type Tables } from '../../types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MesocycleDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mesocycle, setMesocycle] = useState<Tables<'mesocycles'> | null>(null);
  const [workouts, setWorkouts] = useState<Tables<'workouts'>[]>([]);
  const [exercises, setExercises] = useState<
    Array<{ id: string; name: string; type: 'global' | 'custom' }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData(): Promise<void> {
      if (!id) {
        setError('Invalid mesocycle ID.');
        return;
      }

      const user = (await supabase.auth.getUser()).data.user;
      if (!user?.id) {
        setError('User not authenticated.');
        return;
      }

      try {
        // Fetch mesocycle
        const { data: mesocycleData, error: mesocycleError } = await supabase
          .from('mesocycles')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        if (mesocycleError) {
          setError(mesocycleError.message);
          return;
        }
        setMesocycle(mesocycleData);

        // Fetch associated workouts
        const { data: workoutsData, error: workoutsError } = await supabase
          .from('workouts')
          .select('*')
          .eq('mesocycle_id', id)
          .eq('user_id', user.id)
          .order('date', { ascending: true });
        if (workoutsError) {
          setError(workoutsError.message);
          return;
        }
        setWorkouts(workoutsData || []);

        // Fetch exercises
        const { data: globalExercises, error: geError } = await supabase
          .from('exercises')
          .select('id, name')
          .in('id', mesocycleData.exercise_ids)
          .eq('user_id', user.id);
        if (geError) {
          setError(geError.message);
          return;
        }

        const { data: customExercises, error: ceError } = await supabase
          .from('custom_exercises')
          .select('id, name')
          .in('id', mesocycleData.exercise_ids)
          .eq('user_id', user.id);
        if (ceError) {
          setError(ceError.message);
          return;
        }

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
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load mesocycle data.',
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

  if (!mesocycle) {
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
          <CardTitle>{mesocycle.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Goal:</strong> {mesocycle.goal}
          </p>
          <p>
            <strong>Duration:</strong> {mesocycle.duration_weeks} weeks
          </p>
          <p>
            <strong>Start Date:</strong>{' '}
            {new Date(mesocycle.start_date).toLocaleDateString()}
          </p>
          <p>
            <strong>Workout Days:</strong> {mesocycle.workout_days.join(', ')}
          </p>
          <h2 className="text-xl font-semibold mt-4 mb-2">Exercises</h2>
          {exercises.length === 0 ? (
            <p>No exercises selected.</p>
          ) : (
            <ul className="space-y-2">
              {exercises.map((exercise) => (
                <li key={exercise.id}>
                  {exercise.name} ({exercise.type})
                </li>
              ))}
            </ul>
          )}
          <h2 className="text-xl font-semibold mt-4 mb-2">Workouts</h2>
          {workouts.length === 0 ? (
            <p>No workouts in this mesocycle.</p>
          ) : (
            <ul className="space-y-2">
              {workouts.map((workout) => (
                <li key={workout.id}>
                  <Button
                    variant="link"
                    onClick={() => navigate(`/workouts/${workout.id}`)}
                    className="p-0 text-left"
                  >
                    {workout.name} (
                    {new Date(workout.date).toLocaleDateString()})
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button
            onClick={() =>
              navigate('/workout/create', { state: { mesocycleId: id } })
            }
            className="w-full mt-4"
          >
            Create Workout
          </Button>
          <div className="flex space-x-2 mt-4">
            <Button
              onClick={() => navigate(`/mesocycles/${mesocycle.id}/edit`)}
              variant="outline"
            >
              Edit
            </Button>
            <Button onClick={() => navigate('/mesocycles')} variant="secondary">
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
