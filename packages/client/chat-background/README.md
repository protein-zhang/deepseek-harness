# @deepseek-ai/dsh-client-chat-background

Chat background via plugins. The node half serves a local image over the
webserver and the browser half pins it as the application background, so the
chat surface can carry a custom image without editing any existing UI.

## How it works

Two halves of one plugin package:

- **Node half** (`src/index.ts`): reads `config.imagePath`, validates the file
  exists, and registers an exact webserver route `/chat-background/image` that
  streams the file with the right image MIME type.
- **Browser half** (`src/client/index.ts`): overrides the `--dsw-alias-bg-base`
  theme token to a translucent value (so the shell frame and the conversation
  column let the underlying body background show through) and injects a style
  tag pinning `body`'s background to `/chat-background/image`.

## Why a translucent base token

The chat background is stacked from three opaque layers — `body`, the shell
frame (`.frame`), and the conversation column — all painted with the same
`--dsw-alias-bg-base` token. Instead of targeting hashed CSS-module class
names an external plugin cannot select, the browser half overrides that single
token to a translucent color. Every base surface turns translucent, and the
image on `body` shows through. Semantic surfaces (message bubbles, sidebar)
use distinct tokens and stay opaque, so text remains readable.

## Configuration

Register the row in a `cordis.patch.yml` (the web-app bundle already does) and
point `imagePath` at a local image:

```yaml
- id: chat-background
  name: '@deepseek-ai/dsh-client-chat-background'
  config:
    imagePath: 'D:/path/to/preview.jpg'
```

## Model Experience

None. The plugin touches no model request; it only serves a static asset and
injects browser-side CSS.

## Known Limitations and Deferred Work

- **Global base translucency** — the override affects every surface painted
  with `--dsw-alias-bg-base`, not just the chat column. Restricting the image
  to the conversation column alone would require a stable frame selector that
  the current shell does not expose.
- **Fixed route** — the browser half hardcodes `/chat-background/image`; the
  node half always serves that exact path, so the two stay in sync.