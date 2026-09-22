import { describe, expect, expectTypeOf, it } from "vitest";
import { dashboardViewSchema } from "./dashboard.ts";
import type {
  DashboardViewFull,
  DashboardViewLocations,
  DashboardViewNone,
  DashboardViewTitles,
} from "./dashboard.ts";

type DeepKeys<T> = T extends readonly (infer Item)[]
  ? DeepKeys<Item>
  : T extends object
    ? { [Key in keyof T & string]: Key | DeepKeys<T[Key]> }[keyof T & string]
    : never;

type ContentKeys = "title" | "text" | "description" | "hints";

const progress = {
  loops: { started: 4, completed: 1 },
  facts: { revealed: 45, total: 375 },
  unread: 12,
  signals: { revealed: 4, total: 30 },
};

const counts = { total: 30, remaining: null, reachable: 3 };

describe("dashboard view at level none", () => {
  it("has no field that can carry a title or a text", () => {
    expectTypeOf<Extract<DeepKeys<DashboardViewNone>, ContentKeys>>().toEqualTypeOf<never>();
  });

  it("does not list unvisited locations", () => {
    expectTypeOf<DashboardViewNone["locations"][number]>().not.toHaveProperty("visited");
  });

  it("accepts a view with only counts and visited names", () => {
    const view = {
      level: "none",
      ...progress,
      locations: [{ id: "TH", name: "Timber Hearth", facts: { revealed: 18, total: 19 } }],
      curiosities: [],
      achievements: counts,
    };
    expect(dashboardViewSchema.safeParse(view).success).toBe(true);
    expect(JSON.stringify(view)).not.toMatch(/"(title|text)"/);
  });

  it("rejects a title smuggled into a location", () => {
    const view = {
      level: "none",
      ...progress,
      locations: [
        { id: "TH", name: "Timber Hearth", facts: { revealed: 1, total: 2 }, title: "Village" },
      ],
      curiosities: [],
      achievements: counts,
    };
    expect(dashboardViewSchema.safeParse(view).success).toBe(false);
  });
});

describe("dashboard view at level locations", () => {
  it("still has no title or text", () => {
    expectTypeOf<Extract<DeepKeys<DashboardViewLocations>, ContentKeys>>().toEqualTypeOf<never>();
  });

  it("lists every location with a visited flag", () => {
    expectTypeOf<DashboardViewLocations["locations"][number]>().toHaveProperty("visited");
  });
});

describe("dashboard view at level titles", () => {
  it("exposes titles but never text", () => {
    expectTypeOf<Extract<DeepKeys<DashboardViewTitles>, "title">>().toEqualTypeOf<"title">();
    expectTypeOf<
      Extract<DeepKeys<DashboardViewTitles>, "text" | "description" | "hints">
    >().toEqualTypeOf<never>();
  });
});

describe("dashboard view at level full", () => {
  it("exposes text, descriptions and hints", () => {
    expectTypeOf<Extract<DeepKeys<DashboardViewFull>, ContentKeys>>().toEqualTypeOf<ContentKeys>();
  });
});
