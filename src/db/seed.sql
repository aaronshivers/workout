-- Seed muscle_groups
INSERT INTO muscle_groups (id, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Chest'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Back'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Quads'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Hamstrings'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Shoulders'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Triceps'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Biceps');

-- Seed exercises (global)
INSERT INTO exercises (id, user_id, name, muscle_group) VALUES
  ('550e8400-e29b-41d4-a716-446655440011', NULL, 'Bench Press', 'Chest'),
  ('550e8400-e29b-41d4-a716-446655440012', NULL, 'Squat', 'Quads'),
  ('550e8400-e29b-41d4-a716-446655440013', NULL, 'Deadlift', 'Back'),
  ('550e8400-e29b-41d4-a716-446655440014', NULL, 'Overhead Press', 'Shoulders'),
  ('550e8400-e29b-41d4-a716-446655440015', NULL, 'Barbell Row', 'Biceps');
