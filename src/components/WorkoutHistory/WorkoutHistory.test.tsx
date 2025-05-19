import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import WorkoutHistory from "./WorkoutHistory";
import * as supabase from "../../utils/supabase";
import "@testing-library/jest-dom";

vi.mock("../../utils/supabase", () => {
  const from = vi.fn();
  return {
    default: {
      from,
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
    },
  };
});

describe("WorkoutHistory", () => {
  const muscleGroups = ["Chest", "Back"];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<WorkoutHistory workouts={[]} muscleGroups={muscleGroups} />);
    expect(screen.getByText("Workout History")).toBeInTheDocument();
  });

  it('displays a "No workouts found" message when the list is empty', () => {
    render(<WorkoutHistory workouts={[]} muscleGroups={muscleGroups} />);
    expect(screen.getByText("No workouts found.")).toBeInTheDocument();
  });

  it("displays a list of workouts fetched from the API", () => {
    const workouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18T12:00:00Z",
        workout_sets: [
          {
            id: 1,
            exercise_id: 1,
            sets: 3,
            reps: 10,
            weight: 100,
            rpe: 7,
            exercises: { name: "Bench Press" },
          },
        ],
      },
    ];
    render(<WorkoutHistory workouts={workouts} muscleGroups={muscleGroups} />);
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
  });

  it("renders each workout with its relevant details", () => {
    const workouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18T12:00:00Z",
        workout_sets: [
          {
            id: 1,
            exercise_id: 1,
            sets: 3,
            reps: 10,
            weight: 100,
            rpe: 7,
            exercises: { name: "Bench Press" },
          },
        ],
      },
    ];
    render(<WorkoutHistory workouts={workouts} muscleGroups={muscleGroups} />);
    const workoutEntry = screen
      .getByText("Bench Press")
      .closest(".p-4.border.rounded-md.shadow-sm")!;
    expect(within(workoutEntry).getByText("2025-05-18")).toBeInTheDocument();
    expect(within(workoutEntry).getByText("Bench Press")).toBeInTheDocument();
    expect(within(workoutEntry).getByText("3")).toBeInTheDocument();
    expect(within(workoutEntry).getByText("10")).toBeInTheDocument();
    expect(within(workoutEntry).getByText("100")).toBeInTheDocument();
    expect(within(workoutEntry).getByText("7")).toBeInTheDocument();
  });
});
