-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables with CASCADE to remove dependent objects
DROP TABLE IF EXISTS workout_sets CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS mesocycles CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS muscle_groups CASCADE;
DROP TABLE IF EXISTS custom_exercises CASCADE;

-- Create muscle_groups table
CREATE TABLE muscle_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mesocycles table
CREATE TABLE mesocycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
  start_date DATE NOT NULL,
  workout_days TEXT[] NOT NULL DEFAULT '{}',
  exercise_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create exercises table
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create custom_exercises table
CREATE TABLE custom_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create workouts table
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mesocycle_id UUID REFERENCES mesocycles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create workout_exercises table
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create workout_sets table
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg NUMERIC,
  rpe NUMERIC CHECK (rpe >= 1 AND rpe <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  joint_pain TEXT CHECK (joint_pain IN ('LOW', 'MODERATE', 'A_LOT')),
  pump TEXT CHECK (pump IN ('LOW', 'MODERATE', 'AMAZING')),
  workload TEXT CHECK (workload IN ('EASY', 'PRETTY_GOOD', 'PUSHED_LIMITS', 'TOO_MUCH')),
  soreness TEXT CHECK (soreness IN ('NONE', 'SLIGHT', 'MODERATE', 'HIGH')),
  performance INTEGER CHECK (performance >= 1 AND performance <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE mesocycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mesocycles
CREATE POLICY mesocycles_select ON mesocycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY mesocycles_insert ON mesocycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY mesocycles_update ON mesocycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY mesocycles_delete ON mesocycles FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for exercises
CREATE POLICY exercises_select ON exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY exercises_insert ON exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY exercises_update ON exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY exercises_delete ON exercises FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for custom_exercises
CREATE POLICY custom_exercises_select ON custom_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY custom_exercises_insert ON custom_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY custom_exercises_update ON custom_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY custom_exercises_delete ON custom_exercises FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workouts
CREATE POLICY workouts_select ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY workouts_insert ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY workouts_update ON workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY workouts_delete ON workouts FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workout_exercises
CREATE POLICY workout_exercises_select ON workout_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY workout_exercises_insert ON workout_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY workout_exercises_update ON workout_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY workout_exercises_delete ON workout_exercises FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workout_sets
CREATE POLICY workout_sets_select ON workout_sets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY workout_sets_insert ON workout_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY workout_sets_update ON workout_sets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY workout_sets_delete ON workout_sets FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for feedback
CREATE POLICY feedback_select ON feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY feedback_insert ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY feedback_update ON feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY feedback_delete ON feedback FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for muscle_groups
CREATE POLICY muscle_groups_select ON muscle_groups FOR SELECT USING (true);
CREATE POLICY muscle_groups_insert ON muscle_groups FOR INSERT WITH CHECK (auth.role() = 'admin');
CREATE POLICY muscle_groups_update ON muscle_groups FOR UPDATE USING (auth.role() = 'admin');
CREATE POLICY muscle_groups_delete ON muscle_groups FOR DELETE USING (auth.role() = 'admin');

-- Create indexes for performance
CREATE INDEX idx_mesocycles_user_id ON mesocycles(user_id);
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_custom_exercises_user_id ON custom_exercises(user_id);
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_mesocycle_id ON workouts(mesocycle_id);
CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);
CREATE INDEX idx_workout_exercises_user_id ON workout_exercises(user_id);
CREATE INDEX idx_workout_sets_workout_exercise_id ON workout_sets(workout_exercise_id);
CREATE INDEX idx_workout_sets_user_id ON workout_sets(user_id);
CREATE INDEX idx_feedback_workout_exercise_id ON feedback(workout_exercise_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
