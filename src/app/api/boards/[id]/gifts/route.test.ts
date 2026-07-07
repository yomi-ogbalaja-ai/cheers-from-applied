import { describe, it, expect } from "vitest";
import { jsonRequest, paramsOf } from "@/test/helpers";
import { POST as createBoard } from "@/app/api/boards/route";
import { POST as createGift, PATCH as patchGift } from "./route";

async function makeBoard(overrides: Record<string, unknown> = {}) {
  const res = await createBoard(jsonRequest("http://localhost/api/boards", "POST", {
    honoree_name: "Gift Test",
    title: "Gift Test Board",
    type: "birthday",
    ...overrides,
  }));
  return res.json();
}

function giftReq(boardId: string, body: unknown) {
  return createGift(
    jsonRequest(`http://localhost/api/boards/${boardId}/gifts`, "POST", body),
    { params: paramsOf({ id: boardId }) }
  );
}

describe("POST /api/boards/[id]/gifts — validation", () => {
  it("rejects a gift with no from_email", async () => {
    const board = await makeBoard();
    const res = await giftReq(board.id, { from_name: "Alex", amount: 2 });
    expect(res.status).toBe(400);
  });

  it("rejects a gift with an invalid from_email", async () => {
    const board = await makeBoard();
    const res = await giftReq(board.id, { from_name: "Alex", from_email: "not-an-email", amount: 2 });
    expect(res.status).toBe(400);
  });

  it("rejects an amount over the 8 hour cap", async () => {
    const board = await makeBoard();
    const res = await giftReq(board.id, { from_name: "Alex", from_email: "alex@applied.co", amount: 9 });
    expect(res.status).toBe(400);
  });

  it("rejects a negative amount", async () => {
    const board = await makeBoard();
    const res = await giftReq(board.id, { from_name: "Alex", from_email: "alex@applied.co", amount: -5 });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/boards/[id]/gifts — approval + per-giver cap", () => {
  it("auto-approves when the board doesn't require approval", async () => {
    const board = await makeBoard({ requires_gift_approval: false });
    const res = await giftReq(board.id, { from_name: "Alex", from_email: "alex@applied.co", amount: 4 });
    expect(res.status).toBe(201);
    const gift = await res.json();
    expect(gift.status).toBe("approved");
  });

  it("leaves gifts pending when the board requires approval", async () => {
    const board = await makeBoard({ requires_gift_approval: true, gift_manager_email: "mgr@applied.co" });
    const res = await giftReq(board.id, { from_name: "Alex", from_email: "alex@applied.co", amount: 4 });
    const gift = await res.json();
    expect(gift.status).toBe("pending");
  });

  it("enforces the 8 hour cap across multiple gifts from the same giver", async () => {
    const board = await makeBoard();
    const first = await giftReq(board.id, { from_name: "Alex", from_email: "alex2@applied.co", amount: 5 });
    expect(first.status).toBe(201);

    const second = await giftReq(board.id, { from_name: "Alex", from_email: "alex2@applied.co", amount: 4 });
    expect(second.status).toBe(400);
  });

  // Regression test for a TOCTOU race: the cap check and insert used to be a
  // separate SELECT then INSERT, so concurrent requests from the same giver
  // could both read the same stale total and both slip under the cap.
  it("does not let concurrent gifts from the same giver exceed the cap", async () => {
    const board = await makeBoard();
    const results = await Promise.all(
      Array.from({ length: 4 }, () => giftReq(board.id, { from_name: "Alex", from_email: "alex3@applied.co", amount: 3 }))
    );
    const accepted = results.filter(r => r.status === 201).length;
    // 4 x 3hr requests against an 8hr cap: at most 2 can be accepted (6hr <= 8hr, 9hr > 8hr).
    expect(accepted).toBeLessThanOrEqual(2);
  });
});

describe("PATCH /api/boards/[id]/gifts — approval authorization", () => {
  async function makeBoardWithPendingGift() {
    const board = await makeBoard({ requires_gift_approval: true, gift_manager_email: "mgr@applied.co" });
    const giftRes = await giftReq(board.id, { from_name: "Alex", from_email: "alex4@applied.co", amount: 2 });
    const gift = await giftRes.json();
    return { board, gift };
  }

  it("rejects approval from someone who isn't the designated gift manager", async () => {
    const { board, gift } = await makeBoardWithPendingGift();
    const res = await patchGift(
      jsonRequest(`http://localhost/api/boards/${board.id}/gifts`, "PATCH", {
        giftId: gift.id, action: "approve", approved_by: "random-person@applied.co",
      }),
      { params: paramsOf({ id: board.id }) }
    );
    expect(res.status).toBe(403);
  });

  it("allows approval from the designated gift manager", async () => {
    const { board, gift } = await makeBoardWithPendingGift();
    const res = await patchGift(
      jsonRequest(`http://localhost/api/boards/${board.id}/gifts`, "PATCH", {
        giftId: gift.id, action: "approve", approved_by: "mgr@applied.co",
      }),
      { params: paramsOf({ id: board.id }) }
    );
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.status).toBe("approved");
  });

  it("rejects approval when the board has no designated gift manager", async () => {
    const board = await makeBoard({ requires_gift_approval: true });
    const giftRes = await giftReq(board.id, { from_name: "Alex", from_email: "alex5@applied.co", amount: 2 });
    const gift = await giftRes.json();
    const res = await patchGift(
      jsonRequest(`http://localhost/api/boards/${board.id}/gifts`, "PATCH", {
        giftId: gift.id, action: "approve", approved_by: "anyone@applied.co",
      }),
      { params: paramsOf({ id: board.id }) }
    );
    expect(res.status).toBe(403);
  });
});
