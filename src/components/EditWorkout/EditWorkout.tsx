import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import supabase from '../../utils/supabase';

const EditWorkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [date, setDate] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkout = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_sets(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        setError(`Error: ${error.message}`);
        setIsLoading(false);
        return;
      }

      if (data) {
        setDate(data.created_at);
        const workoutSet = data.workout_sets[0];
        setSets(workoutSet.sets.toString());
        setReps(workoutSet.reps.toString());
        setWeight(workoutSet.weight.toString());
        setRpe(workoutSet.rpe.toString());
      }
      setIsLoading(false);
    };

    fetchWorkout();
  }, [id]);

  const validateInputs = () => {
    if (!/^\d+$/.test(sets)) {
      setError('Sets must be a number');
      return false;
    }
    return true;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('workout_sets')
      .update({
        sets: Number(sets),
        reps: Number(reps),
        weight: Number(weight),
        rpe: Number(rpe),
      })
      .eq('id', id);

    if (updateError) {
      setError(`Error updating workout: ${updateError.message}`);
    } else {
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Edit Workout</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleUpdate}>
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              id="date"
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
          <div className="mb-4">
            <label htmlFor="sets" className="block text-sm font-medium text-gray-700">
              Sets
            </label>
            <input
              id="sets"
              type="text"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="reps" className="block text-sm font-medium text-gray-700">
              Reps
            </label>
            <input
              id="reps"
              type="text"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
              Weight
            </label>
            <input
              id="weight"
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="rpe" className="block text-sm font-medium text-gray-700">
              RPE
            </label>
            <input
              id="rpe"
              type="text"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 mb-2 disabled:bg-gray-400"
          >
            {isLoading ? 'Updating...' : 'Update'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="w-full bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditWorkout;
