/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WORKSPACE_OFFERED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
