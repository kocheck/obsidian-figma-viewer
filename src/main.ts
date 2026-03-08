import { Plugin, MarkdownPostProcessorContext } from "obsidian";

export default class FigmaEmbedPlugin extends Plugin {
    private messageHandlers: Array<(event: MessageEvent) => void> = [];
    private fallbackTimeouts: ReturnType<typeof setTimeout>[] = [];

    async onload() {
        // This part stays the same - it registers the post processor
        this.registerMarkdownPostProcessor(this.figmaEmbedProcessor.bind(this));
    }

    /**
     * Markdown post processor function to find Figma links and potentially embed them based on URL patterns.
     * This version relies ONLY on pattern matching. If a URL matches a pattern, it attempts to embed.
     * URLs not matching patterns (or matching patterns but failing to load) will remain as links.
     *
     * @param el - The HTML element being processed.
     * @param ctx - The context of the markdown processing.
     */
    figmaEmbedProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        // Select all <a> tags with an href starting with the Figma domain
        const figmaLinks = el.querySelectorAll(
            'a[href^="https://www.figma.com/"]'
        );

        // --- UPDATED Pattern Definition (Pattern-Only Approach) ---
        // Define URL patterns that indicate an item *likely* to be embeddable asset
        // by requiring at least one character *after* the main path segment slash (e.g., /file/abc).
        // If a URL matches one of these patterns, the plugin will attempt to embed it.
        // If a URL does NOT match these patterns, it will remain a standard text link.
        // NOTE: This approach does NOT use the oEmbed endpoint, so it cannot
        // reliably check if a matching link is actually embeddable (e.g., due to permissions,
        // or if the pattern matches a page that isn't truly an embeddable asset).
        // Matching links that aren't embeddable will result in a broken iframe.
        const embeddablePatterns = [
            /\/file\/[^\/]+/,   // Matches /file/ followed by one or more non-slash characters
            /\/design\/[^\/]+/, // Matches /design/ followed by one or more non-slash characters
            /\/proto\/[^\/]+/,  // Matches /proto/ followed by one or more non-slash characters
            /\/board\/[^\/]+/,  // Matches /board/ followed by one or more non-slash characters
            /\/slides\/[^\/]+/, // Matches /slides/ followed by one or more non-slash characters
            /\/deck\/[^\/]+/,    // Matches /deck/ followed by one or more non-slash characters
            /\/buzz\/[^\/]+/,   // Matches /buzz/ followed by one or more non-slash characters
            /\/site\/[^\/]+/    // Matches /site/ followed by one or more non-slash characters
        ];

        // Iterate over each found Figma link
        figmaLinks.forEach((link: HTMLAnchorElement) => {
            const figmaUrl = link.href; // Get the original URL from the link in the markdown

            // Check if the original URL matches any of the defined STRICTER embeddable patterns
            const isEmbeddableUrl = embeddablePatterns.some(pattern => pattern.test(figmaUrl));

            // If the URL matches a pattern that suggests it's embeddable based on its structure
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
                    if (event.source !== iframe.contentWindow) return;

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
                const fallbackTimeout: ReturnType<typeof setTimeout> = setTimeout(() => {
                    if (!fallback.classList.contains("is-visible") && iframe.style.display !== "none") {
                        iframe.style.display = "none";
                        fallback.classList.add("is-visible");
                        window.removeEventListener("message", messageHandler);
                    }
                }, 5000);
                this.fallbackTimeouts.push(fallbackTimeout);
            } else {
                // If the URL does NOT match the STRICTER pattern, do nothing.
                // It remains a standard text link instantly.
                // This covers URLs like https://www.figma.com/buzz/ or https://www.figma.com/pricing/
                // console.log(`Figma link does not match stricter embeddable patterns, leaving as link: ${figmaUrl}`); // Optional log
            }
        });
    } // <- END of figmaEmbedProcessor content

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

    /**
     * Parse a human-readable file name from a Figma URL.
     * E.g. "https://www.figma.com/design/abc123/My-Cool-Design?..." -> "My Cool Design"
     */
    private parseFigmaFileName(url: string): string {
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
    private parseFigmaFileType(url: string): string {
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

    onunload() {
        this.messageHandlers.forEach(handler => {
            window.removeEventListener("message", handler);
        });
        this.messageHandlers = [];
        this.fallbackTimeouts.forEach(id => clearTimeout(id));
        this.fallbackTimeouts = [];
    }
}