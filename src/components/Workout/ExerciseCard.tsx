import type { Exercise, ExerciseEntry, Set } from '@/services/WorkoutService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { JSX } from 'react';

interface ExerciseCardProps {
  entry: ExerciseEntry;
  index: number;
  exercises: Exercise[];
  updateExercise: (index: number, exerciseId: string) => void;
  updateSet: (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight_kg' | 'rpe',
    value: number,
  ) => void;
  addSet: (exerciseIndex: number) => void;
  handleSaveSets: (exerciseIndex: number) => void;
}

export function ExerciseCard({
  entry,
  index,
  exercises,
  updateExercise,
  updateSet,
  addSet,
  handleSaveSets,
}: ExerciseCardProps): JSX.Element {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>
          {exercises.find((e) => e.id === entry.exerciseId)?.name ||
            'Select Exercise'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <Label htmlFor={`exercise-${index}`}>Exercise</Label>
          <Select
            onValueChange={(value) => updateExercise(index, value)}
            value={entry.exerciseId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Exercise" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name} ({exercise.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {entry.sets.map((set: Set, setIndex: number) => (
          <div key={setIndex} className="space-y-2 mb-2">
            <Label>Set {setIndex + 1}</Label>
            <Input
              type="number"
              placeholder="Reps"
              value={set.reps}
              onChange={(e) =>
                updateSet(index, setIndex, 'reps', parseInt(e.target.value, 10))
              }
              min="0"
              required
            />
            <Input
              type="number"
              placeholder="Weight (kg)"
              value={set.weight_kg ?? ''}
              onChange={(e) =>
                updateSet(
                  index,
                  setIndex,
                  'weight_kg',
                  parseFloat(e.target.value),
                )
              }
              min="0"
              step="0.1"
            />
            <Input
              type="number"
              placeholder="RPE"
              value={set.rpe ?? ''}
              onChange={(e) =>
                updateSet(index, setIndex, 'rpe', parseFloat(e.target.value))
              }
              min="0"
              max="10"
              step="0.5"
            />
          </div>
        ))}
        <Button
          type="button"
          onClick={() => addSet(index)}
          variant="outline"
          className="w-full mb-2"
        >
          Add Set
        </Button>
        <Button
          type="button"
          onClick={() => handleSaveSets(index)}
          className="w-full"
        >
          Save Exercise
        </Button>
      </CardContent>
    </Card>
  );
}
