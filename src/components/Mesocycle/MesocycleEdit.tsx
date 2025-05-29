import { useState, type FormEvent, useEffect, type JSX } from 'react';
import { useNavigate, useParams } from 'react-router';
import { supabase } from '../../utils/supabase';
import { type TablesUpdate } from '../../types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function MesocycleEdit(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      async function fetchMesocycle(): Promise<void> {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user?.id) {
          setError('User not authenticated.');
          return;
        }

        try {
          const { data, error: supabaseError } = await supabase
            .from('mesocycles')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();
          if (supabaseError) {
            setError(supabaseError.message);
            return;
          }
          if (data) {
            setName(data.name);
            setGoal(data.goal);
            setDurationWeeks(data.duration_weeks.toString());
            setStartDate(data.start_date);
          }
        } catch (error) {
          setError('Failed to load mesocycle.');
        }
      }
      fetchMesocycle();
    }
  }, [id]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!id) {
      setError('Invalid mesocycle ID.');
      return;
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user?.id) {
      setError('User not authenticated.');
      return;
    }

    const data: TablesUpdate<'mesocycles'> = {
      name,
      goal,
      duration_weeks: parseInt(durationWeeks),
      start_date: startDate,
      user_id: user.id,
    };

    try {
      const { error: supabaseError } = await supabase
        .from('mesocycles')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);
      if (supabaseError) {
        setError(supabaseError.message);
        return;
      }
      navigate('/mesocycles');
    } catch (error) {
      setError('Failed to update mesocycle.');
    }
  };

  return (
    <div className="max-w-[390px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Mesocycle</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Strength Block 1"
            required
          />
        </div>
        <div>
          <Label htmlFor="goal">Goal</Label>
          <Input
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Build Strength"
            required
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration (Weeks)</Label>
          <Input
            id="duration"
            type="number"
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(e.target.value)}
            min="1"
            required
          />
        </div>
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Update
        </Button>
      </form>
    </div>
  );
}
