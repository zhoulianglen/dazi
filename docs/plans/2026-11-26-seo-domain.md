# SEO and canonical domain migration

User request: improve search titles/descriptions/keywords and push code. User explicitly chose `typing.zhoulianglen.com` from the proposed domain options.

## Implementation

- Centralized bilingual metadata, build-time HTML injection and synchronized runtime locale updates. Use descriptive touch-typing terms without repeated keyword lists in titles.
- One canonical URL, matching og:url, absolute image URL, 1200 × 630 original social image, favicon, apple-touch icon and valid WebSite/WebApplication JSON-LD with no fabricated ratings.
- Crawlable production robots/sitemap and development-only noindex. Keep the existing KeyKey-like app UI; add a meaningful accessible heading and useful no-JavaScript fallback.
- Cloudflare Pages project `dazi` already belongs to this repository and deploys `main`. Existing build command and output directory were empty, resulting in a raw `/src/main.ts` HTML entry. Corrected build settings to `npm run build` / `dist`.
- Associate `typing.zhoulianglen.com` with that same project and point its proxied CNAME to `dazi-drs.pages.dev`. DNS API token lacks the DNS scope, so use the already authenticated Chrome Cloudflare console for the new record without modifying unrelated records.
- Use Pages Functions middleware for permanent redirects from previous DAZI hostnames and the Pages production hostname to the canonical domain. Preserve paths and query strings in redirects. Host-level sources are unsupported in Pages `_redirects`. Keep hash/branch previews explicitly noindex and avoid overriding the default with a global positive indexing header. Keep typed progress local to each browser origin; backups remain available.

## Validation

Metadata behavior tests cover singleton tags, canonical/social URL agreement, locale changes, honest schema and preview noindex. Production verification must check the new HTTPS hostname, redirects, response indexing policy, built JavaScript and social/crawl assets after push and deployment. No ranking or indexing outcome is promised.
