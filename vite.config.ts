import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { cmsPlugin } from './cmsPlugin.ts'
import { prerenderGuidesPlugin } from './prerenderGuides.ts'
import { typeCensusPlugin } from './typeCensusPlugin.ts'
import { workspaceAccountPlugin } from './workspaceAccountPlugin.ts'
import { workspaceStripePlugin } from './workspaceStripePlugin.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      cmsPlugin(env.ADMIN_PASSWORD ?? ''),
      typeCensusPlugin(env.ADMIN_PASSWORD ?? ''),
      workspaceStripePlugin({
        STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
        STRIPE_WORKSPACE_PRICE_ID: env.STRIPE_WORKSPACE_PRICE_ID,
      }),
      workspaceAccountPlugin({
        SESSION_SECRET: env.SESSION_SECRET?.trim() || 'jung-workspace-session',
        RESEND_API_KEY: env.RESEND_API_KEY,
        RESEND_FROM: env.RESEND_FROM,
        STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
        STRIPE_WORKSPACE_PRICE_ID: env.STRIPE_WORKSPACE_PRICE_ID,
        STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
      }),
      prerenderGuidesPlugin(),
    ],
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
  }
})
