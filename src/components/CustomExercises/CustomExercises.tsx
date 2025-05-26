import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EditExerciseDialog } from './EditExerciseDialog';
import { Loader2, Trash2 } from 'lucide-react';

interface CustomExercise {
  id: string;
  name: string;
  muscle_group: string | null;
  notes: string | null;
}

export const CustomExercises: React.FC = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<CustomExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_exercises')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExercises(data || []);
    } catch (err) {
      setError('Failed to fetch exercises. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_exercises')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setExercises(exercises.filter((exercise) => exercise.id !== id));
    } catch (err) {
      setError('Failed to delete exercise. Please try again.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [user]);

  return (
    <Card className="w-full max-w-full sm:max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Custom Exercises</CardTitle>
        <EditExerciseDialog onSave={fetchExercises} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-destructive text-center">{error}</div>
        ) : exercises.length === 0 ? (
          <div className="text-muted-foreground text-center">
            No custom exercises found. Add one to get started!
          </div>
        ) : (
          <ul className="space-y-4">
            {exercises.map((exercise) => (
              <li
                key={exercise.id}
                className="flex items-center justify-between p-4 border rounded-md"
              >
                <div>
                  <h3 className="text-lg font-semibold">{exercise.name}</h3>
                  {exercise.muscle_group && (
                    <p className="text-sm text-muted-foreground">
                      Muscle Group: {exercise.muscle_group}
                    </p>
                  )}
                  {exercise.notes && (
                    <p className="text-sm text-muted-foreground">
                      Notes: {exercise.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <EditExerciseDialog
                    exercise={exercise}
                    onSave={fetchExercises}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        aria-label="Delete exercise"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{exercise.name}"?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(exercise.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomExercises;
