import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { lingui } from "@lingui/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',      // 或 '127.0.0.1'
    port: 5173,
  },
  plugins: [react(
    {
      babel: {
        plugins: ["@lingui/babel-plugin-lingui-macro"],
      },
    },
  ),
  lingui(),
    , tsconfigPaths()],
})
