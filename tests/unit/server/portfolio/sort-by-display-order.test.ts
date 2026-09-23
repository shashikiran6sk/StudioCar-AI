import { describe, expect, it } from "vitest";

import { sortByDisplayOrder } from "../../../../apps/web/src/server/portfolio/sort-by-display-order";

describe("sortByDisplayOrder", () => {
  it("orders by position with a stable identifier tie-break, without mutating", () => {
    const items = [
      { displayOrder: 1, id: "b" },
      { displayOrder: 0, id: "z" },
      { displayOrder: 1, id: "a" },
    ];

    expect(sortByDisplayOrder(items).map((item) => item.id)).toEqual(["z", "a", "b"]);
    expect(items.map((item) => item.id)).toEqual(["b", "z", "a"]);
  });
});
