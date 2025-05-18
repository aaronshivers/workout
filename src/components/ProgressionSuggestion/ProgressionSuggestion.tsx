import React from 'react';
import { WorkoutSet } from '../../types/supabase';

interface ProgressionSuggestionProps {
  workoutSet: WorkoutSet;
}

const ProgressionSuggestion: React.FC<ProgressionSuggestionProps> = ({ workoutSet }) => {
  const { sets, reps, weight, rpe } = workoutSet;

  // RP Strength Set Progression Algorithm
  const targetRpe = 6; // Example target RPE
  let suggestedWeight = weight;
  let suggestedReps = reps;

  if (rpe <= targetRpe) {
    // If RPE is at or below target, increase weight by 5-10 lbs or reps by 1-2
    suggestedWeight = weight + 5; // Increase by 5 lbs
    suggestedReps = reps + 1; // Increase by 1 rep
  }

  return (
    <div className="p-4 border rounded-md shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Progression Suggestion</h2>
      <p>
        Current: {sets} sets, {reps} reps, {weight} lbs, RPE {rpe}
      </p>
      <p>
        Suggested: {sets} sets, {suggestedReps} reps, {suggestedWeight} lbs
      </p>
    </div>
  );
};

export default ProgressionSuggestion;
