// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { onRequest } from "../functions/_middleware";

describe("canonical host migration", () => {
  it.each(["dazi.zhoulianglen.com", "dazi.imzl.com", "dazi-drs.pages.dev"])(
    "permanently redirects %s with its path and query intact", async (host) => {
      const next = vi.fn();
      const response = await onRequest({ request: new Request(`https://${host}/practice?lang=en&lesson=2`), next });
      expect(response.status).toBe(301);
      expect(response.headers.get("location")).toBe("https://typing.zhoulianglen.com/practice?lang=en&lesson=2");
      expect(next).not.toHaveBeenCalled();
    },
  );
  it("serves the canonical host without a redirect loop", async () => {
    const page = new Response("typing");
    const response = await onRequest({ request: new Request("https://typing.zhoulianglen.com/"), next: async () => page });
    expect(response).toBe(page);
    expect(response.headers.get("x-robots-tag")).toBeNull();
  });
  it.each(["a1b2c3.dazi-drs.pages.dev", "codex-desktop-typing-tutor.dazi-drs.pages.dev"])(
    "keeps %s accessible but excludes it from indexing", async (host) => {
      const response = await onRequest({ request: new Request(`https://${host}/`), next: async () => new Response("preview") });
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      expect(await response.text()).toBe("preview");
    },
  );
});
