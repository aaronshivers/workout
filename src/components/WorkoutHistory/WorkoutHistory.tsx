import React from "react";
import type { Database } from "../../types/supabase";

type ExerciseWithMuscleGroup =
  Database["public"]["Tables"]["exercises"]["Row"] & {
    muscle_groups: { name: string }[] | null;
  };

type WorkoutSet = Database["public"]["Tables"]["workout_sets"]["Row"] & {
  exercises: ExerciseWithMuscleGroup | null;
};

type Workout = Database["public"]["Tables"]["workouts"]["Row"] & {
  workout_sets: WorkoutSet[];
};

type WorkoutHistoryProps = {
  workouts: Workout[];
  muscleGroups: string[];
};

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  workouts,
  muscleGroups,
}) => {
  if (!workouts || workouts.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-2">Workout History</h2>
        <p>No workouts found.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Workout History</h2>
      <div className="space-y-4">
        {workouts.map((workout) => (
          <div key={workout.id} className="p-4 border rounded-md shadow-sm">
            <p>
              <strong>Date:</strong>{" "}
              {new Date(workout.created_at).toISOString().split("T")[0]}
            </p>
            {workout.workout_sets && workout.workout_sets.length > 0 ? (
              workout.workout_sets.map((set) => (
                <div key={set.id} className="mt-2">
                  <p>
                    <strong>Exercise:</strong>{" "}
                    {set.exercises?.name || "Unknown Exercise"}
                  </p>
                  <p>
                    <strong>Sets:</strong> {set.sets}
                  </p>
                  <p>
                    <strong>Reps:</strong> {set.reps}
                  </p>
                  <p>
                    <strong>Weight:</strong> {set.weight}
                  </p>
                  <p>
                    <strong>RPE:</strong> {set.rpe}
                  </p>
                </div>
              ))
            ) : (
              <p>No sets recorded.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutHistory;
