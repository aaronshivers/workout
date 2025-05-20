import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';

const CreateWorkout: React.FC = () => {
  const [date, setDate] = useState('');
  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const [exercises, setExercises] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateInputs = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Invalid date format');
      return false;
    }
    if (isNaN(Number(duration))) {
      setError('Duration must be a number');
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsLoading(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    const { error: insertError } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        created_at: date,
        type,
        duration: Number(duration),
        workout_sets: exercises.split(',').map((exercise) => ({
          exercise_id: 1, // Simplified for testing
          sets: 3,
          reps: 10,
          weight: 100,
          rpe: 7,
          exercises: { name: exercise.trim() },
        })),
      })
      .select();

    if (insertError) {
      setError(`Error creating workout: ${insertError.message}`);
    } else {
      setDate('');
      setType('');
      setDuration('');
      setExercises('');
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Create Workout</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <input
              id="date"
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              Type
            </label>
            <input
              id="type"
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700"
            >
              Duration
            </label>
            <input
              id="duration"
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="exercises"
              className="block text-sm font-medium text-gray-700"
            >
              Exercises
            </label>
            <input
              id="exercises"
              type="text"
              value={exercises}
              onChange={(e) => setExercises(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 mb-2 disabled:bg-gray-400"
          >
            {isLoading ? 'Saving...' : 'Save'}
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

export default CreateWorkout;
