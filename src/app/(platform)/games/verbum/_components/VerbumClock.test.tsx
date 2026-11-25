import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VerbumClock } from "./VerbumClock";

describe("VerbumClock", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("keeps counting from the backend's elapsed time while the game runs", () => {
    render(<VerbumClock elapsedMs={65_000} running />);
    expect(screen.getByText("1:05")).toBeTruthy();

    act(() => vi.advanceTimersByTime(3_000));
    expect(screen.getByText("1:08")).toBeTruthy();
  });

  it("shows the final time once the game is over", () => {
    render(<VerbumClock elapsedMs={155_000} running={false} />);
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText("2:35")).toBeTruthy();
  });
});
