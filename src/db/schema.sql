-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables with CASCADE to remove dependent objects
DROP TABLE IF EXISTS workout_sets CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;

-- Create exercises table (replacing custom_exercises)
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create workouts table
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mesocycle_name TEXT,
  start_date DATE,
  duration_weeks INTEGER,
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

-- Enable Row Level Security (RLS)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exercises
CREATE POLICY exercises_select ON exercises FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY exercises_insert ON exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY exercises_update ON exercises FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY exercises_delete ON exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for workouts
CREATE POLICY workouts_select ON workouts FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY workouts_insert ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY workouts_update ON workouts FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY workouts_delete ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for workout_exercises
CREATE POLICY workout_exercises_select ON workout_exercises FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY workout_exercises_insert ON workout_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY workout_exercises_update ON workout_exercises FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY workout_exercises_delete ON workout_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for workout_sets
CREATE POLICY workout_sets_select ON workout_sets FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY workout_sets_insert ON workout_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY workout_sets_update ON workout_sets FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY workout_sets_delete ON workout_sets FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);
CREATE INDEX idx_workout_exercises_user_id ON workout_exercises(user_id);
CREATE INDEX idx_workout_sets_workout_exercise_id ON workout_sets(workout_exercise_id);
CREATE INDEX idx_workout_sets_user_id ON workout_sets(user_id);
