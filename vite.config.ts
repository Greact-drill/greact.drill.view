import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router-dom") || id.includes("react-dom") || id.includes("/react/")) {
            return "react";
          }
          if (id.includes("@tanstack/react-query") || id.includes("/axios/")) {
            return "query";
          }
          if (id.includes("echarts")) {
            return "echarts";
          }
          if (id.includes("chart.js") || id.includes("react-chartjs-2")) {
            return "chartjs";
          }
          if (id.includes("hls.js")) {
            return "video";
          }
          return undefined;
        },
      },
    },
  },
  preview: {
    port: 4000,
  },
});
