import React, { useState } from "react";
import supabase from "../../utils/supabase";
import type { Database } from "../../types/supabase";

type WorkoutLoggerProps = {
  userId: string;
  exerciseId: number | null;
  sets: number;
  reps: number;
  weight: number;
  rpe: number;
  setWorkouts: React.Dispatch<
    React.SetStateAction<Database["public"]["Tables"]["workouts"]["Row"][]>
  >;
  isInitialized: boolean;
};

const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({
  userId,
  exerciseId,
  sets,
  reps,
  weight,
  rpe,
  setWorkouts,
  isInitialized,
}) => {
  const [isLogging, setIsLogging] = useState(false);

  const handleLogWorkout = async () => {
    if (!isInitialized || !exerciseId || !userId) {
      console.error("Initialization or exercise/user not ready.");
      return;
    }

    setIsLogging(true);

    try {
      // Start a transaction to ensure consistency
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .insert({ user_id: userId, created_at: new Date().toISOString() })
        .select()
        .single();

      if (workoutError) throw workoutError;

      const workoutId = workoutData.id;

      // Log sets for the workout
      const setData = Array.from({ length: sets }, () => ({
        workout_id: workoutId,
        exercise_id: exerciseId,
        sets,
        reps,
        weight,
        rpe,
        created_at: new Date().toISOString(),
      }));

      const { error: setError } = await supabase
        .from("workout_sets")
        .insert(setData);

      if (setError) throw setError;

      console.log("Workout logged successfully");
      const { data: newWorkouts } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId);
      setWorkouts(newWorkouts || []);
    } catch (error) {
      console.error("Error logging workout:", error);
      alert("Failed to log workout. Check console for details.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleLogWorkout}
        disabled={isLogging || !isInitialized || !exerciseId}
        className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {isLogging ? "Logging..." : "Log Workout"}
      </button>
    </div>
  );
};

export default WorkoutLogger;
