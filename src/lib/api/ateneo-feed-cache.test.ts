import { describe, expect, it } from "vitest";
import { mockFetch, okData } from "@/test/fetch-mock";
import {
  emitAteneoGroupsChanged,
  invalidateAteneoFeedViewCache,
  listAteneoFeedForView,
} from "./ateneo";

describe("Ateneo feed view cache", () => {
  it("reuses the last feed during in-app navigation and refetches once invalidated", async () => {
    invalidateAteneoFeedViewCache();
    const fetchMock = mockFetch(okData({ topics: [{ id: "a" }] }), okData({ topics: [{ id: "b" }] }), okData({ topics: [{ id: "c" }] }));

    const first = await listAteneoFeedForView();
    const back = await listAteneoFeedForView();
    expect(back).toBe(first);
    expect(fetchMock.requests).toHaveLength(1);

    // Creating/deleting topics and group changes (join, kick...) invalidate it.
    emitAteneoGroupsChanged();
    const afterJoin = await listAteneoFeedForView();
    expect(afterJoin.data.topics[0]).toMatchObject({ id: "b" });

    invalidateAteneoFeedViewCache();
    const afterInvalidate = await listAteneoFeedForView();
    expect(afterInvalidate.data.topics[0]).toMatchObject({ id: "c" });
    expect(fetchMock.requests).toHaveLength(3);
  });
});
