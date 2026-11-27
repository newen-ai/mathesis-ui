import "@/lib/i18n";
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AteneoGroup } from "@/lib/api/ateneo";
import { emitAteneoGroupsChanged, joinAteneoGroup, onAteneoGroupsChanged } from "@/lib/api/ateneo";
import { mockFetch, okData } from "@/test/fetch-mock";
import { AteneoExploreGroups } from "./AteneoExploreGroups";

function group(memberCount: number): AteneoGroup {
  return {
    id: "g1",
    name: "Lógica",
    subtitle: "",
    activity: "",
    memberCount,
    activityStatus: "ACTIVE",
  } as unknown as AteneoGroup;
}

describe("Ateneo groups-changed event", () => {
  it("is emitted after a successful join, and not when the join fails", async () => {
    const listener = vi.fn();
    const unsubscribe = onAteneoGroupsChanged(listener);

    mockFetch(okData({ group: group(2) }));
    await joinAteneoGroup("g1");
    expect(listener).toHaveBeenCalledTimes(1);

    mockFetch({ status: 403, body: { success: false, message: "Forbidden" } });
    await expect(joinAteneoGroup("g1")).rejects.toThrow();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("makes the left rail refetch, so the member count updates right after joining", async () => {
    // Initial load (3 sections) returns 1 member; any later request returns 2.
    const fetchMock = mockFetch(
      okData({ groups: [] }),
      okData({ groups: [] }),
      okData({ groups: [group(1)] }),
      okData({ groups: [group(2)] })
    );
    render(<AteneoExploreGroups />);
    expect(await screen.findByText(/1 miembro/)).toBeInTheDocument();

    act(() => {
      emitAteneoGroupsChanged();
    });

    // The mock repeats its last response, so after the refetch every section lists the 2-member group.
    await waitFor(() => expect(screen.getAllByText(/2 miembros/).length).toBeGreaterThan(0));
    expect(screen.queryByText(/1 miembro\b/)).not.toBeInTheDocument();
    expect(fetchMock.requests.length).toBe(6);
  });
});
