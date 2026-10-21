import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://example.com",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark-default",
      wrap: true,
    },
  },
});
