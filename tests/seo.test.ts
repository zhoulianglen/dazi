import { beforeEach, describe, expect, it } from "vitest";
import { applyLocaleMetadata, renderSeoHead, SITE_URL } from "../src/tutor/seo";
beforeEach(() => {
  document.head.innerHTML = "";
});
describe("search and share metadata", () => {
  it("renders one consistent canonical, title and social URL for the chosen domain", () => {
    document.head.innerHTML = renderSeoHead();
    expect(document.querySelectorAll("title")).toHaveLength(1);
    expect(document.title).toContain("在线打字练习");
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(
      1,
    );
    expect(
      document.querySelector('link[rel="canonical"]')!.getAttribute("href"),
    ).toBe("https://typing.zhoulianglen.com/");
    expect(
      document
        .querySelector('meta[property="og:url"]')!
        .getAttribute("content"),
    ).toBe(SITE_URL);
    expect(
      document
        .querySelector('meta[property="og:image"]')!
        .getAttribute("content"),
    ).toBe(SITE_URL + "og-image.png");
    expect(
      document.querySelector('meta[name="robots"]')!.getAttribute("content"),
    ).not.toContain("noindex");
  });
  it("keeps title, description and social copy localized without duplicate tags", () => {
    document.head.innerHTML = renderSeoHead();
    applyLocaleMetadata("en");
    applyLocaleMetadata("zh");
    applyLocaleMetadata("en");
    expect(document.title).toContain("Touch Typing");
    expect(
      document
        .querySelector('meta[name="description"]')!
        .getAttribute("content"),
    ).toContain("Chinese");
    expect(
      document
        .querySelector('meta[property="og:title"]')!
        .getAttribute("content"),
    ).toBe(document.title);
    expect(
      document
        .querySelector('meta[property="og:locale"]')!
        .getAttribute("content"),
    ).toBe("en_US");
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(
      1,
    );
    expect(
      document.querySelector('link[rel="canonical"]')!.getAttribute("href"),
    ).toBe(SITE_URL);
  });
  it("describes a real free web application without fabricated ratings", () => {
    document.head.innerHTML = renderSeoHead();
    const graph = JSON.parse(
      document.querySelector('script[type="application/ld+json"]')!
        .textContent!,
    );
    const app = graph["@graph"].find(
      (item: { "@type": string }) => item["@type"] === "WebApplication",
    );
    expect(app.url).toBe(SITE_URL);
    expect(app.isAccessibleForFree).toBe(true);
    expect(app.aggregateRating).toBeUndefined();
  });
  it("marks the development preview as non-indexable", () => {
    document.head.innerHTML = renderSeoHead(false);
    expect(
      document.querySelector('meta[name="robots"]')!.getAttribute("content"),
    ).toBe("noindex, nofollow");
  });
});
