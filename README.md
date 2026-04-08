# Obsidian Figma Embed Plugin


[![GitHub issues](https://img.shields.io/github/issues/kocheck/obsidian-figma-viewer)](https://github.com/kocheck/obsidian-figma-viewer/issues)
![GitHub](https://img.shields.io/github/license/kocheck/obsidian-figma-viewer?color=blue)
![GitHub Maintained](https://img.shields.io/badge/Open%20Source-Yes-green)
![GitHub last commit](https://img.shields.io/github/last-commit/kocheck/obsidian-figma-viewer)
![GitHub contributors](https://img.shields.io/github/contributors/kocheck/obsidian-figma-viewer)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/kocheck/obsidian-figma-viewer)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/kocheck/obsidian-figma-viewer)
![GitHub Release Date](https://img.shields.io/github/release-date/kocheck/obsidian-figma-viewer)

---

The Obsidian Figma Embed plugin allows you to seamlessly integrate Figma designs into your Obsidian notes. Simply paste a Figma link, and the plugin will automatically generate an inline preview, making your design workflow smoother and more visual.

> [!WARNING]
> **This plugin only works with publicly shared Figma files.** Your Figma file's sharing permissions must be set to "Anyone with the link can view." Private or restricted files will show a fallback card instead of the live embed.

## Features

- **Automatic Embedding**: Converts Figma links into interactive, inline previews.
- **Seamless Integration**: Works directly within your Obsidian markdown files.
- **Real-time Updates**: Previews update automatically when changes are made in Figma.

## Installation

1. Open Obsidian and go to Settings.
2. Navigate to Community Plugins and disable Safe Mode.
3. Click on Browse and search for "Figma Embed".
4. Click Install, then Enable the plugin.

## Usage

1. Make sure your Figma file's sharing permissions are set to "Anyone with the link can view."
2. Copy a Figma link (e.g., https://www.figma.com/design/...)
3. Paste the link into your Obsidian note.
4. The plugin will automatically convert the link into an embedded preview.
5. Switch to Read mode in Obsidian to view and interact with the embedded Figma design.

## Known Limitations

This plugin embeds Figma files using iframes. Figma's embed system relies on browser cookies to maintain authentication, but Obsidian's webview can't persist those cookies across reloads or mode switches. This means private file embeds get stuck in a login loop that can't be authenticated from within Obsidian.

As of v1.0.4, the plugin shows a graceful fallback card with file info and a link to open in your browser when an embed fails to load. This doesn't solve the underlying cookie issue — the file must be publicly shared.

For more details on how Figma handles embed authentication:
- [Interact with embeds](https://help.figma.com/hc/en-us/articles/360051741274-Interact-with-embeds)
- [Embed files and prototypes](https://help.figma.com/hc/en-us/articles/360039827134-Embed-files-and-prototypes)

## Roadmap

- **Figma API Authentication** — Personal access token support to allow private file embeds without relying on browser cookies.
- **Customizable Display** — Options to adjust the size and appearance of embedded Figma previews.
