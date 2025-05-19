import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import ProgressionSuggestion from "./ProgressionSuggestion";
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

describe("ProgressionSuggestion", () => {
  const mockSetWeight = vi.fn();
  const mockSetSets = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing when exerciseId is null", () => {
    render(
      <ProgressionSuggestion
        exerciseId={null}
        sets={3}
        weight={100}
        setWeight={mockSetWeight}
        setSets={mockSetSets}
      />,
    );
    expect(
      screen.queryByText(/Progression Suggestion:/),
    ).not.toBeInTheDocument();
  });

  it("displays a suggestion when last workout has low RPE", async () => {
    (supabase.default.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { rpe: 6, weight: 100, sets: 3 },
                error: null,
              }),
            }),
          }),
        }),
      }),
    }));

    render(
      <ProgressionSuggestion
        exerciseId={1}
        sets={3}
        weight={100}
        setWeight={mockSetWeight}
        setSets={mockSetSets}
      />,
    );

    await waitFor(
      () => {
        const suggestionBox = screen
          .getByText("Progression Suggestion:")
          .closest(".mt-4.p-4.bg-blue-100.rounded-md")!;
        expect(
          within(suggestionBox).getByText(
            "RPE is low. Consider increasing weight.",
          ),
        ).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });
});
