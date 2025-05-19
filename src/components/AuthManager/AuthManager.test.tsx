import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AuthManager from "./AuthManager";
import * as supabase from "../../utils/supabase";
import { screen } from "@testing-library/dom";
import "@testing-library/jest-dom";
import type { AuthSession, User } from "@supabase/supabase-js";

vi.mock("../../utils/supabase", () => {
  const from = vi.fn();
  from.mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "5f9452e4-ddca-4b55-99f7-f956be84a46f" },
          error: null,
        }),
      }),
    }),
  }));

  return {
    default: {
      from,
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: "5f9452e4-ddca-4b55-99f7-f956be84a46f",
                email: "user@example.com",
              },
            } as AuthSession,
          },
          error: null,
        }),
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "5f9452e4-ddca-4b55-99f7-f956be84a46f",
              email: "user@example.com",
            } as User,
          },
          error: null,
        }),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
    },
  };
});

describe("AuthManager", () => {
  const mockSetIsAuthenticated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AuthManager setIsAuthenticated={mockSetIsAuthenticated}>
                {() => <div>Authenticated Content</div>}
              </AuthManager>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Authenticated Content")).toBeInTheDocument();
    });
  });

  it("renders children when authenticated", async () => {
    (supabase.default.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: {
            id: "5f9452e4-ddca-4b55-99f7-f956be84a46f",
            email: "user@example.com",
          },
        },
      },
      error: null,
    });
    (supabase.default.auth.getUser as any).mockResolvedValue({
      data: {
        user: {
          id: "5f9452e4-ddca-4b55-99f7-f956be84a46f",
          email: "user@example.com",
        },
      },
      error: null,
    });

    render(
      <MemoryRouter>
        <AuthManager setIsAuthenticated={mockSetIsAuthenticated}>
          {({ handleLogout, userId, isInitialized }) => (
            <div>
              {isInitialized && <span>User: {userId}</span>}
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </AuthManager>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("User: 5f9452e4-ddca-4b55-99f7-f956be84a46f"),
      ).toBeInTheDocument();
    });
  });

  it("redirects to login when not authenticated", async () => {
    (supabase.default.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <AuthManager setIsAuthenticated={mockSetIsAuthenticated}>
                {() => <div>Authenticated Content</div>}
              </AuthManager>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(
      () => {
        expect(screen.getByText("Login Page")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
