import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserProfileLink, userProfileHref } from "./UserProfileLink";

describe("UserProfileLink", () => {
  it("links the name to the user's profile without triggering the parent click", () => {
    const onParentClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <UserProfileLink userId="u 1" className="font-semibold">
          Ana Test
        </UserProfileLink>
      </div>
    );

    const link = screen.getByRole("link", { name: "Ana Test" });
    expect(link.getAttribute("href")).toBe("/perfil?userId=u%201");
    expect(link.className).toContain("font-semibold");

    fireEvent.click(link);
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("renders plain text when there is no user id", () => {
    render(<UserProfileLink userId={null}>Comentario eliminado</UserProfileLink>);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Comentario eliminado")).toBeTruthy();
  });

  it("builds the profile href", () => {
    expect(userProfileHref("abc")).toBe("/perfil?userId=abc");
  });
});
