// src/components/CreateWorkout/CreateWorkout.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../utils/supabase";

type ExerciseInput = {
  name: string;
  sets: number[];
  reps: number[];
  weight: number[];
  rpe: number[];
};

const CreateWorkout: React.FC = () => {
  const [date, setDate] = useState<string>("");
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    { name: "", sets: [], reps: [], weight: [], rpe: [] },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateInputs = (): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Invalid date format (YYYY-MM-DD)");
      return false;
    }
    for (const exercise of exercises) {
      if (!exercise.name) {
        setError("Exercise name is required");
        return false;
      }
      if (exercise.sets.length === 0) {
        setError("At least one set is required per exercise");
        return false;
      }
      for (let i = 0; i < exercise.sets.length; i++) {
        if (isNaN(exercise.reps[i]) || exercise.reps[i] < 1) {
          setError("Reps must be a positive number");
          return false;
        }
        if (isNaN(exercise.weight[i]) || exercise.weight[i] < 0) {
          setError("Weight must be a non-negative number");
          return false;
        }
        if (
          isNaN(exercise.rpe[i]) ||
          exercise.rpe[i] < 1 ||
          exercise.rpe[i] > 10
        ) {
          setError("RPE must be between 1 and 10");
          return false;
        }
      }
    }
    return true;
  };

  const addExercise = (): void => {
    setExercises([
      ...exercises,
      { name: "", sets: [], reps: [], weight: [], rpe: [] },
    ]);
  };

  const addSet = (exerciseIndex: number): void => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? {
              ...ex,
              sets: [...ex.sets, ex.sets.length + 1],
              reps: [...ex.reps, 10],
              weight: [...ex.weight, 100],
              rpe: [...ex.rpe, 7],
            }
          : ex,
      ),
    );
  };

  const updateExercise = (
    exerciseIndex: number,
    field: keyof ExerciseInput,
    value: string,
    setIndex?: number,
  ): void => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? {
              ...ex,
              [field]:
                field === "name"
                  ? value
                  : [
                      ...ex[field],
                      ...(setIndex !== undefined ? [parseFloat(value)] : []),
                    ],
            }
          : ex,
      ),
    );
  };

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      // Insert workout
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .insert({ user_id: userId, created_at: date })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Insert exercises and sets
      for (const exercise of exercises) {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from("exercises")
          .insert({ name: exercise.name, user_id: userId })
          .select()
          .single();
        if (exerciseError) throw exerciseError;

        const setData = exercise.sets.map((_, i) => ({
          workout_id: workoutData.id,
          exercise_id: exerciseData.id,
          sets: exercise.sets[i],
          reps: exercise.reps[i],
          weight: exercise.weight[i],
          rpe: exercise.rpe[i],
        }));

        const { error: setError } = await supabase
          .from("workout_sets")
          .insert(setData);
        if (setError) throw setError;
      }

      setDate("");
      setExercises([{ name: "", sets: [], reps: [], weight: [], rpe: [] }]);
      navigate("/");
    } catch (err: any) {
      setError(`Error creating workout: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (): void => {
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Workout</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {exercises.map((exercise, exerciseIndex) => (
          <div key={exerciseIndex} className="border p-4 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Exercise Name
              </label>
              <input
                type="text"
                value={exercise.name}
                onChange={(e) =>
                  updateExercise(exerciseIndex, "name", e.target.value)
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {exercise.sets.map((set, setIndex) => (
              <div key={setIndex} className="mt-4 space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Set {setIndex + 1} Reps
                  </label>
                  <input
                    type="number"
                    value={exercise.reps[setIndex]}
                    onChange={(e) =>
                      updateExercise(
                        exerciseIndex,
                        "reps",
                        e.target.value,
                        setIndex,
                      )
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    value={exercise.weight[setIndex]}
                    onChange={(e) =>
                      updateExercise(
                        exerciseIndex,
                        "weight",
                        e.target.value,
                        setIndex,
                      )
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    RPE
                  </label>
                  <input
                    type="number"
                    value={exercise.rpe[setIndex]}
                    onChange={(e) =>
                      updateExercise(
                        exerciseIndex,
                        "rpe",
                        e.target.value,
                        setIndex,
                      )
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10"
                    required
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

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {isLoading ? "Saving..." : "Save"}
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

export default CreateWorkout;
