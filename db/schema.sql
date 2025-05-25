-- db/schema.sql
-- Schema for workout tracking application
-- Run in Supabase SQL Editor to initialize or update database

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update workouts table (already exists)
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Default',
  ADD COLUMN IF NOT EXISTS mesocycle_name TEXT NOT NULL DEFAULT 'Default',
  ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS duration_weeks INTEGER NOT NULL DEFAULT 4 CHECK (duration_weeks > 0),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id INTEGER REFERENCES workouts(id),
  exercise_id UUID REFERENCES custom_exercises(id),
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update workout_sets table (already exists)
ALTER TABLE workout_sets
  ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ADD COLUMN IF NOT EXISTS workout_exercise_id UUID REFERENCES workout_exercises(id),
  ADD COLUMN IF NOT EXISTS set_number INTEGER NOT NULL DEFAULT 1 CHECK (set_number > 0),
  ADD COLUMN IF NOT EXISTS reps INTEGER NOT NULL DEFAULT 8 CHECK (reps > 0),
  ADD COLUMN IF NOT EXISTS weight_kg REAL CHECK (weight_kg >= 0),
  ADD COLUMN IF NOT EXISTS rpe REAL CHECK (rpe >= 0 AND rpe <= 10),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Enable Row Level Security (RLS)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- Drop redundant RLS policies on workouts
DROP POLICY IF EXISTS "Allow authenticated users to select their own workouts" ON workouts;
DROP POLICY IF EXISTS "Allow authenticated users to insert into workouts" ON workouts;
DROP POLICY IF EXISTS "Allow authenticated users to select their workouts" ON workouts;
DROP POLICY IF EXISTS user_workouts ON workouts;

-- Create RLS policies
CREATE POLICY user_workouts ON workouts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_workout_exercises ON workout_exercises
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM workouts
    WHERE workouts.id = workout_exercises.workout_id
    AND workouts.user_id = auth.uid()
  ));

CREATE POLICY user_workout_sets ON workout_sets
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workouts w ON w.id = we.workout_id
    WHERE we.id = workout_sets.workout_exercise_id
    AND w.user_id = auth.uid()
  ));
