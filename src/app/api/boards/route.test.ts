import { describe, it, expect } from "vitest";
import { jsonRequest } from "@/test/helpers";
import { POST as createBoard } from "./route";

describe("POST /api/boards — requires_gift_approval default", () => {
  // Regression test for a bug where this defaulted to true (required) unless
  // the client explicitly sent `false` — backwards from the schema's own
  // DEFAULT 0, and never sent at all by the create-board form.
  it("defaults to not requiring approval when the field is omitted", async () => {
    const res = await createBoard(jsonRequest("http://localhost/api/boards", "POST", {
      honoree_name: "Test Person",
      title: "Test Board",
      type: "birthday",
    }));
    expect(res.status).toBe(201);
    const board = await res.json();
    expect(board.requires_gift_approval).toBe(0);
  });

  it("still respects an explicit true", async () => {
    const res = await createBoard(jsonRequest("http://localhost/api/boards", "POST", {
      honoree_name: "Test Person 2",
      title: "Test Board 2",
      type: "birthday",
      requires_gift_approval: true,
    }));
    expect(res.status).toBe(201);
    const board = await res.json();
    expect(board.requires_gift_approval).toBe(1);
  });
});
