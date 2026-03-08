import { Plugin, MarkdownPostProcessorContext } from "obsidian";

const FIGMA_ORIGIN = "https://www.figma.com";
const FALLBACK_TIMEOUT_MS = 15000;

const FIGMA_LOGO_PATHS = [
    { d: "M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z", fill: "#1ABCFE" },
    { d: "M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z", fill: "#0ACF83" },
    { d: "M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z", fill: "#FF7262" },
    { d: "M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z", fill: "#F24E1E" },
    { d: "M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z", fill: "#A259FF" },
];

const EMBEDDABLE_PATTERN = /\/(file|design|proto|board|slides|deck|buzz|site)\/[^\/]+/;

const FILE_TYPE_MAP: Record<string, string> = {
    file: "Design File",
    design: "Design File",
    proto: "Prototype",
    board: "FigJam Board",
    slides: "Slides",
    deck: "Slide Deck",
    buzz: "Buzz",
    site: "Figma Site",
};

export default class FigmaEmbedPlugin extends Plugin {
    onload() {
        this.registerMarkdownPostProcessor(this.figmaEmbedProcessor.bind(this));
    }

    /**
     * Finds Figma links and replaces them with embedded iframes.
     * URLs matching embeddable patterns get an iframe + fallback card.
     * If the embed fails (private file, network error, timeout), a styled
     * fallback card is shown instead.
     */
    figmaEmbedProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        const figmaLinks = el.querySelectorAll(
            `a[href^="${FIGMA_ORIGIN}/"]`
        );

        figmaLinks.forEach((link: HTMLAnchorElement) => {
            try {
                this.processLink(link);
            } catch (e) {
                console.error("Failed to process Figma embed:", link.href, e);
            }
        });
    }

    private processLink(link: HTMLAnchorElement) {
        const figmaUrl = link.href;
        if (!EMBEDDABLE_PATTERN.test(figmaUrl)) return;

        const { name: fileName, type: fileType } = this.parseFigmaFileInfo(figmaUrl);

        const container = createDiv({ cls: "figmaembed-container" });
        const iframe = container.createEl("iframe", {
            cls: "figmaembed-iframe",
            attr: {
                src: `${FIGMA_ORIGIN}/embed?embed_host=obsidian&url=${encodeURIComponent(figmaUrl)}`,
                allowfullscreen: "true",
            },
        });

        const parent = link.parentNode;
        if (!parent) return;
        parent.replaceChild(container, link);

        // Lazily create fallback card only when needed
        let fallback: HTMLElement | null = null;
        const ensureFallback = () => {
            if (!fallback) {
                fallback = this.createFallbackCard(fileName, fileType, figmaUrl);
                container.appendChild(fallback);
            }
            return fallback;
        };

        const cleanup = () => {
            clearInterval(cleanupInterval);
            clearTimeout(fallbackTimeout);
            window.removeEventListener("message", messageHandler);
        };

        const resolve = (showEmbed: boolean) => {
            cleanup();
            if (showEmbed) {
                iframe.style.display = "";
                if (fallback) fallback.classList.remove("is-visible");
            } else {
                iframe.style.display = "none";
                ensureFallback().classList.add("is-visible");
            }
        };

        // Figma sends plain strings (e.g. "INITIAL_LOAD") or JSON objects with a .type field
        const messageHandler = (event: MessageEvent) => {
            if (event.origin !== FIGMA_ORIGIN) return;
            if (event.source !== iframe.contentWindow) return;

            const data = event.data;
            const eventType = typeof data === "string" ? data : data?.type;

            if (eventType === "INITIAL_LOAD" || eventType === "EMBED_LOADED") {
                resolve(true);
            } else if (eventType === "LOGIN_SCREEN_SHOWN") {
                resolve(false);
            }
        };

        window.addEventListener("message", messageHandler);

        // Safety net: if Figma doesn't respond (network error, outage, etc.), show fallback.
        // Keep the listener active so a late-loading embed can still recover.
        const fallbackTimeout: ReturnType<typeof setTimeout> = setTimeout(() => {
            if (iframe.style.display !== "none") {
                iframe.style.display = "none";
                ensureFallback().classList.add("is-visible");
            }
        }, FALLBACK_TIMEOUT_MS);

        // Self-cleanup: remove handler when iframe leaves the DOM (e.g. note navigation)
        const cleanupInterval = setInterval(() => {
            if (!iframe.isConnected) cleanup();
        }, 2000);

        // Also clean up on plugin unload
        this.register(cleanup);
    }

    private createFallbackCard(fileName: string, fileType: string, figmaUrl: string): HTMLElement {
        const fallback = createDiv({ cls: "figmaembed-fallback" });

        // Figma logo (static SVG, no user content)
        const iconDiv = fallback.createDiv({ cls: "figmaembed-fallback-icon" });
        const svg = iconDiv.createSvg("svg", { attr: { viewBox: "0 0 38 57", fill: "none" } });
        for (const p of FIGMA_LOGO_PATHS) {
            svg.createSvg("path", { attr: { d: p.d, fill: p.fill } });
        }

        const header = fallback.createDiv({ cls: "figmaembed-fallback-header" });
        header.appendChild(iconDiv);
        // File name (text — safe from XSS via Obsidian's createDiv)
        header.createDiv({ cls: "figmaembed-fallback-filename", text: fileName });
        header.createSpan({ cls: "figmaembed-fallback-filetype", text: fileType });

        fallback.createDiv({
            cls: "figmaembed-fallback-message",
            text: "Unable to load this embed. The file may be private, or the connection timed out.",
        });
        fallback.createEl("a", {
            cls: "figmaembed-fallback-button",
            text: "Open in Figma",
            href: figmaUrl,
            attr: { target: "_blank", rel: "noopener noreferrer" },
        });

        return fallback;
    }

    /**
     * Parse file info from a Figma URL.
     * E.g. "https://www.figma.com/design/abc123/My-Cool-Design?..." -> { name: "My Cool Design", type: "Design File" }
     */
    private parseFigmaFileInfo(url: string): { name: string; type: string } {
        try {
            const segments = new URL(url).pathname.split("/").filter(Boolean);
            const name = segments.length >= 3
                ? decodeURIComponent(segments[2]).replace(/-/g, " ")
                : "Figma File";
            const type = FILE_TYPE_MAP[segments[0]] || "Figma File";
            return { name, type };
        } catch {
            return { name: "Figma File", type: "Figma File" };
        }
    }

    onunload() {}
}
