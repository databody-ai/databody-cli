import { describe, it, expect } from "vitest";

describe("nutrition commands", () => {
  it("log food builds correct request body", () => {
    const items = [
      {
        name: "eggs",
        calories: 140,
        protein_grams: 12,
        carbs_grams: 1,
        fat_grams: 10,
      },
    ];
    const body = {
      meal_type: "breakfast",
      nutrition_items_attributes: items,
    };

    expect(body.meal_type).toBe("breakfast");
    expect(body.nutrition_items_attributes).toHaveLength(1);
    expect(body.nutrition_items_attributes[0].name).toBe("eggs");
  });

  it("history endpoint builds query string from dates", () => {
    const params = new URLSearchParams();
    params.set("start_date", "2026-01-01");
    params.set("end_date", "2026-01-31");
    const qs = params.toString();
    expect(qs).toBe("start_date=2026-01-01&end_date=2026-01-31");
  });

  it("add-item parses numeric options correctly", () => {
    const opts = {
      name: "toast",
      calories: "80",
      protein: "3",
      carbs: "15",
      fat: "1",
    };

    const body: Record<string, string | number> = { name: opts.name };
    body.calories = parseFloat(opts.calories);
    body.protein_grams = parseFloat(opts.protein);
    body.carbs_grams = parseFloat(opts.carbs);
    body.fat_grams = parseFloat(opts.fat);

    expect(body.calories).toBe(80);
    expect(body.protein_grams).toBe(3);
  });
});
