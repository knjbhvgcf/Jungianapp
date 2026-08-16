import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { cmsPlugin } from './cmsPlugin.ts'
import { prerenderGuidesPlugin } from './prerenderGuides.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), cmsPlugin(env.ADMIN_PASSWORD ?? ''), prerenderGuidesPlugin()],
  }
})
