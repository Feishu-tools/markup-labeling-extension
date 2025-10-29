import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    base: "./",
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        proxy: {
            '/s3-proxy': {
                target: 'https://algo-public.s3.cn-north-1.amazonaws.com.cn',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/s3-proxy/, '')
            }
        }
    },
    build: {
        rollupOptions: {
            external: ["#minpath", "#minproc", "#minurl"],
        },
    },
});
