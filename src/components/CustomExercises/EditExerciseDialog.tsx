import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../utils/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

interface CustomExercise {
  id?: string;
  name: string;
  muscle_group: string | null;
  notes: string | null;
}

interface EditExerciseDialogProps {
  exercise?: CustomExercise;
  onSave: () => void;
}

const muscleGroups = [
  "Abs",
  "Back",
  "Biceps",
  "Calves",
  "Chest",
  "Glutes",
  "Hamstrings",
  "Quads",
  "Shoulders",
  "Triceps",
];

export const EditExerciseDialog: React.FC<EditExerciseDialogProps> = ({ exercise, onSave }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: exercise?.name || "",
    muscle_group: exercise?.muscle_group || "",
    notes: exercise?.notes || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.name.trim()) {
      setError("Exercise name is required.");
      return;
    }

    setLoading(true);
    try {
      if (exercise?.id) {
        // Update existing exercise
        const { error } = await supabase
          .from("custom_exercises")
          .update({
            name: formData.name,
            muscle_group: formData.muscle_group || null,
            notes: formData.notes || null,
          })
          .eq("id", exercise.id)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Create new exercise
        const { error } = await supabase.from("custom_exercises").insert({
          name: formData.name,
          muscle_group: formData.muscle_group || null,
          notes: formData.notes || null,
          user_id: user.id,
        });

        if (error) throw error;
      }
      setOpen(false);
      setFormData({ name: "", muscle_group: "", notes: "" });
      setError(null);
      onSave();
    } catch (err) {
      setError("Failed to save exercise. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={exercise ? "outline" : "default"}
          size={exercise ? "icon" : "default"}
          aria-label={exercise ? "Edit exercise" : "Add new exercise"}
        >
          {exercise ? <Plus className="h-4 w-4" /> : "Add Exercise"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{exercise ? "Edit Exercise" : "Add Exercise"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-destructive text-sm">{error}</div>}
          <div>
            <Label htmlFor="name">Exercise Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Goblet Squat"
              required
            />
          </div>
          <div>
            <Label htmlFor="muscle_group">Muscle Group (Optional)</Label>
            <Select
              value={formData.muscle_group || ""}
              onValueChange={(value) => setFormData({ ...formData, muscle_group: value })}
            >
              <SelectTrigger id="muscle_group">
                <SelectValue placeholder="Select a muscle group" />
              </SelectTrigger>
              <SelectContent>
                {muscleGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g., Use dumbbell"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExerciseDialog;
