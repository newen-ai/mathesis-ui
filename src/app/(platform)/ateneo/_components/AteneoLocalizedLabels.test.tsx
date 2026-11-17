import "@/lib/i18n";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AteneoGroupMeta } from "./AteneoLocalizedLabels";

describe("AteneoGroupMeta", () => {
  it("uses memberCount and activityStatus when the backend sends them", () => {
    render(
      <p data-testid="meta">
        <AteneoGroupMeta group={{ subtitle: "x", activity: "y", memberCount: 1, activityStatus: "inactive" }} />
      </p>
    );
    expect(screen.getByTestId("meta")).toHaveTextContent("1 miembro · Sin actividad");
  });

  it("pluralizes the member count", () => {
    render(
      <p data-testid="meta">
        <AteneoGroupMeta group={{ subtitle: "x", activity: "y", memberCount: 3, activityStatus: "active" }} />
      </p>
    );
    expect(screen.getByTestId("meta")).toHaveTextContent("3 miembros · Activo hoy");
  });

  it("falls back to the backend labels from older backends", () => {
    render(
      <p data-testid="meta">
        <AteneoGroupMeta group={{ subtitle: "5 miembros", activity: "Activo hoy" }} />
      </p>
    );
    expect(screen.getByTestId("meta")).toHaveTextContent("5 miembros · Activo hoy");
  });
});
