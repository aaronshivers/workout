// src/components/EditWorkout/EditWorkout.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../utils/supabase";
import type { Database } from "../../types/supabase";

type ExerciseInput = {
  id?: number;
  name: string;
  sets: number[];
  reps: number[];
  weight: number[];
  rpe: number[];
};

type Workout = Database["public"]["Tables"]["workouts"]["Row"] & {
  workout_sets: (Database["public"]["Tables"]["workout_sets"]["Row"] & {
    exercises: Database["public"]["Tables"]["exercises"]["Row"] | null;
  })[];
};

const EditWorkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<ExerciseInput[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkout = async (): Promise<void> => {
      if (!id) {
        setError("Invalid workout ID");
        setIsLoading(false);
        return;
      }
      try {
        const { data, error: fetchError } = await supabase
          .from("workouts")
          .select(
            `
            *,
            workout_sets (
              *,
              exercises (*)
            )
          `,
          )
          .eq("id", id)
          .single();
        if (fetchError) {
          setError(fetchError.message);
          setIsLoading(false);
          return;
        }
        setWorkout(data);
        setExercises(
          data.workout_sets.reduce((acc: ExerciseInput[], set) => {
            const existing = acc.find((ex) => ex.name === set.exercises?.name);
            if (existing) {
              existing.sets.push(set.sets);
              existing.reps.push(set.reps);
              existing.weight.push(set.weight);
              existing.rpe.push(set.rpe);
            } else {
              acc.push({
                id: set.exercise_id,
                name: set.exercises?.name || "Unknown",
                sets: [set.sets],
                reps: [set.reps],
                weight: [set.weight],
                rpe: [set.rpe],
              });
            }
            return acc;
          }, []),
        );
        setIsLoading(false);
      } catch {
        setError("Network error");
        setIsLoading(false);
      }
    };
    fetchWorkout();
  }, [id]);

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

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!workout) return;

    // Validate inputs
    for (const exercise of exercises) {
      if (!exercise.name) {
        setValidationError("Exercise name is required");
        return;
      }
      if (exercise.sets.length === 0) {
        setValidationError("At least one set is required per exercise");
        return;
      }
      for (let i = 0; i < exercise.sets.length; i++) {
        if (isNaN(exercise.reps[i]) || exercise.reps[i] < 1) {
          setValidationError("Reps must be a positive number");
          return;
        }
        if (isNaN(exercise.weight[i]) || exercise.weight[i] < 0) {
          setValidationError("Weight must be a non-negative number");
          return;
        }
        if (
          isNaN(exercise.rpe[i]) ||
          exercise.rpe[i] < 1 ||
          exercise.rpe[i] > 10
        ) {
          setValidationError("RPE must be between 1 and 10");
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
        .from("workouts")
        .update({ created_at: workout.created_at })
        .eq("id", id);
      if (workoutError) throw workoutError;

      // Delete existing workout sets
      const { error: deleteError } = await supabase
        .from("workout_sets")
        .delete()
        .eq("workout_id", id);
      if (deleteError) throw deleteError;

      // Insert new exercises and sets
      for (const exercise of exercises) {
        let exerciseId = exercise.id;
        if (!exerciseId) {
          const { data: exerciseData, error: exerciseError } = await supabase
            .from("exercises")
            .insert({ name: exercise.name, user_id: workout.user_id })
            .select()
            .single();
          if (exerciseError) throw exerciseError;
          exerciseId = exerciseData.id;
        }

        const setData = exercise.sets.map((_, i) => ({
          workout_id: Number(id),
          exercise_id: exerciseId,
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

      navigate("/workouts");
    } catch (err: any) {
      setError(`Error updating workout: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = (): void => {
    navigate("/workouts");
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!workout) return <div>Workout not found</div>;

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
            value={workout.created_at.split("T")[0]}
            onChange={(e) =>
              setWorkout((prev) =>
                prev ? { ...prev, created_at: e.target.value } : null,
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
            {isUpdating ? "Updating..." : "Update"}
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
