import { Plugin, MarkdownPostProcessorContext } from "obsidian";

export default class FigmaEmbedPlugin extends Plugin {
	async onload() {
		this.registerMarkdownPostProcessor(this.figmaEmbedProcessor.bind(this));
	}

	figmaEmbedProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		const figmaLinks = el.querySelectorAll(
			'a[href^="https://www.figma.com/"]'
		);

		figmaLinks.forEach((link: HTMLAnchorElement) => {
			const figmaUrl = link.href;
			const iframe = document.createElement("iframe");
			iframe.src = `https://www.figma.com/embed?embed_host=obsidian&url=${encodeURIComponent(
				figmaUrl
			)}`;
			iframe.style.width = "100%";
			iframe.style.height = "450px";
			iframe.style.border = "none";

			link.parentNode?.replaceChild(iframe, link);
		});
	}
}
