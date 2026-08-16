/**
 * Chat background plugin, browser half: makes the local image the application
 * background by (1) overriding the base background token to a translucent
 * value so the shell frame and the conversation column let the underlying
 * body background show through, and (2) pinning that body background to the
 * image URL the node half serves. Pure effect plugin — no slot contribution,
 * no store, no event listeners.
 * @module @deepseek-ai/dsh-client-chat-background/client
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the `ctx.theme` service merge (overrideTokens) through the
// ui-theme Client assembly boundary.
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'

/** The exact route the node half serves the configured image on. */
const IMAGE_URL = '/chat-background/image'

/** Translucent base so the body background image shows through the shell. */
const TRANSLUCENT_BASE = {
  light: 'rgba(247, 247, 248, 0.2)',
  dark: 'rgba(9, 9, 11, 0.2)',
} as const

/** Services required before the theme override can be applied. */
export const inject = ['theme']

/**
 * Client plugin body. The two effects own the theme-token override and the
 * injected style tag respectively; both are released on dispose.
 * @param ctx - browser Cordis context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.theme.overrideTokens('chat-background', {
    '--dsw-alias-bg-base': TRANSLUCENT_BASE,
  }), 'chat-background: translucent application base')

  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.plugin = 'chat-background'
    style.textContent = `body{background:#0b0b0d url("${IMAGE_URL}") center / cover no-repeat fixed !important;}`
    document.head.appendChild(style)
    return () => { style.remove() }
  }, 'chat-background: body background image')
}
