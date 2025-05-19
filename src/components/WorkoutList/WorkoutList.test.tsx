import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom"; // Add Routes
import WorkoutList from "./WorkoutList";
import CreateWorkout from "../CreateWorkout/CreateWorkout"; // Import CreateWorkout
import * as supabase from "../../utils/supabase";
import "@testing-library/jest-dom";

vi.mock("../../utils/supabase", () => ({
  default: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-id" } } },
        error: null,
      }),
    },
  },
}));

describe("WorkoutList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    expect(screen.getByText("Workout List")).toBeInTheDocument();
  });

  it("displays a loading state while fetching workouts", () => {
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(() => new Promise(() => {})), // Simulate pending
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("displays a list of workouts fetched from the API", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [
          { exercise_id: 1, sets: 3, reps: 10, weight: 100, rpe: 7 },
        ],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByText("2025-05-18")).toBeInTheDocument(),
    );
  });

  it('displays a "No workouts found" message when the list is empty', async () => {
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByText("No workouts found.")).toBeInTheDocument(),
    );
  });

  it("renders each workout with its relevant details", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [
          { exercise_id: 1, sets: 3, reps: 10, weight: 100, rpe: 7 },
        ],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("2025-05-18")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });

  it("displays a button to navigate to the create workout page", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<WorkoutList />} />
          <Route path="/create-workout" element={<CreateWorkout />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Create Workout")).toBeInTheDocument();
  });

  it("displays an edit button for each workout", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [
          { exercise_id: 1, sets: 3, reps: 10, weight: 100, rpe: 7 },
        ],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText("Edit")).toBeInTheDocument());
  });

  it("displays a delete button for each workout", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [
          { exercise_id: 1, sets: 3, reps: 10, weight: 100, rpe: 7 },
        ],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText("Delete")).toBeInTheDocument());
  });

  it("calls the API to fetch workouts on component mount", async () => {
    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(supabase.default.from).toHaveBeenCalledWith("workouts");
      expect(supabase.default.from().select).toHaveBeenCalled();
    });
  });

  it("handles errors when fetching workouts", async () => {
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: "Fetch error" } }),
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(
        screen.getByText("Error fetching workouts: Fetch error"),
      ).toBeInTheDocument(),
    );
  });

  it("calls the API to delete the workout when the delete button is clicked", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [{ sets: 3, reps: 10, weight: 100, rpe: 7 }],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() => {
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
      expect(supabase.default.from().delete).toHaveBeenCalledWith({ id: 1 });
    });
  });

  it("re-fetches the workout list after successful deletion", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [{ sets: 3, reps: 10, weight: 100, rpe: 7 }],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() => {
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
      expect(supabase.default.from().select).toHaveBeenCalledTimes(2); // Once on mount, once after delete
    });
  });

  it("displays a confirmation dialog before deleting a workout", async () => {
    window.confirm = vi.fn(() => true); // Mock confirm dialog
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [{ sets: 3, reps: 10, weight: 100, rpe: 7 }],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() => {
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this workout?",
      );
    });
  });

  it("handles errors during workout deletion", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [{ sets: 3, reps: 10, weight: 100, rpe: 7 }],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
      delete: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Deletion error" },
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() => {
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
      expect(
        screen.getByText("Error deleting workout: Deletion error"),
      ).toBeInTheDocument();
    });
  });

  it("disables the delete button while the API call is in progress", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [{ sets: 3, reps: 10, weight: 100, rpe: 7 }],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
      delete: vi.fn().mockImplementation(() => new Promise(() => {})), // Simulate pending
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(async () => {
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
      expect(deleteButton).toBeDisabled();
      await waitFor(() => expect(deleteButton).not.toBeDisabled(), {
        timeout: 1000,
      });
    });
  });

  it("displays a loading indicator during the delete operation", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [{ sets: 3, reps: 10, weight: 100, rpe: 7 }],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
      delete: vi.fn().mockImplementation(() => new Promise(() => {})), // Simulate pending
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(async () => {
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
      expect(screen.getByText("Deleting...")).toBeInTheDocument();
      await waitFor(
        () => expect(screen.queryByText("Deleting...")).not.toBeInTheDocument(),
        { timeout: 1000 },
      );
    });
  });

  it("allows adding multiple exercises to a workout", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [
          { exercise_id: 1, sets: 3, reps: 10, weight: 100, rpe: 7 },
          { exercise_id: 2, sets: 3, reps: 8, weight: 80, rpe: 6 },
        ],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getAllByText("Bench Press").length).toBeGreaterThan(1); // Assuming exercise names are rendered
    });
  });

  it("displays details of each exercise within a workout", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [
          {
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
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Bench Press")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });

  it("validates the format of the workout date", async () => {
    render(
      <MemoryRouter initialEntries={["/create"]}>
        <CreateWorkout />
      </MemoryRouter>,
    );
    const dateInput = screen.getByLabelText("Date");
    fireEvent.change(dateInput, { target: { value: "invalid-date" } });
    fireEvent.blur(dateInput);
    await waitFor(() =>
      expect(screen.getByText("Invalid date format")).toBeInTheDocument(),
    );
  });

  it("validates that the workout duration is a number", async () => {
    render(
      <MemoryRouter initialEntries={["/create"]}>
        <CreateWorkout />
      </MemoryRouter>,
    );
    const durationInput = screen.getByLabelText("Duration");
    fireEvent.change(durationInput, { target: { value: "abc" } });
    fireEvent.blur(durationInput);
    await waitFor(() =>
      expect(screen.getByText("Duration must be a number")).toBeInTheDocument(),
    );
  });

  it("filters workouts by date range", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [{ sets: 3, reps: 10, weight: 100, rpe: 7 }],
      },
      {
        id: 2,
        user_id: "user-id",
        created_at: "2025-05-17",
        workout_sets: [{ sets: 3, reps: 8, weight: 90, rpe: 6 }],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    const filterInput = screen.getByLabelText("Filter by Date");
    fireEvent.change(filterInput, { target: { value: "2025-05-18" } });
    await waitFor(() =>
      expect(screen.getAllByText("2025-05-18").length).toBe(1),
    );
  });

  it("sorts workouts by date", async () => {
    const mockWorkouts = [
      {
        id: 2,
        user_id: "user-id",
        created_at: "2025-05-17",
        workout_sets: [{ sets: 3, reps: 8, weight: 90, rpe: 6 }],
      },
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [{ sets: 3, reps: 10, weight: 100, rpe: 7 }],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    const sortButton = screen.getByText("Sort by Date");
    fireEvent.click(sortButton);
    await waitFor(() => {
      const dates = screen.getAllByText(/\d{4}-\d{2}-\d{2}/);
      expect(dates[0]).toHaveTextContent("2025-05-18");
      expect(dates[1]).toHaveTextContent("2025-05-17");
    });
  });

  it("displays a summary of workout statistics", async () => {
    const mockWorkouts = [
      {
        id: 1,
        user_id: "user-id",
        created_at: "2025-05-18",
        workout_sets: [{ sets: 3, reps: 10, weight: 100, rpe: 7 }],
      },
      {
        id: 2,
        user_id: "user-id",
        created_at: "2025-05-17",
        workout_sets: [{ sets: 3, reps: 8, weight: 90, rpe: 6 }],
      },
    ];
    (supabase.default.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockWorkouts, error: null }),
      }),
    });

    render(
      <MemoryRouter>
        <WorkoutList />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Total Workouts: 2")).toBeInTheDocument();
      expect(screen.getByText("Average Sets: 3")).toBeInTheDocument();
    });
  });
});
