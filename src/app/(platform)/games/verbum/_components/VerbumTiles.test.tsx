import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VerbumBoard } from "./VerbumTiles";

const winningGuess = {
  word: "ROBOT",
  letters: Array.from("ROBOT").map((letter) => ({ letter, state: "CORRECT" as const }))
};

function tiles() {
  return screen.getAllByRole("gridcell").slice(0, 5);
}

describe("VerbumBoard winning row", () => {
  it("flips the winning row right away, with the normal per-tile stagger", () => {
    render(
      <VerbumBoard length={5} maxAttempts={6} guesses={[winningGuess]} slots={[]} cursor={0} revealRow={0} winRow={0} shakeKey={0} />
    );

    expect(tiles().map((tile) => tile.style.animationDelay)).toEqual(["0ms", "300ms", "600ms", "900ms", "1200ms"]);
    expect(tiles()[0].className).toContain("verbum-tile-reveal");
    expect(tiles()[0].className).not.toContain("verbum-tile-win");
  });

  it("bounces once the reveal is over", () => {
    render(
      <VerbumBoard length={5} maxAttempts={6} guesses={[winningGuess]} slots={[]} cursor={0} revealRow={null} winRow={0} shakeKey={0} />
    );

    expect(tiles()[0].className).toContain("verbum-tile-win");
    expect(tiles().map((tile) => tile.style.animationDelay)).toEqual(["0ms", "90ms", "180ms", "270ms", "360ms"]);
  });
});

describe("VerbumBoard current row", () => {
  it("lets the player pick any tile and marks the selected one", () => {
    const onSelectTile = vi.fn();
    render(
      <VerbumBoard length={5} maxAttempts={6} guesses={[]} slots={["R", "", "B", "", ""]} cursor={2} onSelectTile={onSelectTile} revealRow={null} winRow={null} shakeKey={0} />
    );

    const row = screen.getAllByRole("gridcell").slice(0, 5);
    expect(row[2].getAttribute("aria-selected")).toBe("true");
    expect(row[0].textContent).toBe("R");

    fireEvent.click(row[4]);
    expect(onSelectTile).toHaveBeenCalledWith(4);
  });

  it("is not selectable while locked", () => {
    render(<VerbumBoard length={5} maxAttempts={6} guesses={[]} slots={["", "", "", "", ""]} cursor={0} revealRow={null} winRow={null} shakeKey={0} />);
    expect(screen.queryAllByRole("gridcell").some((cell) => cell.tagName === "BUTTON")).toBe(false);
  });
});
