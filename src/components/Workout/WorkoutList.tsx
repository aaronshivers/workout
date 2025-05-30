import { useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../utils/supabase';
import { type Tables } from '../../types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function WorkoutList(): JSX.Element {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Tables<'workouts'>[]>([]);
  const [mesocycles, setMesocycles] = useState<Tables<'mesocycles'>[]>([]);
  const [selectedMesocycle, setSelectedMesocycle] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData(): Promise<void> {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user?.id) {
        setError('User not authenticated.');
        return;
      }

      try {
        // Fetch mesocycles
        const { data: mesocycleData, error: mesocycleError } = await supabase
          .from('mesocycles')
          .select('*')
          .eq('user_id', user.id);
        if (mesocycleError) {
          setError(mesocycleError.message);
          return;
        }
        setMesocycles(mesocycleData || []);

        // Fetch workouts
        let query = supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        if (selectedMesocycle) {
          query = query.eq('mesocycle_id', selectedMesocycle);
        }
        const { data: workoutData, error: workoutError } = await query;
        if (workoutError) {
          setError(workoutError.message);
          return;
        }
        setWorkouts(workoutData || []);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to load data.',
        );
      }
    }
    fetchData();
  }, [selectedMesocycle]);

  const handleDelete = async (id: string): Promise<void> => {
    try {
      const { error: supabaseError } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);
      if (supabaseError) {
        setError(supabaseError.message);
        return;
      }
      setWorkouts(workouts.filter((w) => w.id !== id));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to delete workout.',
      );
    }
  };

  return (
    <div className="max-w-[390px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Workouts</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Select
        onValueChange={setSelectedMesocycle}
        value={selectedMesocycle || ''}
      >
        <SelectTrigger className="mb-4">
          <SelectValue placeholder="Filter by Mesocycle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Mesocycles</SelectItem>
          {mesocycles.map((mesocycle) => (
            <SelectItem key={mesocycle.id} value={mesocycle.id}>
              {mesocycle.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {workouts.length === 0 && !error && <p>No workouts found.</p>}
      <div className="space-y-4">
        {workouts.map((workout) => (
          <Card key={workout.id}>
            <CardHeader>
              <CardTitle>{workout.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Date: {new Date(workout.date).toLocaleDateString()}</p>
              <p>
                Mesocycle:{' '}
                {mesocycles.find((m) => m.id === workout.mesocycle_id)?.name ||
                  'None'}
              </p>
              <div className="flex space-x-2 mt-2">
                <Button
                  onClick={() => navigate(`/workouts/${workout.id}`)}
                  variant="outline"
                >
                  View
                </Button>
                <Button
                  onClick={() => navigate(`/workouts/${workout.id}/edit`)}
                  variant="outline"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(workout.id)}
                  variant="destructive"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        onClick={() => navigate('/workout/create')}
        className="w-full mt-4"
      >
        Create New Workout
      </Button>
    </div>
  );
}
