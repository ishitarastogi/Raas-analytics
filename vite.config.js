import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Example: "/proxy?u=<encoded url>"
      "/proxy": {
        target: "http://localhost:5173",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\?u=/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            // Allow cross-host fetch by passing full URL via ?u=
            const url = new URL(req.url, "http://x/");
            const targetUrl = url.searchParams.get("u");
            if (targetUrl) proxyReq.path = targetUrl;
          });
        },
      },
    },
  },
});
