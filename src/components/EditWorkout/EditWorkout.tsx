import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { Database } from '../../types/supabase';

type Workout = Database['public']['Tables']['workouts']['Row'] & {
  workout_sets: (Database['public']['Tables']['workout_sets']['Row'] & {
    exercises: Database['public']['Tables']['exercises']['Row'] | null;
  })[];
};

const EditWorkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [date, setDate] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [exercises, setExercises] = useState<string>('');
  const [sets, setSets] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [weight, setWeight] = useState<number>(0);
  const [rpe, setRpe] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchWorkout = async () => {
      const workoutId = parseInt(id || '0');
      if (!workoutId) {
        setError('Invalid workout ID');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_sets (
            *,
            exercises (*)
          )
        `)
        .eq('id', workoutId)
        .single();

      if (error || !data) {
        setError('Workout not found');
        setLoading(false);
        return;
      }

      setDate(data.created_at?.split('T')[0] || '');
      setType(data.workout_sets[0]?.exercises?.name || '');
      setDuration(data.workout_sets[0]?.sets.toString() || '');
      setExercises(data.workout_sets[0]?.exercises?.name || '');
      setSets(data.workout_sets[0]?.sets || 0);
      setReps(data.workout_sets[0]?.reps || 0);
      setWeight(data.workout_sets[0]?.weight || 0);
      setRpe(data.workout_sets[0]?.rpe || 0);
      setLoading(false);
    };

    fetchWorkout();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const workoutId = parseInt(id || '0');
    const updatedWorkout = {
      created_at: date,
      updated_at: new Date().toISOString(),
    };

    const updatedSet = {
      sets: sets,
      reps: reps,
      weight: weight,
      rpe: rpe,
    };

    const { error: workoutError } = await supabase
      .from('workouts')
      .update(updatedWorkout)
      .eq('id', workoutId);

    const { error: setError } = await supabase
      .from('workout_sets')
      .update(updatedSet)
      .eq('workout_id', workoutId);

    if (workoutError || setError) {
      setError('Failed to update workout');
      setSaving(false);
      return;
    }

    setSaving(false);
    navigate('/workouts');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Workout</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded-md w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Type</label>
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border p-2 rounded-md w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Duration</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="border p-2 rounded-md w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Exercises</label>
          <input
            type="text"
            value={exercises}
            onChange={(e) => setExercises(e.target.value)}
            className="border p-2 rounded-md w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Sets</label>
          <input
            type="number"
            value={sets}
            onChange={(e) => setSets(parseInt(e.target.value))}
            className="border p-2 rounded-md w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Reps</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value))}
            className="border p-2 rounded-md w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Weight</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(parseInt(e.target.value))}
            className="border p-2 rounded-md w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">RPE</label>
          <input
            type="number"
            value={rpe}
            onChange={(e) => setRpe(parseInt(e.target.value))}
            className="border p-2 rounded-md w-full"
            required
          />
        </div>
        <div className="space-x-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {saving ? 'Updating...' : 'Update'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/workouts')}
            className="bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditWorkout;
