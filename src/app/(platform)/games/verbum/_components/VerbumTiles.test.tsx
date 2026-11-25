import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
      <VerbumBoard length={5} maxAttempts={6} guesses={[winningGuess]} input="" revealRow={0} winRow={0} shakeKey={0} />
    );

    expect(tiles().map((tile) => tile.style.animationDelay)).toEqual(["0ms", "300ms", "600ms", "900ms", "1200ms"]);
    expect(tiles()[0].className).toContain("verbum-tile-reveal");
    expect(tiles()[0].className).not.toContain("verbum-tile-win");
  });

  it("bounces once the reveal is over", () => {
    render(
      <VerbumBoard length={5} maxAttempts={6} guesses={[winningGuess]} input="" revealRow={null} winRow={0} shakeKey={0} />
    );

    expect(tiles()[0].className).toContain("verbum-tile-win");
    expect(tiles().map((tile) => tile.style.animationDelay)).toEqual(["0ms", "90ms", "180ms", "270ms", "360ms"]);
  });
});
