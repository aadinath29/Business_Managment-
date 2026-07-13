import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            // Point jspdf to the fully bundled UMD build to bypass Vite/Rolldown trying to resolve canvg -> core-js
            'jspdf': 'jspdf/dist/jspdf.umd.min.js',
        }
    }
});
