# README Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update README.md to warn users that only publicly shared Figma files work, explain the technical limitation, and add Roadmap section.

**Architecture:** Single-file edit to README.md. Four changes: add warning callout after intro, update features and usage sections, add Known Limitations and Roadmap sections at the end.

**Tech Stack:** Markdown (GitHub-flavored with `> [!WARNING]` callout syntax)

---

### Task 1: Add warning callout after intro paragraph

**Files:**
- Modify: `README.md:15` (after the intro paragraph, before `## Features`)

- [ ] **Step 1: Add the warning callout block**

Insert the following block between the intro paragraph (line 15) and `## Features` (line 17):

```markdown
> [!WARNING]
> **This plugin only works with publicly shared Figma files.** Your Figma file's sharing permissions must be set to "Anyone with the link can view." Private or restricted files will show a fallback card instead of the live embed.
```

- [ ] **Step 2: Verify the change renders correctly**

Open README.md and confirm the warning block sits between the intro paragraph and the Features heading, with blank lines separating it from both.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add public link warning callout to README"
```

---

### Task 2: Update Features section

**Files:**
- Modify: `README.md:17-23` (the `## Features` section)

- [ ] **Step 1: Remove "Customizable Display" from Features**

Replace the current Features section with:

```markdown
## Features

- **Automatic Embedding**: Converts Figma links into interactive, inline previews.
- **Seamless Integration**: Works directly within your Obsidian markdown files.
- **Real-time Updates**: Previews update automatically when changes are made in Figma.
```

The "Customizable Display (Coming Soon)" line is removed — it moves to the Roadmap section in Task 4.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: remove Coming Soon feature from Features list"
```

---

### Task 3: Update Usage section with public sharing step

**Files:**
- Modify: `README.md:31-36` (the `## Usage` section)

- [ ] **Step 1: Add public sharing prerequisite as step 1**

Replace the current Usage section with:

```markdown
## Usage

1. Make sure your Figma file's sharing permissions are set to "Anyone with the link can view."
2. Copy a Figma link (e.g., https://www.figma.com/file/...)
3. Paste the link into your Obsidian note.
4. The plugin will automatically convert the link into an embedded preview.
5. Switch to Read mode in Obsidian to view and interact with the embedded Figma design.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add public sharing prerequisite to Usage steps"
```

---

### Task 4: Add Known Limitations and Roadmap sections

**Files:**
- Modify: `README.md` (append after the Usage section, at end of file)

- [ ] **Step 1: Add Known Limitations section**

Append the following after the Usage section:

```markdown
## Known Limitations

This plugin embeds Figma files using iframes. Figma's embed system relies on browser cookies to maintain authentication, but Obsidian's webview can't persist those cookies across reloads or mode switches. This means private file embeds get stuck in a login loop that can't be resolved from within Obsidian.

As of v1.0.4, the plugin shows a graceful fallback card with file info and a link to open in your browser when an embed fails to load. This doesn't solve the underlying cookie issue — the file must be publicly shared.

For more details on how Figma handles embed authentication:
- [Interact with embeds](https://help.figma.com/hc/en-us/articles/360051741274-Interact-with-embeds)
- [Embed files and prototypes](https://help.figma.com/hc/en-us/articles/360039827134-Embed-files-and-prototypes)
```

- [ ] **Step 2: Add Roadmap section**

Append the following after Known Limitations:

```markdown
## Roadmap

- **Figma API Authentication** — Personal access token support to allow private file embeds without relying on browser cookies.
- **Customizable Display** — Options to adjust the size and appearance of embedded Figma previews.
```

- [ ] **Step 3: Verify full README structure**

Read through the complete README and confirm the section order is:
1. Title + Badges
2. Intro paragraph
3. Warning callout
4. Features (3 items, no Coming Soon)
5. Installation (unchanged)
6. Usage (5 steps, starts with sharing prerequisite)
7. Known Limitations (with Figma doc links)
8. Roadmap (2 items)

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add Known Limitations and Roadmap sections to README"
```
