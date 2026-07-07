import { NextRequest } from "next/server";

export function jsonRequest(
  url: string,
  method: string,
  body?: unknown,
  extraHeaders: Record<string, string> = {}
) {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function paramsOf<T extends Record<string, string>>(obj: T): Promise<T> {
  return Promise.resolve(obj);
}
