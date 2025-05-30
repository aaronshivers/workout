import { useState, useEffect, type FormEvent, type JSX } from 'react';
import { useNavigate, useParams } from 'react-router';
import { supabase } from '@/utils/supabase';
import type { TablesUpdate } from '@/types/supabase';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Exercise {
  id: string;
  name: string;
  type: 'global' | 'custom';
}

interface MuscleGroup {
  id: string;
  name: string;
}

export function MesocycleEdit(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState<string>('');
  const [durationWeeks, setDurationWeeks] = useState<string>('');
  const [daysPerWeek, setDaysPerWeek] = useState<string>('');
  const [workoutDays, setWorkoutDays] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [customExerciseName, setCustomExerciseName] = useState<string>('');
  const [customMuscleGroup, setCustomMuscleGroup] = useState<string>('');
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const daysOfWeek: string[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const MAX_EXERCISES_PER_DAY = 12;

  useEffect(() => {
    async function fetchData(): Promise<void> {
      if (!id) {
        setError('Invalid mesocycle ID.');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated.');
        return;
      }

      try {
        // Fetch mesocycle
        const { data: mesocData, error: mesocError } = await supabase
          .from('mesocycles')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        if (mesocError) throw mesocError;
        setName(mesocData.name);
        setDurationWeeks(mesocData.duration_weeks.toString());
        setDaysPerWeek(mesocData.workout_days.length.toString());
        setWorkoutDays(mesocData.workout_days);
        setSelectedExercises(mesocData.exercise_ids);

        // Fetch exercises
        const { data: globalExercises, error: geError } = await supabase
          .from('exercises')
          .select('id, name')
          .eq('user_id', null);
        if (geError) throw geError;

        const { data: customExercises, error: ceError } = await supabase
          .from('custom_exercises')
          .select('id, name')
          .eq('user_id', user.id);
        if (ceError) throw ceError;

        setExercises([
          ...(globalExercises || []).map((e) => ({
            ...e,
            type: 'global' as const,
          })),
          ...(customExercises || []).map((e) => ({
            ...e,
            type: 'custom' as const,
          })),
        ]);

        // Fetch muscle groups
        const { data: mgData, error: mgError } = await supabase
          .from('muscle_groups')
          .select('id, name');
        if (mgError) throw mgError;
        setMuscleGroups(
          (mgData || []).map((mg) => ({
            id: mg.id.toString(),
            name: mg.name,
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data.');
      }
    }
    fetchData();
  }, [id]);

  const handleCustomExercise = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      setError('User not authenticated.');
      return;
    }

    if (!customExerciseName || !customMuscleGroup) {
      setError('Please provide a name and muscle group.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_exercises')
        .insert({
          name: customExerciseName,
          muscle_group: customMuscleGroup,
          user_id: user.id,
        })
        .select('id, name')
        .single();
      if (error) throw error;

      setExercises([...exercises, { ...data, type: 'custom' as const }]);
      setSelectedExercises([...selectedExercises, data.id.toString()]);
      setCustomExerciseName('');
      setCustomMuscleGroup('');
      setDialogOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add custom exercise.',
      );
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!id) {
      setError('Invalid mesocycle ID.');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      setError('User not authenticated.');
      return;
    }

    if (!name || !durationWeeks || !daysPerWeek || workoutDays.length === 0) {
      setError('Please fill all required fields.');
      return;
    }

    const duration = parseInt(durationWeeks, 10);
    const daysCount = parseInt(daysPerWeek, 10);
    if (isNaN(duration) || isNaN(daysCount)) {
      setError('Invalid duration or days per week.');
      return;
    }

    if (workoutDays.length !== daysCount) {
      setError(`Please select exactly ${daysCount} workout days.`);
      return;
    }

    if (selectedExercises.length > daysCount * MAX_EXERCISES_PER_DAY) {
      setError(
        `Cannot exceed ${MAX_EXERCISES_PER_DAY} exercises per workout day.`,
      );
      return;
    }

    const mesocData: TablesUpdate<'mesocycles'> = {
      name,
      duration_weeks: duration,
      goal: 'Hypertrophy',
      start_date: new Date().toISOString().split('T')[0]!,
      user_id: user.id,
      workout_days: workoutDays,
      exercise_ids: selectedExercises,
    };

    try {
      const { error: updateError } = await supabase
        .from('mesocycles')
        .update(mesocData)
        .eq('id', id)
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      navigate(`/mesocycles/${id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update mesocycle.',
      );
    }
  };

  return (
    <div className="max-w-[390px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Mesocycle</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Strength Block 1"
            required
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration (weeks)</Label>
          <Input
            id="duration"
            type="number"
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(e.target.value)}
            min="1"
            required
          />
        </div>
        <div>
          <Label htmlFor="daysPerWeek">Days per Week</Label>
          <Select onValueChange={setDaysPerWeek} value={daysPerWeek}>
            <SelectTrigger>
              <SelectValue placeholder="Select number" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {daysPerWeek && (
          <div>
            <Label>Workout Days</Label>
            <div className="space-y-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center">
                  <Checkbox
                    id={`day-${day}`}
                    checked={workoutDays.includes(day)}
                    onCheckedChange={(checked) => {
                      setWorkoutDays((prev) =>
                        checked
                          ? [...prev, day]
                          : prev.filter((d) => d !== day),
                      );
                    }}
                  />
                  <Label htmlFor={`day-${day}`} className="ml-2">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <Label>Exercises</Label>
          <div className="space-y-2">
            {exercises.map((ex) => (
              <div key={ex.id} className="flex items-center">
                <Checkbox
                  id={`exercise-${ex.id}`}
                  checked={selectedExercises.includes(ex.id)}
                  onCheckedChange={(checked) => {
                    setSelectedExercises((prev) =>
                      checked
                        ? [...prev, ex.id]
                        : prev.filter((id) => id !== ex.id),
                    );
                  }}
                />
                <Label htmlFor={`exercise-${ex.id}`} className="ml-2">
                  {ex.name} ({ex.type})
                </Label>
              </div>
            ))}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="w-full mt-2">
                Add Custom Exercise
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Exercise</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCustomExercise} className="space-y-4">
                <div>
                  <Label htmlFor="customName">Name</Label>
                  <Input
                    id="customName"
                    value={customExerciseName}
                    onChange={(e) => setCustomExerciseName(e.target.value)}
                    placeholder="e.g., Incline Dumbbell Press"
                  />
                </div>
                <div>
                  <Label htmlFor="customMuscleGroup">Muscle Group</Label>
                  <Select
                    onValueChange={setCustomMuscleGroup}
                    value={customMuscleGroup}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Muscle Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {muscleGroups.map((mg) => (
                        <SelectItem key={mg.id} value={mg.name}>
                          {mg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full">
          Update
        </Button>
      </form>
    </div>
  );
}
