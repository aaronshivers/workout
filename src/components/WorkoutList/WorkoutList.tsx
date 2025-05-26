import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../utils/supabase';
import { Workout, Set, Exercise } from '../../types/supabase';

const WorkoutList: React.FC = () => {
  const [workouts, setWorkouts] = useState<
    (Workout & { sets: (Set & { exercises: Exercise | null })[] })[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchWorkouts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('workouts').select(`
        *,
        sets (
          *,
          exercises (*)
        )
      `);
    if (error) {
      setError('Failed to fetch workouts');
      console.error(error);
    } else {
      setWorkouts(data || []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this workout?'))
      return;
    setDeleting(id);
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) {
      setError('Failed to delete workout');
      console.error(error);
    } else {
      await fetchWorkouts();
    }
    setDeleting(null);
  };

  const handleEdit = (id: string) => {
    navigate(`/edit-workout/${id}`);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Workout List</h1>
      <button
        onClick={() => navigate('/create-workout')}
        className="mb-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
      >
        Create New Workout
      </button>
      {workouts.length === 0 ? (
        <p className="text-gray-600">No workouts found.</p>
      ) : (
        <ul className="space-y-4">
          {workouts.map((workout) => (
            <li key={workout.id} className="border p-4 rounded-md shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p>
                    <strong>Date:</strong> {workout.date}
                    {workout.name && ` | ${workout.name}`}
                  </p>
                  <p>
                    <strong>Exercises:</strong>{' '}
                    {workout.sets
                      .map((set) => set.exercises?.name)
                      .filter((name) => name)
                      .join(', ') || 'None'}
                  </p>
                  {workout.sets.length > 0 && (
                    <div className="mt-2">
                      <strong>Sets:</strong>
                      <ul className="ml-4 list-disc">
                        {workout.sets.map((set) => (
                          <li key={set.id}>
                            {set.exercises?.name || 'Unknown'}: Set{' '}
                            {set.set_number}, {set.reps} reps
                            {set.weight ? `, ${set.weight} lbs` : ''}, RPE{' '}
                            {set.rpe || 'N/A'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEdit(workout.id)}
                    className="bg-yellow-500 text-white p-2 rounded-md hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(workout.id)}
                    disabled={deleting === workout.id}
                    className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 disabled:bg-gray-400"
                  >
                    {deleting === workout.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WorkoutList;
