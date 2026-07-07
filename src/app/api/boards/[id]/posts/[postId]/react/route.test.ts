import { describe, it, expect } from "vitest";
import { jsonRequest, paramsOf } from "@/test/helpers";
import { dbGet } from "@/lib/db-client";
import { POST as createBoard } from "@/app/api/boards/route";
import { POST as createPost } from "@/app/api/boards/[id]/posts/route";
import { POST as react } from "./route";

async function makeBoardAndPost() {
  const boardRes = await createBoard(jsonRequest("http://localhost/api/boards", "POST", {
    honoree_name: "React Test", title: "React Test Board", type: "birthday",
  }));
  const board = await boardRes.json();

  const postRes = await createPost(
    jsonRequest(`http://localhost/api/boards/${board.id}/posts`, "POST", {
      author_name: "Tester", message: "hello",
    }),
    { params: paramsOf({ id: board.id }) }
  );
  const post = await postRes.json();
  return { board, post };
}

function reactReq(boardId: string, postId: string, emoji: string) {
  return react(
    jsonRequest(`http://localhost/api/boards/${boardId}/posts/${postId}/react`, "POST", { emoji }),
    { params: paramsOf({ id: boardId, postId }) }
  );
}

describe("POST /api/boards/[id]/posts/[postId]/react", () => {
  it("rejects an emoji outside the allowed set", async () => {
    const { board, post } = await makeBoardAndPost();
    const res = await reactReq(board.id, post.id, "🐍");
    expect(res.status).toBe(400);
  });

  it("increments the count for a single reaction", async () => {
    const { board, post } = await makeBoardAndPost();
    const res = await reactReq(board.id, post.id, "❤️");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reactions["❤️"]).toBe(1);
  });

  // Regression test for a lost-update race: reactions_json used to be
  // updated via an unguarded read-modify-write, so concurrent reactions on
  // the same post/emoji could both read the same stale count and one
  // increment would silently vanish.
  it("does not lose updates under concurrent reactions to the same emoji", async () => {
    const { board, post } = await makeBoardAndPost();
    const N = 6;
    await Promise.all(Array.from({ length: N }, () => reactReq(board.id, post.id, "🔥")));

    const row = await dbGet<{ reactions_json: string | null }>(
      "SELECT reactions_json FROM board_posts WHERE id = ?",
      [post.id]
    );
    const reactions = JSON.parse(row?.reactions_json ?? "{}");
    expect(reactions["🔥"]).toBe(N);
  });
});
