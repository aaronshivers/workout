import { useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../utils/supabase';
import type { Tables } from '../../types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MesocycleList(): JSX.Element {
  const navigate = useNavigate();
  const [mesocycles, setMesocycles] = useState<Tables<'mesocycles'>[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMesocycles(): Promise<void> {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user?.id) {
        setError('User not authenticated.');
        return;
      }

      try {
        const { data, error: supabaseError } = await supabase
          .from('mesocycles')
          .select('*')
          .eq('user_id', user.id);
        if (supabaseError) {
          setError(supabaseError.message);
          return;
        }
        setMesocycles(data || []);
      } catch (error) {
        setError('Failed to load mesocycles.');
      }
    }
    fetchMesocycles();
  }, []);

  const handleDelete = async (id: string): Promise<void> => {
    try {
      const { error: supabaseError } = await supabase
        .from('mesocycles')
        .delete()
        .eq('id', id);
      if (supabaseError) {
        setError(supabaseError.message);
        return;
      }
      setMesocycles(mesocycles.filter((m) => m.id !== id));
    } catch (error) {
      setError('Failed to delete mesocycle.');
    }
  };

  return (
    <div className="max-w-[390px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mesocycles</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {mesocycles.length === 0 && !error && <p>No mesocycles found.</p>}
      <div className="space-y-4">
        {mesocycles.map((mesocycle) => (
          <Card key={mesocycle.id}>
            <CardHeader>
              <CardTitle>{mesocycle.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Goal: {mesocycle.goal}</p>
              <p>Duration: {mesocycle.duration_weeks} weeks</p>
              <p>
                Start: {new Date(mesocycle.start_date).toLocaleDateString()}
              </p>
              <div className="flex space-x-2 mt-2">
                <Button
                  onClick={() => navigate(`/mesocycles/${mesocycle.id}`)}
                  variant="outline"
                >
                  View
                </Button>
                <Button
                  onClick={() => navigate(`/mesocycles/${mesocycle.id}/edit`)}
                  variant="outline"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(mesocycle.id)}
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
        onClick={() => navigate('/mesocycles/create')}
        className="w-full mt-4"
      >
        Create New Mesocycle
      </Button>
    </div>
  );
}
