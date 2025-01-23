import { MarkdownRenderer } from "obsidian";
import { useCallback, useContext } from 'react';
import { AppContext, AppContextValue } from "../../Common/UI/Contexts";

export interface RenderOptions {
  text: string;
  path: string;
  onClick?: () => void;
}

export const RenderMarkdown = (prop: RenderOptions) => {
  const context: AppContextValue = useContext(AppContext);

  const handleElementRef = useCallback((node: HTMLDivElement) => {
    if (context.view == undefined || node == undefined) {
      return;
    }

    node.innerHTML = "";
    MarkdownRenderer.render(context.view.app, prop.text, node, prop.path, context.view);
  }, [prop]);

  return (<div ref={handleElementRef} className="text" onClick={() => { prop.onClick && prop.onClick() }}></div>)
}

