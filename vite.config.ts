/// <reference types="vitest/config" />
import { execSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { prerenderLegal } from "./vite.prerender-legal";
import { licenses } from "./vite.licenses";

/** The version in crash reports: the commit (Cloudflare's build sets it; else git), else "dev". */
function build(): string {
  let sha = process.env.WORKERS_CI_COMMIT_SHA ?? "";
  if (!sha)
    try {
      sha = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
    } catch {
      /* no git: "dev" */
    }
  return sha ? sha.slice(0, 7) : "dev";
}

const page = (name: string) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

export default defineConfig({
  define: { __BUILD__: JSON.stringify(build()) },
  plugins: [
    react(),
    tailwindcss(),
    prerenderLegal(),
    licenses(),
    /* Offline support. The app shell is precached; the catalogue and fonts are served from the cache
       and refreshed in the background. Nothing the user enters passes through here: it stays in localStorage. */
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      manifest: {
        name: "From A to Job",
        short_name: "A2J",
        id: "/",
        description:
          "Find out what you are good at, choose a job to aim for, and create a one-page plan to take to your meeting. Everything stays on your device.",
        start_url: "./#home",
        scope: "./",
        display: "standalone",
        orientation: "any",
        background_color: "#f3f1eb",
        theme_color: "#f3f1eb",
        lang: "en",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,svg,png,webmanifest}"],
        globIgnores: [
          "esco/**",
          "**/*-{cyrillic,cyrillic-ext,vietnamese,greek,greek-ext,hebrew,math,symbols}-*",
        ],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/(impressum|datenschutz|credits)\.html/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/esco/"),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "a2j-catalogue", expiration: { maxEntries: 8 } },
          },
        ],
      },
    }),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        main: page("index"),
        impressum: page("impressum"),
        datenschutz: page("datenschutz"),
        credits: page("credits"),
      },
    },
  },
  server: { port: 5173 },
  preview: { port: 8765 },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
