import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

function worker() {
  const handlers: Record<string, (event: unknown) => void> = {};
  const responses = new Map<string, Response>();
  let network: () => Promise<Response> = async () =>
    new Response("fresh", { headers: { "cache-control": "public" } });
  let nested = false;
  const source = readFileSync(new URL("../src/sw.js", import.meta.url), "utf8").replace(
    '"__ASSETS__"',
    "[]",
  );
  runInNewContext(source, {
    URL,
    Response,
    fetch: () => network(),
    self: {
      location: { origin: "https://halo.test" },
      clients: { get: async () => ({ frameType: nested ? "nested" : "top-level" }) },
      addEventListener: (name: string, handler: (event: unknown) => void) => {
        handlers[name] = handler;
      },
    },
    caches: {
      open: async () => ({
        match: async (r: Request) => responses.get(r.url)?.clone(),
        put: async (r: Request, value: Response) => {
          responses.set(r.url, value);
        },
        delete: async (r: Request) => responses.delete(r.url),
        keys: async () => [...responses.keys()].map((url) => new Request(url)),
      }),
    },
  });
  return {
    responses,
    offline() {
      network = async () => {
        throw new Error("offline");
      };
    },
    private() {
      network = async () =>
        new Response("private", { headers: { "cache-control": "private, no-store" } });
    },
    nested() {
      nested = true;
    },
    fetch(request: Request) {
      let response: Promise<Response> | undefined;
      handlers["fetch"]!({
        request,
        clientId: "client",
        respondWith: (value: Promise<Response>) => {
          response = value;
        },
      });
      return response;
    },
  };
}

test("public GET data uses network first and cached response only when offline", async () => {
  const sw = worker();
  const request = new Request("https://halo.test/api/data");
  sw.responses.set(request.url, new Response("old"));
  assert.equal(await (await sw.fetch(request))!.text(), "fresh");
  sw.offline();
  assert.equal(await (await sw.fetch(request))!.text(), "fresh");
});

test("private responses evict old data and cannot be read offline", async () => {
  const sw = worker();
  const request = new Request("https://halo.test/api/data");
  sw.responses.set(request.url, new Response("old"));
  sw.private();
  assert.equal(await (await sw.fetch(request))!.text(), "private");
  assert.equal(sw.responses.size, 0);
  sw.offline();
  assert.equal((await sw.fetch(request))!.type, "error");
});

test("worker bypasses mutations, authorization and third-party requests", () => {
  const sw = worker();
  assert.equal(sw.fetch(new Request("https://halo.test/api", { method: "POST" })), undefined);
  assert.equal(
    sw.fetch(new Request("https://halo.test/api", { headers: { authorization: "test" } })),
    undefined,
  );
  assert.equal(sw.fetch(new Request("https://other.test/api")), undefined);
});

test("nested preview clients never populate the app cache", async () => {
  const sw = worker();
  sw.nested();
  assert.equal(await (await sw.fetch(new Request("https://halo.test/api")))!.text(), "fresh");
  assert.equal(sw.responses.size, 0);
});
