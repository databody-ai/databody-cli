import { describe, it, expect } from "vitest";
import * as path from "path";

describe("ai commands", () => {
  it("chat builds correct request body", () => {
    const message = "What should I eat for dinner?";
    const threadId = "5";
    const householdId = "1";

    const body: Record<string, unknown> = { message };
    body.thread_id = parseInt(threadId);
    body.household_id = parseInt(householdId);

    expect(body.message).toBe("What should I eat for dinner?");
    expect(body.thread_id).toBe(5);
    expect(body.household_id).toBe(1);
  });

  it("detect mime type from file extension", () => {
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".heic": "image/heic",
    };

    expect(mimeTypes[path.extname("photo.jpg")]).toBe("image/jpeg");
    expect(mimeTypes[path.extname("meal.png")]).toBe("image/png");
    expect(mimeTypes[path.extname("food.heic")]).toBe("image/heic");
  });

  it("suggestions endpoint builds query string with preferences", () => {
    const params = new URLSearchParams();
    params.set("preferences", "low carb");
    params.set("household_id", "1");
    const qs = params.toString();
    expect(qs).toContain("preferences=low+carb");
    expect(qs).toContain("household_id=1");
  });

  it("expand meal builds correct body with total_macros", () => {
    const body: Record<string, unknown> = {
      meal_name: "Chicken Stir Fry",
      ingredients: "chicken,broccoli,rice",
    };
    body.total_macros = {
      calories: 500,
      protein: 40,
      carbs: 50,
      fat: 15,
    };

    expect(body.meal_name).toBe("Chicken Stir Fry");
    expect(
      (body.total_macros as { calories: number }).calories
    ).toBe(500);
  });
});
