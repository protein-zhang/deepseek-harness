/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-chat-background`.
 * @module @deepseek-ai/dsh-client-chat-background/invariant
 */

import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-chat-background'

/** Cordis companion plugin name. */
export const name = 'client-chat-background-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the plugin registers one webserver route and one
 * index tap, both disposed through the owning ctx.effect scope — no
 * cross-plugin mutable state, no store, no event listeners.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
