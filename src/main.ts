import { Plugin, MarkdownPostProcessorContext } from "obsidian";

export default class FigmaEmbedPlugin extends Plugin {
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
                // Create the iframe using the hardcoded embed URL structure.
                // This happens unconditionally for matching links.
                const iframe = document.createElement("iframe");
                iframe.src = `https://www.figma.com/embed?embed_host=obsidian&url=${encodeURIComponent(
                    figmaUrl
                )}`;

                // Add class and styles for the iframe
                iframe.classList.add("figmaembed-iframe");
                iframe.style.width = "100%";
                iframe.style.height = "450px"; // Adjust as needed
                iframe.style.border = "none";
                iframe.setAttribute("allowfullscreen", "true");

                // Replace the original link with the iframe
                link.parentNode?.replaceChild(iframe, link);

                // console.log(`Attempting embed for pattern match: ${figmaUrl}`); // Optional log
            } else {
                // If the URL does NOT match the STRICTER pattern, do nothing.
                // It remains a standard text link instantly.
                // This covers URLs like https://www.figma.com/buzz/ or https://www.figma.com/pricing/
                // console.log(`Figma link does not match stricter embeddable patterns, leaving as link: ${figmaUrl}`); // Optional log
            }
        });
    } // <- END of figmaEmbedProcessor content

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

    // This part stays the same
    async onunload() {
        // Clean up logic if needed
    }
}