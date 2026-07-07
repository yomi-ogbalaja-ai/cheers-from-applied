import { describe, it, expect } from "vitest";
import { str, optStr, isEmail, parseJson, badRequest, serverError } from "./validate";

describe("str", () => {
  it("trims and returns valid strings", () => {
    expect(str("  hello  ")).toBe("hello");
  });

  it("rejects non-strings", () => {
    expect(str(42)).toBeNull();
    expect(str(null)).toBeNull();
    expect(str(undefined)).toBeNull();
    expect(str({})).toBeNull();
  });

  it("rejects empty or whitespace-only strings", () => {
    expect(str("")).toBeNull();
    expect(str("   ")).toBeNull();
  });

  it("enforces the max length after trimming", () => {
    expect(str("ab", 2)).toBe("ab");
    expect(str("abc", 2)).toBeNull();
    expect(str("  abc  ", 3)).toBe("abc");
  });
});

describe("optStr", () => {
  it("treats undefined, null, and empty string as absent", () => {
    expect(optStr(undefined)).toBeNull();
    expect(optStr(null)).toBeNull();
    expect(optStr("")).toBeNull();
  });

  it("otherwise behaves like str", () => {
    expect(optStr("hello")).toBe("hello");
    expect(optStr("toolong", 3)).toBeNull();
    expect(optStr(42)).toBeNull();
  });
});

describe("isEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("jordan.smith@applied.co")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isEmail("not-an-email")).toBe(false);
    expect(isEmail("missing-domain@")).toBe(false);
    expect(isEmail("@missing-local.com")).toBe(false);
    expect(isEmail("has spaces@example.com")).toBe(false);
  });

  it("rejects non-strings and oversized addresses", () => {
    expect(isEmail(42)).toBe(false);
    expect(isEmail(null)).toBe(false);
    expect(isEmail("a@" + "b".repeat(254) + ".com")).toBe(false);
  });
});

describe("parseJson", () => {
  it("parses a valid JSON object body", async () => {
    const req = new Request("http://x", { method: "POST", body: JSON.stringify({ a: 1 }) });
    await expect(parseJson(req)).resolves.toEqual({ a: 1 });
  });

  it("returns null for invalid JSON", async () => {
    const req = new Request("http://x", { method: "POST", body: "not json" });
    await expect(parseJson(req)).resolves.toBeNull();
  });

  it("returns null for non-object JSON (array, string, number)", async () => {
    const arrayReq = new Request("http://x", { method: "POST", body: "[1,2,3]" });
    await expect(parseJson(arrayReq)).resolves.toBeNull();

    const numReq = new Request("http://x", { method: "POST", body: "42" });
    await expect(parseJson(numReq)).resolves.toBeNull();
  });
});

describe("badRequest / serverError", () => {
  it("badRequest returns a 400 with the given message", async () => {
    const res = badRequest("nope");
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "nope" });
  });

  it("serverError defaults to a generic 500 message", async () => {
    const res = serverError();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Something went wrong" });
  });
});
