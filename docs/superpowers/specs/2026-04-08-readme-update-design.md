# README Update Design: Public Link Warning

## Goal

Update the README to clearly inform users that the plugin only works with publicly shared Figma files, and explain why private files don't work.

## Scope

- Add a prominent warning callout after the intro paragraph
- Update the Usage section to include the public sharing prerequisite
- Move "Customizable Display (Coming Soon)" from Features to a new Roadmap section
- Add a Known Limitations section explaining the auth/cookie issue
- No contributor credits section
- No changes to badges, title, or Installation section

## Structure

The README will follow this order:

1. **Title + Badges** — unchanged
2. **Intro paragraph** — unchanged
3. **Warning callout** — new `> [!WARNING]` block
4. **Features** — remove "Customizable Display (Coming Soon)"
5. **Installation** — unchanged
6. **Usage** — add public sharing step as step 1
7. **Known Limitations** — new section
8. **Roadmap** — new section

## Section Details

### Warning Callout

Placed immediately after the intro paragraph, before Features. Uses GitHub `> [!WARNING]` syntax.

Content:
- "This plugin only works with publicly shared Figma files."
- File sharing must be set to "Anyone with the link can view."
- Private or restricted files will show a fallback card instead of the live embed.

Tone: direct, factual. No technical explanation here — that goes in Known Limitations.

### Features (updated)

Keep three existing items:
- Automatic Embedding
- Seamless Integration
- Real-time Updates

Remove "Customizable Display (Coming Soon)" — moves to Roadmap.

### Usage (updated)

Add a new step 1: "Make sure your Figma file's sharing permissions are set to 'Anyone with the link can view.'"

Remaining steps shift down (copy link, paste, plugin converts, switch to Read mode).

### Known Limitations (new)

Explains why private files don't work:
- The plugin embeds Figma files using iframes.
- Figma's embed system relies on browser cookies for authentication.
- Obsidian's webview can't persist those cookies across reloads or mode switches, so private file embeds get stuck in a login loop.
- v1.0.4 added a graceful fallback card that shows file info and a link to open in the browser, but this doesn't solve the underlying cookie issue.

Include links to Figma's documentation:
- [Interact with embeds](https://help.figma.com/hc/en-us/articles/360051741274-Interact-with-embeds)
- [Embed files and prototypes](https://help.figma.com/hc/en-us/articles/360039827134-Embed-files-and-prototypes)

### Roadmap (new)

Two items:
- **Figma API Authentication** — Personal access token support to allow private file embeds without relying on browser cookies.
- **Customizable Display** — Options to adjust the size and appearance of embedded Figma previews.

## Constraints

- Keep the tone direct and clear — README, not marketing copy
- No new files beyond the README change itself
- Preserve existing badge links and installation instructions exactly as they are
