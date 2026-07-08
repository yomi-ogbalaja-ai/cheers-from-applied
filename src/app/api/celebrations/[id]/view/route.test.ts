import { describe, it, expect } from "vitest";
import { jsonRequest, paramsOf } from "@/test/helpers";
import { dbAll } from "@/lib/db-client";
import { POST as createBoard } from "@/app/api/boards/route";
import { POST as recordView } from "./route";

async function makeBoard() {
  const res = await createBoard(jsonRequest("http://localhost/api/boards", "POST", {
    honoree_name: "View Test", title: "View Test Board", type: "birthday",
  }));
  return res.json();
}

function viewReq(boardId: string, sessionId: string) {
  return recordView(
    jsonRequest(`http://localhost/api/celebrations/${boardId}/view`, "POST", { session_id: sessionId }),
    { params: paramsOf({ id: boardId }) }
  );
}

describe("POST /api/celebrations/[id]/view", () => {
  it("404s for a board that doesn't exist", async () => {
    const res = await viewReq("no-such-board", "session-1");
    expect(res.status).toBe(404);
  });

  it("rejects a missing session_id", async () => {
    const board = await makeBoard();
    const res = await recordView(
      jsonRequest(`http://localhost/api/celebrations/${board.id}/view`, "POST", {}),
      { params: paramsOf({ id: board.id }) }
    );
    expect(res.status).toBe(400);
  });

  it("records a view for a new session", async () => {
    const board = await makeBoard();
    const res = await viewReq(board.id, "session-1");
    expect(res.status).toBe(201);

    const rows = await dbAll("SELECT * FROM celebration_views WHERE board_id = ?", [board.id]);
    expect(rows.length).toBe(1);
  });

  it("dedupes repeat views from the same session", async () => {
    const board = await makeBoard();
    await viewReq(board.id, "session-1");
    await viewReq(board.id, "session-1");
    await viewReq(board.id, "session-1");

    const rows = await dbAll("SELECT * FROM celebration_views WHERE board_id = ?", [board.id]);
    expect(rows.length).toBe(1);
  });

  it("counts distinct sessions separately", async () => {
    const board = await makeBoard();
    await viewReq(board.id, "session-1");
    await viewReq(board.id, "session-2");

    const rows = await dbAll("SELECT * FROM celebration_views WHERE board_id = ?", [board.id]);
    expect(rows.length).toBe(2);
  });
});
