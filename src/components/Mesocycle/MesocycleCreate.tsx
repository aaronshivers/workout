import { useEffect, useState, type FormEvent, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/utils/supabase';
import type { TablesInsert } from '@/types/supabase';
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
import { X } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  type: 'global' | 'custom';
}

interface MuscleGroup {
  id: string;
  name: string;
}

interface DayExercises {
  [day: string]: string[]; // Maps each workout day to a list of exercise IDs
}

export function MesocycleCreate(): JSX.Element {
  const navigate = useNavigate();
  const [name, setName] = useState<string>('');
  const [durationWeeks, setDurationWeeks] = useState<string>('6');
  const [workoutDays, setWorkoutDays] = useState<string[]>([]);
  const [dayExercises, setDayExercises] = useState<DayExercises>({});
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated.');
        return;
      }

      try {
        // Fetch global exercises
        const { data: globalExercises, error: geError } = await supabase
          .from('exercises')
          .select('id, name')
          .is('user_id', null); // Fetch global exercises (user_id is NULL)
        if (geError) {
          console.error('Global exercises fetch error:', geError);
          throw geError;
        }

        // Fetch custom exercises
        const { data: customExercises, error: ceError } = await supabase
          .from('custom_exercises')
          .select('id, name')
          .eq('user_id', user.id);
        if (ceError) {
          console.error('Custom exercises fetch error:', ceError);
          throw ceError;
        }

        // Combine exercises with fallback to ensure all are included
        const combinedExercises: Exercise[] = [
          ...(globalExercises || []).map((e) => ({ ...e, type: 'global' as const })),
          ...(customExercises || []).map((e) => ({ ...e, type: 'custom' as const })),
        ];
        console.log('Fetched exercises:', combinedExercises); // Debug log
        setExercises(combinedExercises);

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
  }, []);

  useEffect(() => {
    setDayExercises((prev) => {
      const newDayExercises: DayExercises = {};
      workoutDays.forEach((day) => {
        newDayExercises[day] = prev[day] || [];
      });
      return newDayExercises;
    });
  }, [workoutDays]);

  const handleCustomExercise = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
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
      setCustomExerciseName('');
      setCustomMuscleGroup('');
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add custom exercise.');
    }
  };

  const handleAddExerciseToDay = (day: string, exerciseId: string): void => {
    setDayExercises((prev) => {
      const exercisesForDay = new Set(prev[day] || []);
      if (exercisesForDay.size >= MAX_EXERCISES_PER_DAY) {
        setError(`Cannot exceed ${MAX_EXERCISES_PER_DAY} exercises on ${day}.`);
        return prev;
      }
      exercisesForDay.add(exerciseId);
      return {
        ...prev,
        [day]: Array.from(exercisesForDay),
      };
    });
  };

  const handleRemoveExerciseFromDay = (day: string, exerciseId: string): void => {
    setDayExercises((prev) => {
      const exercisesForDay = (prev[day] || []).filter((id) => id !== exerciseId);
      return {
        ...prev,
        [day]: exercisesForDay,
      };
    });
    setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      setError('User not authenticated.');
      return;
    }

    if (!name || !durationWeeks || workoutDays.length === 0) {
      setError('Please fill all required fields.');
      return;
    }

    const duration = parseInt(durationWeeks, 10);
    if (isNaN(duration) || duration < 1) {
      setError('Invalid duration.');
      return;
    }

    const hasExercises = workoutDays.every((day) => (dayExercises[day]?.length || 0) > 0);
    if (!hasExercises) {
      setError('Please assign at least one exercise to each workout day.');
      return;
    }

    const allExercises = [...new Set(Object.values(dayExercises).flat())];

    const mesocycleData: TablesInsert<'mesocycles'> = {
      name,
      duration_weeks: duration,
      goal: 'Hypertrophy',
      start_date: new Date().toISOString().split('T')[0]!,
      user_id: user.id,
      workout_days: workoutDays,
      exercise_ids: allExercises,
    };

    try {
      const { data: mesocycle, error: mesoError } = await supabase
        .from('mesocycles')
        .insert(mesocycleData)
        .select()
        .single();
      if (mesoError) throw mesoError;

      const workouts: TablesInsert<'workouts'>[] = [];
      const workoutDayMap: { [workoutId: string]: string } = {};
      for (let week = 0; week < duration; week++) {
        for (const day of workoutDays) {
          const workoutDate = new Date(mesocycle.start_date);
          workoutDate.setDate(workoutDate.getDate() + week * 7 + daysOfWeek.indexOf(day));
          const workout: TablesInsert<'workouts'> = {
            name: `${mesocycle.name} Week ${week + 1} ${day}`,
            date: workoutDate.toISOString().split('T')[0]!,
            mesocycle_id: mesocycle.id,
            user_id: user.id,
          };
          workouts.push(workout);
        }
      }

      const { data: insertedWorkouts, error: workoutError } = await supabase
        .from('workouts')
        .insert(workouts)
        .select();
      if (workoutError) throw workoutError;

      insertedWorkouts.forEach((workout) => {
        const day = workout.name.split(' ').pop()!;
        workoutDayMap[workout.id] = day;
      });

      const workoutExercises: TablesInsert<'workout_exercises'>[] = [];
      insertedWorkouts.forEach((workout, index) => {
        const day = workoutDayMap[workout.id];
        const exerciseIds = dayExercises[day] || [];
        exerciseIds.forEach((exerciseId, exIndex) => {
          workoutExercises.push({
            workout_id: workout.id,
            exercise_id: exerciseId,
            user_id: user.id,
            order_index: index * 100 + exIndex,
          });
        });
      });

      const { error: workoutExerciseError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercises);
      if (workoutExerciseError) throw workoutExerciseError;

      navigate('/mesocycles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mesocycle.');
    }
  };

  return (
    <div className="max-w-[390px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Mesocycle</h1>
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
          <Label htmlFor="duration">Duration (Weeks, including deload)</Label>
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
          <Label>Workout Days</Label>
          <div className="space-y-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="flex items-center">
                <Checkbox
                  id={`day-${day}`}
                  checked={workoutDays.includes(day)}
                  onCheckedChange={(checked: boolean) => {
                    setWorkoutDays((prev) =>
                      checked ? [...prev, day] : prev.filter((d) => d !== day),
                    );
                    setError(null);
                  }}
                />
                <Label htmlFor={`day-${day}`} className="ml-2">
                  {day}
                </Label>
              </div>
            ))}
          </div>
        </div>
        {workoutDays.length > 0 && (
          <div>
            <Label>Assign Exercises to Days</Label>
            {workoutDays.map((day) => (
              <div key={day} className="mt-4">
                <h3 className="text-lg font-semibold">{day}</h3>
                <div className="space-y-2 pl-4">
                  <Select
                    onValueChange={(exerciseId) => {
                      handleAddExerciseToDay(day, exerciseId);
                      setError(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an exercise to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((ex) => (
                        <SelectItem key={ex.id} value={ex.id}>
                          {ex.name} ({ex.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="space-y-1">
                    {(dayExercises[day] || []).length === 0 ? (
                      <p className="text-gray-500">No exercises assigned.</p>
                    ) : (
                      (dayExercises[day] || []).map((exerciseId) => {
                        const exercise = exercises.find((ex) => ex.id === exerciseId);
                        return (
                          <div
                            key={exerciseId}
                            className="flex items-center justify-between bg-gray-100 p-2 rounded"
                          >
                            <span>{exercise?.name || 'Unknown Exercise'}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExerciseFromDay(day, exerciseId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                  placeholder="e.g., Incline DB Press"
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
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full">
          Create
        </Button>
      </form>
    </div>
  );
}
