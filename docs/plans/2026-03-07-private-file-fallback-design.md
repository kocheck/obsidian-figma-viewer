# Private Figma File Fallback Design

## Problem

When a user pastes a link to a private Figma file, the iframe embed shows a "Log in to Figma" screen. Clicking login opens Obsidian's browser, but auth cookies don't flow back to the iframe. The user is stuck with a broken embed.

## Solution

Graceful fallback: render both the iframe and a fallback card. If the iframe fails to load (private/locked file), hide the iframe and show a styled card with file info and a link to open in the browser.

## How It Works

1. When a Figma link is detected, render both the iframe embed and a fallback card.
2. The fallback card is initially hidden behind/beneath the iframe.
3. Listen for Figma's `postMessage` events on the iframe.
4. If the iframe loads successfully -> keep iframe visible, fallback stays hidden.
5. If the iframe emits a `LOGIN_SCREEN_SHOWN` event -> hide iframe, show fallback card.
6. Safety net: if no message is received within ~5 seconds, show the fallback card as well.

## Fallback Card Content

- Figma logo (inline SVG)
- File name (parsed from URL path, e.g. "My-Design-File")
- File type label (derived from URL pattern: "Design File", "Prototype", "Board", etc.)
- Message: "This file is private. Open it in your browser to view."
- "Open in Figma" button that opens the original URL in the default browser

## Styling

- Uses Obsidian CSS variables (`--background-secondary`, `--text-normal`, `--text-muted`, `--interactive-accent`, `--border-color`, etc.)
- Card has a subtle border, rounded corners, centered layout
- Works in light mode, dark mode, and custom themes

## File Changes

- `src/main.ts` — add fallback logic to `figmaEmbedProcessor`, add message event listener, add helper to parse file info from URL
- `styles.css` — add styles for the fallback card using CSS variables

## Constraints

- No new dependencies
- No settings page
- No API tokens required
