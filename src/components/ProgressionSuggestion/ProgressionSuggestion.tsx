import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import type { Database } from '../../types/supabase';

type ProgressionSuggestionProps = {
  exerciseId: number | null;
  sets: number;
  weight: number;
  setWeight: React.Dispatch<React.SetStateAction<number>>;
  setSets: React.Dispatch<React.SetStateAction<number>>;
};

type WorkoutSet = Database['public']['Tables']['workout_sets']['Row'];

const ProgressionSuggestion: React.FC<ProgressionSuggestionProps> = ({
  exerciseId,
  sets,
  weight,
  setWeight,
  setSets,
}) => {
  const [lastWorkout, setLastWorkout] = useState<WorkoutSet | null>(null);
  const [suggestion, setSuggestion] = useState<string>('');

  useEffect(() => {
    const fetchLastWorkout = async () => {
      if (!exerciseId) {
        setLastWorkout(null);
        setSuggestion('');
        return;
      }

      const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching last workout:', error);
        setLastWorkout(null);
        setSuggestion('Error fetching last workout.');
        return;
      }

      setLastWorkout(data);
    };

    fetchLastWorkout();
  }, [exerciseId]);

  useEffect(() => {
    if (!lastWorkout) {
      setSuggestion('');
      return;
    }

    const { rpe, weight: lastWeight, sets: lastSets } = lastWorkout;

    if (rpe < 7) {
      setSuggestion('RPE is low. Consider increasing weight.');
      setWeight(lastWeight + 5);
    } else if (rpe > 9) {
      setSuggestion('RPE is high. Consider decreasing sets or weight.');
      setSets(Math.max(1, lastSets - 1));
      setWeight(Math.max(0, lastWeight - 5));
    } else {
      setSuggestion('RPE is optimal. Maintain current weight and sets.');
    }
  }, [lastWorkout, setWeight, setSets]);

  if (!suggestion) return null;

  return (
    <div className="mt-4 p-4 bg-blue-100 rounded-md">
      <h3 className="font-semibold">Progression Suggestion:</h3>
      <p>{suggestion}</p>
    </div>
  );
};

export default ProgressionSuggestion;
