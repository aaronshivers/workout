import React, { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";

import type { Database } from "../types/supabase";
import AuthManager from "./AuthManager/AuthManager";
import WorkoutForm from "./WorkoutForm";
import WorkoutHistory from "./WorkoutHistory/WorkoutHistory";
import ProgressionSuggestion from "./ProgressionSuggestion/ProgressionSuggestion";
import DataFetcher from "./DataFetcher";
import WorkoutLogger from "./WorkoutLogger/WorkoutLogger";
import supabase from "../utils/supabase";

// Define custom types for joined data
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

type Exercise = Database["public"]["Tables"]["exercises"]["Row"] & {
  muscle_groups: { name: string }[] | null;
};

const muscleGroups: string[] = [
  "Chest",
  "Back",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Biceps",
  "Triceps",
  "Traps",
  "Forearms",
  "Side Delts",
  "Front Delts",
  "Rear Delts",
  "Calves",
  "Abs",
];

const WorkoutTracker: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseId, setExerciseId] = useState<number | null>(null);
  const [muscleGroup, setMuscleGroup] = useState<string>("");
  const [sets, setSets] = useState<number>(3);
  const [reps, setReps] = useState<number>(10);
  const [weight, setWeight] = useState<number>(100);
  const [rpe, setRpe] = useState<number>(7);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session) {
        setIsAuthenticated(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
    };
    checkSession();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated === null) {
        console.log(
          "WorkoutTracker: Authentication timed out, redirecting to login",
        );
        setTimeoutReached(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const renderContent = useCallback(
    ({
      handleLogout,
      userId,
      isInitialized,
    }: {
      handleLogout: () => Promise<void>;
      userId: string;
      isInitialized: boolean;
    }) => {
      if (!isInitialized) return <div>Initializing...</div>;
      return (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Workout Tracker</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Log Out
            </button>
          </div>
          {/* <DataFetcher
            setWorkouts={setWorkouts}
            setExercises={setExercises}
            userId={userId}
            muscleGroups={muscleGroups}
          /> */}
          <WorkoutForm
            exercises={exercises}
            muscleGroups={muscleGroups}
            exerciseId={exerciseId}
            setExerciseId={setExerciseId}
            muscleGroup={muscleGroup}
            setMuscleGroup={setMuscleGroup}
            sets={sets}
            setSets={setSets}
            reps={reps}
            setReps={setReps}
            weight={weight}
            setWeight={setWeight}
            rpe={rpe}
            setRpe={setRpe}
          />
          {/* <WorkoutLogger
            userId={userId}
            exerciseId={exerciseId}
            sets={sets}
            reps={reps}
            weight={weight}
            rpe={rpe}
            setWorkouts={setWorkouts}
            isInitialized={isInitialized}
          />
          <ProgressionSuggestion
            exerciseId={exerciseId}
            sets={sets}
            weight={weight}
            setWeight={setWeight}
            setSets={setSets}
          /> */}
          <WorkoutHistory workouts={workouts} muscleGroups={muscleGroups} />
        </div>
      );
    },
    [exercises, exerciseId, muscleGroup, sets, reps, weight, rpe],
  );

  if (timeoutReached) return <Navigate to="/login" replace />;
  if (isAuthenticated === null) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md">
        <AuthManager setIsAuthenticated={setIsAuthenticated}>
          {renderContent}
        </AuthManager>
      </div>
    </div>
  );
};

export default React.memo(WorkoutTracker);
