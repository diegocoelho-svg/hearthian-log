import { describe, expect, it } from "vitest";
import { mainToRenderer, rendererToMain } from "./ipc.ts";

describe("ipc contracts", () => {
  it("validates a toast without content at any level", () => {
    expect(mainToRenderer["toast:show"].safeParse({ kind: "fact-revealed" }).success).toBe(true);
    expect(
      mainToRenderer["toast:show"].safeParse({
        kind: "fact-revealed-at",
        locationId: "BH",
        locationName: "Brittle Hollow",
      }).success,
    ).toBe(true);
    expect(
      mainToRenderer["toast:show"].safeParse({ kind: "fact-revealed", title: "A fact" }).success,
    ).toBe(false);
  });

  it("routes an overlay view through the same channel as the dashboard", () => {
    const overlay = {
      kind: "overlay",
      loops: { started: 4, completed: 1 },
      facts: { revealed: 45, total: 375 },
      unread: 2,
    };
    expect(mainToRenderer["view:update"].safeParse(overlay).success).toBe(true);
  });

  it("only accepts a hint layer between 1 and 3 on achievement:reveal", () => {
    const request = rendererToMain["achievement:reveal"].request;
    expect(request.safeParse({ id: "ACH_X", layer: 1 }).success).toBe(true);
    expect(request.safeParse({ id: "ACH_X", layer: 0 }).success).toBe(false);
    expect(request.safeParse({ id: "ACH_X", layer: 4 }).success).toBe(false);
  });

  it("caps the revealed hints at three", () => {
    const response = rendererToMain["achievement:reveal"].response;
    expect(
      response.safeParse({ id: "ACH_X", name: "Moonwalker", layer: 1, hints: ["a"] }).success,
    ).toBe(true);
    expect(
      response.safeParse({ id: "ACH_X", name: "Moonwalker", layer: 3, hints: ["a", "b", "c", "d"] })
        .success,
    ).toBe(false);
  });

  it("takes no payload on settings:get and save:pick-path", () => {
    expect(rendererToMain["settings:get"].request.safeParse(undefined).success).toBe(true);
    expect(rendererToMain["save:pick-path"].request.safeParse({}).success).toBe(false);
  });
});
