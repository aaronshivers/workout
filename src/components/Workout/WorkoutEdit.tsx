import { useWorkoutEdit } from '@/hooks/useWorkoutEdit';
import { ExerciseCard } from './ExerciseCard';
import { FeedbackDialog } from './FeedbackDialog';
import { Button } from '@/components/ui/button';
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

export function WorkoutEdit(): JSX.Element {
  const {
    name,
    setName,
    date,
    setDate,
    mesocycleId,
    setMesocycleId,
    mesocycles,
    exercises,
    exerciseEntries,
    feedbackOpen,
    setFeedbackOpen,
    feedback,
    setFeedback,
    error,
    addExercise,
    updateExercise,
    addSet,
    updateSet,
    handleSaveSets,
    handleSaveFeedback,
    handleSubmit,
  } = useWorkoutEdit();

  return (
    <div className="max-w-[390px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Workout</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Push Day"
            required
          />
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="mesocycle">Mesocycle</Label>
          <Select onValueChange={setMesocycleId} value={mesocycleId ?? ''}>
            <SelectTrigger>
              <SelectValue placeholder="Select Mesocycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {mesocycles.map((mesocycle) => (
                <SelectItem key={mesocycle.id} value={mesocycle.id}>
                  {mesocycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <h2 className="text-xl font-semibold mt-4">Exercises</h2>
        {exerciseEntries.map((entry, index) => (
          <ExerciseCard
            key={entry.id || index}
            entry={entry}
            index={index}
            exercises={exercises}
            updateExercise={updateExercise}
            updateSet={updateSet}
            addSet={addSet}
            handleSaveSets={handleSaveSets}
          />
        ))}
        <Button type="button" onClick={addExercise} className="w-full">
          Add Exercise
        </Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full">
          Update
        </Button>
      </form>
      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        feedback={feedback}
        setFeedback={setFeedback}
        onSave={handleSaveFeedback}
      />
    </div>
  );
}
