import { useState, type FormEvent, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../utils/supabase';
import type { TablesInsert } from '../../types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function MesocycleCreate(): JSX.Element {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    const user = (await supabase.auth.getUser()).data.user;
    if (!user?.id) {
      setError('User not authenticated.');
      return;
    }

    const data: TablesInsert<'mesocycles'> = {
      name,
      goal,
      duration_weeks: parseInt(durationWeeks),
      start_date: startDate,
      user_id: user.id,
    };

    try {
      const { error: supabaseError } = await supabase
        .from('mesocycles')
        .insert(data);
      if (supabaseError) {
        setError(supabaseError.message);
        return;
      }
      navigate('/mesocycles');
    } catch (error) {
      setError('Failed to create mesocycle.');
    }
  };

  return (
    <div className="max-w-[390px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Mesocycle</h1>
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
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full">
          Create
        </Button>
      </form>
    </div>
  );
}
