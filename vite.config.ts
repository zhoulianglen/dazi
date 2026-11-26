import { defineConfig } from "vite";
import { renderSeoHead } from "./src/tutor/seo";
export default defineConfig({
  // Relative URLs work on the canonical custom domain and the GitHub Pages mirror.
  base: "./",
  plugins: [
    {
      name: "dazi-seo",
      transformIndexHtml(html, context) {
        return html.replace(
          "<!-- SEO_METADATA -->",
          renderSeoHead(!context.server),
        );
      },
    },
  ],
  build: { target: "es2022", sourcemap: true },
});
