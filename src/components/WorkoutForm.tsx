import React from 'react';

type Exercise = {
  id: number;
  name: string;
  muscle_groups: { name: string }[] | null;
};

type WorkoutFormProps = {
  exercises: Exercise[];
  muscleGroups: string[];
  exerciseId: number | null;
  setExerciseId: React.Dispatch<React.SetStateAction<number | null>>;
  muscleGroup: string;
  setMuscleGroup: React.Dispatch<React.SetStateAction<string>>;
  sets: number;
  setSets: React.Dispatch<React.SetStateAction<number>>;
  reps: number;
  setReps: React.Dispatch<React.SetStateAction<number>>;
  weight: number;
  setWeight: React.Dispatch<React.SetStateAction<number>>;
  rpe: number;
  setRpe: React.Dispatch<React.SetStateAction<number>>;
};

const WorkoutForm: React.FC<WorkoutFormProps> = ({
  exercises,
  muscleGroups,
  exerciseId,
  setExerciseId,
  muscleGroup,
  setMuscleGroup,
  sets,
  setSets,
  reps,
  setReps,
  weight,
  setWeight,
  rpe,
  setRpe,
}) => {
  return (
    <div className="mb-6 p-4 bg-gray-100 rounded shadow">
      <div className="mb-4">
        <label className="block text-sm font-medium">Exercise</label>
        <select
          value={exerciseId ?? ''}
          onChange={(e) => setExerciseId(Number(e.target.value) || null)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Exercise</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.muscle_groups?.[0]?.name ?? 'Unknown'})
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Muscle Group</label>
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Muscle Group</option>
          {muscleGroups.map((group) => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium">Sets</label>
          <input
            type="number"
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            className="w-full p-2 border rounded"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Reps</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            className="w-full p-2 border rounded"
            min="1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium">Weight (lbs)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full p-2 border rounded"
            min="0"
            step="5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">RPE (1–10)</label>
          <input
            type="number"
            value={rpe}
            onChange={(e) => setRpe(Number(e.target.value))}
            className="w-full p-2 border rounded"
            min="1"
            max="10"
          />
        </div>
      </div>
    </div>
  );
};

export default WorkoutForm;
