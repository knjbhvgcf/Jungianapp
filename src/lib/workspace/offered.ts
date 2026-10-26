/** Local and staging only until launch. Production builds omit the routes. */
export const WORKSPACE_OFFERED =
  import.meta.env.DEV || import.meta.env.VITE_WORKSPACE_OFFERED === 'true'

export const WORKSPACE_PATH = '/workspace'
export const WORKSPACE_JOIN_PATH = '/workspace/join'
export const WORKSPACE_KEEP_PATH = '/workspace/keep'
export const WORKSPACE_PRICE = '$10 USD'
export const WORKSPACE_PRICE_LINE = `7 days free, then ${WORKSPACE_PRICE}/month`
export const WORKSPACE_NAME = 'Jungology App'

export function workspaceUnlocked(house: { plan?: string } | null) {
  return house?.plan === 'active'
}
