import { expect, it } from "vitest";
import { readBoundedResponse } from "../../../../../workers/image-processing/src/providers/read-bounded-response";

it("rejects empty bodies, declared oversize and streamed oversize", async () => {
  expect(await readBoundedResponse(new Response(null), 2)).toBeNull();
  expect(
    await readBoundedResponse(
      new Response("a", { headers: { "content-length": "3" } }),
      2,
    ),
  ).toBeNull();
  expect(await readBoundedResponse(new Response("abc"), 2)).toBeNull();
  expect(await readBoundedResponse(new Response("ab"), 2)).toEqual(
    new TextEncoder().encode("ab"),
  );
});
