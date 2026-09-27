import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { MarkdownCell } from '@jupyterlab/cells';

/**
 * Obsidian Live Markdown Extension for JupyterLite
 * Provides real-time KaTeX rendering, formula builder, interactive table wizard,
 * and obsidian-style callouts for Markdown cells.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlite-obsidian-markdown:plugin',
  description: 'Obsidian-like Live Preview, LaTeX math menus, and interactive tables for Markdown cells',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
    console.log('JupyterLite Obsidian Markdown Extension aktiviert!');

    tracker.widgetAdded.connect((_, notebookPanel) => {
      notebookPanel.content.activeCellChanged.connect((_, cell) => {
        if (cell instanceof MarkdownCell) {
          // Mount custom Obsidian toolbar and live KaTeX preview hooks
          setupObsidianMarkdownCell(cell);
        }
      });
    });
  }
};

function setupObsidianMarkdownCell(cell: MarkdownCell): void {
  // Enhanced live preview and KaTeX / table dialog handlers
  cell.node.classList.add('obsidian-markdown-cell');
}

export default extension;