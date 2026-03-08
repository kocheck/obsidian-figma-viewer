# Private Figma File Fallback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When a private Figma file embed fails to load, gracefully show a styled fallback card instead of a broken login screen.

**Architecture:** Wrap each embed in a container with both an iframe and a hidden fallback card. Listen for Figma's `postMessage` events — if the iframe loads, hide the fallback; if a login screen is detected or no response arrives within 5 seconds, hide the iframe and show the fallback card.

**Tech Stack:** TypeScript (Obsidian Plugin API), CSS with Obsidian CSS variables

---

### Task 1: Add URL parsing helpers to main.ts

**Files:**
- Modify: `src/main.ts`

**Step 1: Add helper methods to the FigmaEmbedPlugin class**

Add these two methods before the `onunload()` method in `src/main.ts`:

```typescript
/**
 * Parse a human-readable file name from a Figma URL.
 * E.g. "https://www.figma.com/design/abc123/My-Cool-Design?..." -> "My Cool Design"
 */
parseFigmaFileName(url: string): string {
    try {
        const pathname = new URL(url).pathname;
        const segments = pathname.split("/").filter(Boolean);
        if (segments.length >= 3) {
            return decodeURIComponent(segments[2]).replace(/-/g, " ");
        }
        return "Figma File";
    } catch {
        return "Figma File";
    }
}

/**
 * Parse the file type from a Figma URL path segment.
 * E.g. "/design/..." -> "Design File", "/proto/..." -> "Prototype"
 */
parseFigmaFileType(url: string): string {
    const typeMap: Record<string, string> = {
        file: "Design File",
        design: "Design File",
        proto: "Prototype",
        board: "FigJam Board",
        slides: "Slides",
        deck: "Slide Deck",
        buzz: "Buzz",
        site: "Figma Site",
    };
    try {
        const pathname = new URL(url).pathname;
        const segments = pathname.split("/").filter(Boolean);
        if (segments.length >= 1) {
            return typeMap[segments[0]] || "Figma File";
        }
        return "Figma File";
    } catch {
        return "Figma File";
    }
}
```

**Step 2: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: add URL parsing helpers for file name and type"
```

---

### Task 2: Add fallback card CSS to styles.css

**Files:**
- Modify: `styles.css`

**Step 1: Add fallback card styles**

Append the following to `styles.css`:

```css
.figmaembed-container {
    position: relative;
    width: 100%;
}

.figmaembed-container .figmaembed-iframe {
    width: 100%;
    height: 450px;
    border: none;
}

.figmaembed-fallback {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    background-color: var(--background-secondary);
    text-align: center;
}

.figmaembed-fallback.is-visible {
    display: flex;
}

.figmaembed-fallback-icon svg {
    width: 40px;
    height: 40px;
}

.figmaembed-fallback-filename {
    font-size: var(--font-ui-medium);
    font-weight: 600;
    color: var(--text-normal);
}

.figmaembed-fallback-filetype {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    margin-top: -8px;
}

.figmaembed-fallback-message {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    max-width: 300px;
}

.figmaembed-fallback-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 6px;
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    font-size: var(--font-ui-small);
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    border: none;
}

.figmaembed-fallback-button:hover {
    background-color: var(--interactive-accent-hover);
    text-decoration: none;
    color: var(--text-on-accent);
}
```

**Step 2: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add styles.css
git commit -m "style: add fallback card styles using Obsidian CSS variables"
```

---

### Task 3: Refactor figmaEmbedProcessor to render container with iframe + fallback

**Files:**
- Modify: `src/main.ts`

This is the main change. Replace the current iframe creation logic inside the `if (isEmbeddableUrl)` block with a container that holds both the iframe and the fallback card. All dynamic text uses `textContent` (safe DOM methods, no innerHTML).

**Step 1: Add class property for cleanup tracking**

Add at the top of `FigmaEmbedPlugin` class (after `export default class FigmaEmbedPlugin extends Plugin {`):

```typescript
private messageHandlers: Array<(event: MessageEvent) => void> = [];
```

**Step 2: Add a private method to build the fallback card**

Add this method to the class, before `parseFigmaFileName`:

```typescript
private createFallbackCard(fileName: string, fileType: string, figmaUrl: string): HTMLElement {
    const fallback = document.createElement("div");
    fallback.classList.add("figmaembed-fallback");

    // Figma logo (static SVG, no user content)
    const iconDiv = document.createElement("div");
    iconDiv.classList.add("figmaembed-fallback-icon");
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 38 57");
    svg.setAttribute("fill", "none");
    const paths = [
        { d: "M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z", fill: "#1ABCFE" },
        { d: "M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z", fill: "#0ACF83" },
        { d: "M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z", fill: "#FF7262" },
        { d: "M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z", fill: "#F24E1E" },
        { d: "M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z", fill: "#A259FF" },
    ];
    for (const p of paths) {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", p.d);
        path.setAttribute("fill", p.fill);
        svg.appendChild(path);
    }
    iconDiv.appendChild(svg);
    fallback.appendChild(iconDiv);

    // File name (textContent — safe from XSS)
    const nameDiv = document.createElement("div");
    nameDiv.classList.add("figmaembed-fallback-filename");
    nameDiv.textContent = fileName;
    fallback.appendChild(nameDiv);

    // File type
    const typeDiv = document.createElement("div");
    typeDiv.classList.add("figmaembed-fallback-filetype");
    typeDiv.textContent = fileType;
    fallback.appendChild(typeDiv);

    // Message
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("figmaembed-fallback-message");
    msgDiv.textContent = "This file is private. Open it in your browser to view.";
    fallback.appendChild(msgDiv);

    // Open button
    const btn = document.createElement("a");
    btn.classList.add("figmaembed-fallback-button");
    btn.href = figmaUrl;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
    btn.textContent = "Open in Figma";
    fallback.appendChild(btn);

    return fallback;
}
```

**Step 3: Replace the iframe creation block in figmaEmbedProcessor**

Replace the entire `if (isEmbeddableUrl) { ... }` block (lines 51-69) with:

```typescript
if (isEmbeddableUrl) {
    const fileName = this.parseFigmaFileName(figmaUrl);
    const fileType = this.parseFigmaFileType(figmaUrl);

    // Create container
    const container = document.createElement("div");
    container.classList.add("figmaembed-container");

    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.figma.com/embed?embed_host=obsidian&url=${encodeURIComponent(
        figmaUrl
    )}`;
    iframe.classList.add("figmaembed-iframe");
    iframe.setAttribute("allowfullscreen", "true");

    // Create fallback card (uses safe DOM methods, no innerHTML)
    const fallback = this.createFallbackCard(fileName, fileType, figmaUrl);

    container.appendChild(iframe);
    container.appendChild(fallback);

    // Replace the original link with the container
    link.parentNode?.replaceChild(container, link);

    // Listen for postMessage from Figma embed
    const messageHandler = (event: MessageEvent) => {
        if (event.origin !== "https://www.figma.com") return;

        let data = event.data;
        if (typeof data === "string") {
            try { data = JSON.parse(data); } catch { return; }
        }

        if (data?.type === "EMBED_LOADED" || data?.type === "INITIAL_LOAD_COMPLETE") {
            clearTimeout(fallbackTimeout);
            iframe.style.display = "";
            fallback.classList.remove("is-visible");
            window.removeEventListener("message", messageHandler);
        } else if (data?.type === "LOGIN_SCREEN_SHOWN") {
            clearTimeout(fallbackTimeout);
            iframe.style.display = "none";
            fallback.classList.add("is-visible");
            window.removeEventListener("message", messageHandler);
        }
    };

    window.addEventListener("message", messageHandler);
    this.messageHandlers.push(messageHandler);

    // Safety net: if no message in 5s, show fallback
    const fallbackTimeout = setTimeout(() => {
        if (!fallback.classList.contains("is-visible") && iframe.style.display !== "none") {
            iframe.style.display = "none";
            fallback.classList.add("is-visible");
            window.removeEventListener("message", messageHandler);
        }
    }, 5000);
}
```

**Step 4: Update onunload for cleanup**

Replace the `onunload` method with:

```typescript
async onunload() {
    this.messageHandlers.forEach(handler => {
        window.removeEventListener("message", handler);
    });
    this.messageHandlers = [];
}
```

**Step 5: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 6: Commit**

```bash
git add src/main.ts
git commit -m "feat: add fallback card for private Figma file embeds"
```

---

### Task 4: Manual testing

**Step 1: Test with a public Figma file**

1. Run `npm run dev` to start dev build
2. Copy the built `main.js` and `styles.css` to your Obsidian vault's `.obsidian/plugins/figma-embed/` folder
3. Paste a public Figma link in a note
4. Switch to Reading mode
5. Expected: iframe loads normally, no fallback card visible

**Step 2: Test with a private Figma file**

1. Paste a private Figma link in a note
2. Switch to Reading mode
3. Expected: after ~5 seconds (or immediately if LOGIN_SCREEN_SHOWN fires), the iframe is hidden and the fallback card appears with:
   - Figma logo
   - File name parsed from URL
   - File type (Design File, Prototype, etc.)
   - "This file is private. Open it in your browser to view."
   - "Open in Figma" button that opens the URL

**Step 3: Test theme compatibility**

1. Switch between light and dark mode
2. If you have a custom theme, test with that too
3. Expected: fallback card adapts colors correctly

**Step 4: Commit any fixes if needed**

```bash
git add -A
git commit -m "chore: testing fixes"
```
