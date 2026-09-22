import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminActivityList } from "../../../../apps/web/src/features/admin/admin-activity-list";

const entry = {
  actorLabel: "Ops Lead",
  id: "0e879f46-1193-4d77-b785-057fe026d998",
  occurredAt: "2026-09-22T10:00:00.000Z",
  summary: "Updated a plan (STUDIO_PRO).",
};

describe("AdminActivityList", () => {
  it("says what changed, who changed it and when", () => {
    render(<AdminActivityList entries={[entry]} />);

    expect(screen.getByText("Updated a plan (STUDIO_PRO).")).toBeInTheDocument();
    expect(screen.getByText("Ops Lead, 22 Sept 2026")).toBeInTheDocument();
  });

  it("shows the actor it was given, whoever that is", () => {
    render(
      <AdminActivityList
        entries={[{ ...entry, actorLabel: "A removed account" }]}
      />,
    );

    expect(
      screen.getByText("A removed account, 22 Sept 2026"),
    ).toBeInTheDocument();
  });

  it("explains an empty trail rather than showing nothing", () => {
    render(<AdminActivityList entries={[]} />);

    expect(
      screen.getByText(
        "Nothing has been changed from the administration area yet.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("presents the trail as an ordered list, because the order is the point", () => {
    render(<AdminActivityList entries={[entry, { ...entry, id: "second" }]} />);

    expect(screen.getByRole("list").tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
