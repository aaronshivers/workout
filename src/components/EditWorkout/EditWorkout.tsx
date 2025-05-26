// src/components/EditWorkout/EditWorkout.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../../utils/supabase';
import { Workout, Set, Exercise } from '../../types/supabase';

type ExerciseInput = {
  id?: string;
  name: string;
  sets: {
    set_number: number;
    reps: number;
    weight: number | null;
    rpe: number | null;
  }[];
};

const EditWorkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<ExerciseInput[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch workout
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select(
            `
            *,
            sets (
              *,
              exercises (*)
            )
          `,
          )
          .eq('id', id)
          .single();
        if (workoutError) throw new Error(workoutError.message);
        setWorkout(workoutData);

        // Fetch available exercises
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercises')
          .select('*');
        if (exerciseError) throw new Error(exerciseError.message);
        setAvailableExercises(exerciseData || []);

        // Initialize exercise inputs
        const exerciseMap = workoutData.sets.reduce(
          (acc: Map<string, ExerciseInput>, set) => {
            const exerciseId = set.exercise_id;
            const exerciseName = set.exercises?.name || 'Unknown';
            if (!acc.has(exerciseId)) {
              acc.set(exerciseId, {
                id: exerciseId,
                name: exerciseName,
                sets: [],
              });
            }
            acc.get(exerciseId)!.sets.push({
              set_number: set.set_number,
              reps: set.reps,
              weight: set.weight,
              rpe: set.rpe,
            });
            return acc;
          },
          new Map(),
        );
        setExercises(Array.from(exerciseMap.values()));
        setIsLoading(false);
      } catch (err: any) {
        setError(`Error fetching data: ${err.message}`);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: [] }]);
  };

  const addSet = (exerciseIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  set_number: ex.sets.length + 1,
                  reps: 10,
                  weight: null,
                  rpe: null,
                },
              ],
            }
          : ex,
      ),
    );
  };

  const updateExercise = (
    exerciseIndex: number,
    field: keyof ExerciseInput | 'set_field',
    value: string,
    setIndex?: number,
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? field === 'set_field' && setIndex !== undefined
            ? {
                ...ex,
                sets: ex.sets.map((s, idx) =>
                  idx === setIndex
                    ? {
                        ...s,
                        [value]:
                          value === 'reps' || value === 'set_number'
                            ? parseInt(value) || 0
                            : parseFloat(value) || null,
                      }
                    : s,
                ),
              }
            : { ...ex, [field]: value }
          : ex,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workout) return;

    // Validate inputs
    for (const exercise of exercises) {
      if (!exercise.name && !exercise.id) {
        setValidationError('Exercise name or selection is required');
        return;
      }
      if (exercise.sets.length === 0) {
        setValidationError('At least one set is required per exercise');
        return;
      }
      for (const set of exercise.sets) {
        if (isNaN(set.reps) || set.reps < 1) {
          setValidationError('Reps must be a positive number');
          return;
        }
        if (set.weight !== null && (isNaN(set.weight) || set.weight < 0)) {
          setValidationError('Weight must be a non-negative number');
          return;
        }
        if (
          set.rpe !== null &&
          (isNaN(set.rpe) || set.rpe < 1 || set.rpe > 10)
        ) {
          setValidationError('RPE must be between 1 and 10');
          return;
        }
      }
    }

    setIsUpdating(true);
    setError(null);
    setValidationError(null);

    try {
      // Update workout
      const { error: workoutError } = await supabase
        .from('workouts')
        .update({ date: workout.date })
        .eq('id', id);
      if (workoutError) throw new Error(workoutError.message);

      // Delete existing sets
      const { error: deleteError } = await supabase
        .from('sets')
        .delete()
        .eq('workout_id', id);
      if (deleteError) throw new Error(deleteError.message);

      // Insert new exercises and sets
      for (const exercise of exercises) {
        let exerciseId = exercise.id;
        if (!exerciseId && exercise.name) {
          const { data: exerciseData, error: exerciseError } = await supabase
            .from('exercises')
            .insert({ name: exercise.name, user_id: workout.user_id })
            .select()
            .single();
          if (exerciseError) throw new Error(exerciseError.message);
          exerciseId = exerciseData.id;
        }

        const setData = exercise.sets.map((set) => ({
          workout_id: id,
          exercise_id: exerciseId,
          set_number: set.set_number,
          reps: set.reps,
          weight: set.weight,
          rpe: set.rpe,
        }));

        const { error: setError } = await supabase.from('sets').insert(setData);
        if (setError) throw new Error(setError.message);
      }

      navigate('/workouts');
    } catch (err: any) {
      setError(`Error updating workout: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    navigate('/workouts');
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!workout) return <div className="p-6">Workout not found</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Edit Workout</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            value={workout.date}
            onChange={(e) =>
              setWorkout((prev) =>
                prev ? { ...prev, date: e.target.value } : null,
              )
            }
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {exercises.map((exercise, exerciseIndex) => (
          <div key={exerciseIndex} className="border p-4 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Exercise
              </label>
              <select
                value={exercise.id || ''}
                onChange={(e) => {
                  const selected = availableExercises.find(
                    (ex) => ex.id === e.target.value,
                  );
                  updateExercise(exerciseIndex, 'id', e.target.value);
                  updateExercise(exerciseIndex, 'name', selected?.name || '');
                }}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select an exercise</option>
                {availableExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
              {!exercise.id && (
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) =>
                    updateExercise(exerciseIndex, 'name', e.target.value)
                  }
                  placeholder="Or enter new exercise name"
                  className="mt-2 block w-full p-2 border border-gray-300 rounded-md"
                />
              )}
            </div>
            {exercise.sets.map((set, setIndex) => (
              <div key={setIndex} className="mt-4 space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Set {set.set_number}
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reps
                  </label>
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) =>
                      updateExercise(
                        exerciseIndex,
                        'set_field',
                        e.target.value,
                        setIndex,
                      )
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    value={set.weight || ''}
                    onChange={(e) =>
                      updateExercise(
                        exerciseIndex,
                        'set_field',
                        e.target.value,
                        setIndex,
                      )
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    RPE (1-10)
                  </label>
                  <input
                    type="number"
                    value={set.rpe || ''}
                    onChange={(e) =>
                      updateExercise(
                        exerciseIndex,
                        'set_field',
                        e.target.value,
                        setIndex,
                      )
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addSet(exerciseIndex)}
              className="mt-2 bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
            >
              Add Set
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addExercise}
          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        >
          Add Exercise
        </button>

        {validationError && (
          <div className="text-red-500 mb-4">{validationError}</div>
        )}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isUpdating}
            className="flex-1 bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditWorkout;
