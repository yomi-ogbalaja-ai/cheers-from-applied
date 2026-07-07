import { describe, it, expect, beforeAll } from "vitest";
import { jsonRequest } from "@/test/helpers";
import { POST as createBoard } from "@/app/api/boards/route";
import { GET as nudge } from "./route";

const CRON_SECRET = "test-cron-secret";

function nudgeReq() {
  return jsonRequest("http://localhost/api/cron/nudge", "GET", undefined, {
    authorization: `Bearer ${CRON_SECRET}`,
  });
}

describe("GET /api/cron/nudge", () => {
  beforeAll(() => {
    process.env.CRON_SECRET = CRON_SECRET;
  });

  it("rejects requests without the correct bearer token", async () => {
    const res = await nudge(jsonRequest("http://localhost/api/cron/nudge", "GET"));
    expect(res.status).toBe(401);
  });

  // Regression test: this used to query `WHERE status = 'open'`, but every
  // board is created with status = 'active' — so it matched zero boards,
  // ever, and the "closing soon" reminder silently never fired.
  it("counts an active board expiring within 3 days", async () => {
    const before = await nudge(nudgeReq());
    const beforeCount = (await before.json()).boards_checked;

    const boardRes = await createBoard(jsonRequest("http://localhost/api/boards", "POST", {
      honoree_name: "Nudge Test",
      title: "Nudge Test Board",
      type: "birthday",
      close_days: 1,
    }));
    expect(boardRes.status).toBe(201);
    const board = await boardRes.json();
    expect(board.status).toBe("active");

    const after = await nudge(nudgeReq());
    const afterCount = (await after.json()).boards_checked;
    expect(afterCount).toBe(beforeCount + 1);
  });

  it("does not count a board expiring more than 3 days out", async () => {
    const before = await nudge(nudgeReq());
    const beforeCount = (await before.json()).boards_checked;

    await createBoard(jsonRequest("http://localhost/api/boards", "POST", {
      honoree_name: "Far Out Test",
      title: "Far Out Test Board",
      type: "birthday",
      close_days: 30,
    }));

    const after = await nudge(nudgeReq());
    const afterCount = (await after.json()).boards_checked;
    expect(afterCount).toBe(beforeCount);
  });
});
