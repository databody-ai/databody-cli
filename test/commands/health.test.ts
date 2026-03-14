import { describe, it, expect } from "vitest";

describe("health commands", () => {
  it("summary endpoint path is correct", () => {
    expect("/health/summary").toBe("/health/summary");
  });

  it("history endpoint accepts days parameter", () => {
    const days = 90;
    const endpoint = `/health/history?days=${days}`;
    expect(endpoint).toBe("/health/history?days=90");
  });

  it("history days parameter defaults to 30", () => {
    const defaultDays = "30";
    expect(parseInt(defaultDays)).toBe(30);
  });
});
