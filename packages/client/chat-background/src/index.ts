/**
 * Chat background plugin, node half: serves a local image file over the
 * webserver under a fixed route so the browser half can reference it as a
 * CSS background URL. The route is a prefix under `/chat-background/` so the
 * browser half pins a stable path independent of the configured image file.
 * @module @deepseek-ai/dsh-client-chat-background
 */

import { createReadStream, existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import z from '@deepseek-ai/schemastery'

/** Stable Cordis plugin name. */
export const name = 'chat-background'

/** Service required before the image route can be registered. */
export const inject = ['webServer']

/** Plugin config: the local image file path. */
export interface Config {
  /** Absolute path to the image file to serve as the chat background. */
  imagePath: string
}

export const Config: z<Config> = z.object({
  imagePath: z.string().required(),
})

/** Static MIME map for image types this plugin is likely to serve. */
const IMAGE_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

/**
 * Plugin body: validate the image exists, register the route, and inject the
 * URL global into the boot page through the webserver's index tap.
 * @param ctx - Cordis context carrying the webServer service.
 * @param config - validated {@link Config}.
 */
export function apply(ctx: Context, config: Config): void {
  if (!existsSync(config.imagePath)) {
    throw new Error(`chat-background: image file not found at "${config.imagePath}"`)
  }

  const ext = extname(config.imagePath).toLowerCase()
  const mime = IMAGE_MIME[ext] ?? 'application/octet-stream'

  ctx.effect(
    () => ctx.webServer.register({
      kind: 'exact',
      path: '/chat-background/image',
      handler: async (_req, res) => {
        try {
          const { size } = await stat(config.imagePath)
          res.writeHead(200, {
            'content-type': mime,
            'content-length': size,
            'cache-control': 'no-cache',
          })
          const stream = createReadStream(config.imagePath)
          stream.pipe(res)
          stream.on('error', () => {
            res.destroy()
          })
        } catch {
          res.writeHead(404)
          res.end()
        }
      },
    }),
    'chat-background: image route',
  )
}
