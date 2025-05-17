import React, { useEffect } from 'react';
import supabase from '../../utils/supabase';
import type { Database } from '../../types/supabase';

type ProgressionSuggestionProps = {
  exerciseId: number | null;
  sets: number;
  weight: number;
  setWeight: React.Dispatch<React.SetStateAction<number>>;
  setSets: React.Dispatch<React.SetStateAction<number>>;
};

const ProgressionSuggestion: React.FC<ProgressionSuggestionProps> = ({
  exerciseId,
  sets,
  weight,
  setWeight,
  setSets,
}) => {
  useEffect(() => {
    if (!exerciseId) return;

    const suggestProgression = async () => {
      const { data: recentSets } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })
        .limit(sets);

      if (!recentSets || recentSets.length < sets) {
        alert('Initial workout logged. Start with 2–3 sets, adjust based on RPE next session.');
        return;
      }

      const avgRpe = recentSets.reduce((sum: number, set: Database['public']['Tables']['workout_sets']['Row']) => sum + (set.rpe ?? 0), 0) / sets;
      const maxReps = Math.max(...recentSets.map((s: Database['public']['Tables']['workout_sets']['Row']) => s.reps));

      if (avgRpe <= 7 && maxReps >= 10) {
        setWeight(weight + 5);
        alert(`Great job! Increase weight to ${weight + 5} lbs for this exercise next session.`);
      } else if (avgRpe <= 8 && sets < 6) {
        setSets(sets + 1);
        alert(`Good work! Increase to ${sets + 1} sets for this exercise next session.`);
      } else if (avgRpe >= 9) {
        const newSets = Math.max(2, Math.floor(sets * 0.75));
        setSets(newSets);
        alert(`High fatigue detected. Reduce to ${newSets} sets for this exercise next session.`);
      }
    };

    suggestProgression().catch((error) => {
      console.error('Error suggesting progression:', error);
      alert('Failed to suggest progression.');
    });
  }, [exerciseId, sets, weight, setWeight, setSets]);

  return null; // This component doesn't render anything
};

export default ProgressionSuggestion;
