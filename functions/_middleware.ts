const canonicalHost = "typing.zhoulianglen.com";
const legacyHosts = new Set([
  "dazi.zhoulianglen.com",
  "dazi.imzl.com",
  "dazi-drs.pages.dev",
]);

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
}): Promise<Response> {
  const url = new URL(context.request.url);
  if (legacyHosts.has(url.hostname)) {
    url.protocol = "https:";
    url.hostname = canonicalHost;
    url.port = "";
    return Response.redirect(url.href, 301);
  }
  const response = await context.next();
  if (url.hostname.endsWith(".dazi-drs.pages.dev")) {
    const preview = new Response(response.body, response);
    preview.headers.set("X-Robots-Tag", "noindex, nofollow");
    return preview;
  }
  return response;
}
