import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Same phone-signaling API that the Electron app serves, so `npm run dev`
// (plain browser mode) can pair with phones too.
function netshareSignaling() {
  return {
    name: "netshare-signaling",
    configureServer(server) {
      const { createApiHandler } = require("./electron/server.cjs");
      const api = createApiHandler();
      server.middlewares.use((req, res, next) => {
        if (!api(req, res)) next();
      });
    },
    configurePreviewServer(server) {
      const { createApiHandler } = require("./electron/server.cjs");
      const api = createApiHandler();
      server.middlewares.use((req, res, next) => {
        if (!api(req, res)) next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), netshareSignaling()],
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
});
