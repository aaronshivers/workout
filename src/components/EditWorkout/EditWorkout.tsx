// src/components/EditWorkout/EditWorkout.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';

interface Workout {
  id: string;
  date: string;
  type: string;
  duration: number;
  exercises: string;
  sets: number;
}

const EditWorkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!id) {
        setError('Invalid workout ID');
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          setError(error.message);
          setIsLoading(false);
          return;
        }
        setWorkout(data);
        setIsLoading(false);
      } catch (err) {
        setError('Network error');
        setIsLoading(false);
      }
    };
    fetchWorkout();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setWorkout((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workout) return;

    // Validate inputs (e.g., for RP algorithm, sets must be positive)
    if (Number(workout.sets) <= 0) {
      setValidationError('Sets must be a positive number');
      return;
    }

    setIsUpdating(true);
    setValidationError(null);
    try {
      const { error } = await supabase
        .from('workouts')
        .update({
          date: workout.date,
          type: workout.type,
          duration: Number(workout.duration),
          exercises: workout.exercises,
          sets: Number(workout.sets),
        })
        .eq('id', id)
        .single();
      if (error) {
        setError(error.message);
        setIsUpdating(false);
        return;
      }
      setIsUpdating(false);
      navigate('/workouts');
    } catch (err) {
      setError('Network error');
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    navigate('/workouts');
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!workout) return <div>Workout not found</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Edit Workout</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={workout.date}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            id="type"
            name="type"
            value={workout.type}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="Strength">Strength</option>
            <option value="Cardio">Cardio</option>
            <option value="Hypertrophy">Hypertrophy</option>
          </select>
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Duration (minutes)
          </label>
          <input
            id="duration"
            name="duration"
            type="number"
            value={workout.duration}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label htmlFor="exercises" className="block text-sm font-medium text-gray-700">
            Exercises
          </label>
          <input
            id="exercises"
            name="exercises"
            type="text"
            value={workout.exercises}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label htmlFor="sets" className="block text-sm font-medium text-gray-700">
            Sets
          </label>
          <input
            id="sets"
            name="sets"
            type="number"
            value={workout.sets}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        {validationError && <p className="text-red-500 text-sm">{validationError}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isUpdating}
            className={`flex-1 py-2 px-4 rounded-md text-white font-semibold ${
              isUpdating ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-2 px-4 rounded-md text-white font-semibold bg-gray-600 hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditWorkout;
