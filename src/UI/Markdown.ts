import { MarkdownRenderer, View } from "obsidian";

export interface RenderOptions {
    view: View;
    text: string;
    path: string;
}


export function renderMarkdown(node: HTMLElement, options: RenderOptions) {
    MarkdownRenderer.render(options.view.app, options.text, node, options.path, options.view).then(() => {
        const paragraph = node.firstChild;

        if (paragraph != null) {
            // @ts-ignore
            node.append(...paragraph.childNodes);
            paragraph.remove();
        }
    });
}