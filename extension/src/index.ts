import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { MarkdownCell } from '@jupyterlab/cells';
import katex from 'katex';

/**
 * Obsidian Live Markdown Extension for JupyterLite
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlite-obsidian-markdown:plugin',
  description: 'Obsidian Markdown Toolbar, Interactive Tables, Math Formula Editor and Callouts for JupyterLite',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (_app: JupyterFrontEnd, tracker: INotebookTracker) => {
    console.log('[Obsidian Extension] Geladen und aktiv!');

    injectStyles();
    showObsidianToast('💎 Obsidian Markdown aktiv!');

    tracker.widgetAdded.connect((_, notebookPanel: NotebookPanel) => {
      notebookPanel.content.activeCellChanged.connect((_, cell) => {
        document.querySelectorAll('.obsidian-floating-toolbar').forEach(el => el.remove());
        if (cell instanceof MarkdownCell) {
          attachObsidianToolbar(cell);
        }
      });

      notebookPanel.content.model?.cells.changed.connect(() => {
        transformRenderedMarkdown(notebookPanel);
      });
      setTimeout(() => transformRenderedMarkdown(notebookPanel), 800);
    });
  }
};

function injectStyles(): void {
  if (document.getElementById('obsidian-extension-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'obsidian-extension-styles';
  styleEl.textContent = `
    .obsidian-floating-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 3px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 5px 8px;
      margin-bottom: 8px;
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.4);
      z-index: 50;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #e4e4e7;
    }
    .obsidian-tb-brand {
      font-size: 11px;
      font-weight: 700;
      color: #c084fc;
      padding: 3px 7px;
      background: rgba(192, 132, 252, 0.12);
      border: 1px solid rgba(192, 132, 252, 0.25);
      border-radius: 5px;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-right: 4px;
    }
    .obsidian-tb-divider {
      width: 1px;
      height: 18px;
      background: #3f3f46;
      margin: 0 3px;
    }
    .obsidian-tb-btn {
      background: transparent;
      border: 1px solid transparent;
      border-radius: 5px;
      padding: 4px 7px;
      font-size: 12px;
      color: #d4d4d8;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }
    .obsidian-tb-btn:hover {
      background: #27272a;
      color: #ffffff;
      border-color: #3f3f46;
    }
    .obsidian-tb-btn svg {
      stroke: currentColor;
    }
    .obsidian-tb-btn-primary {
      background: #7c3aed;
      color: white;
      border-color: #6d28d9;
    }
    .obsidian-tb-btn-primary:hover {
      background: #6d28d9;
    }
    .obsidian-dropdown-container {
      position: relative;
      display: inline-block;
    }
    .obsidian-dropdown-menu {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 4px;
      background: #18181b;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      min-width: 160px;
      z-index: 100;
      padding: 4px;
    }
    .obsidian-dropdown-menu.show {
      display: block;
    }
    .obsidian-dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 10px;
      font-size: 12px;
      color: #e4e4e7;
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-align: left;
    }
    .obsidian-dropdown-item:hover {
      background: #27272a;
      color: #38bdf8;
    }
    .obsidian-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .obsidian-modal {
      background: #18181b;
      color: #f4f4f5;
      border: 1px solid #3f3f46;
      border-radius: 12px;
      width: 92%;
      max-width: 680px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      overflow: hidden;
    }
    .obsidian-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: #27272a;
      border-bottom: 1px solid #3f3f46;
    }
    .obsidian-modal-header h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #fafafa;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .obsidian-modal-close {
      background: transparent;
      border: none;
      color: #a1a1aa;
      font-size: 22px;
      cursor: pointer;
      line-height: 1;
    }
    .obsidian-modal-close:hover {
      color: #ffffff;
    }
    .obsidian-modal-body {
      padding: 18px;
      overflow-y: auto;
      flex: 1;
    }
    .obsidian-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 18px;
      background: #27272a;
      border-top: 1px solid #3f3f46;
    }
    .obsidian-table-grid {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    .obsidian-table-grid th, .obsidian-table-grid td {
      border: 1px solid #3f3f46;
      padding: 4px;
      background: #27272a;
    }
    .obsidian-table-grid input {
      width: 100%;
      box-sizing: border-box;
      background: #18181b;
      border: 1px solid #3f3f46;
      color: #f4f4f5;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 13px;
    }
    .obsidian-table-grid input:focus {
      outline: none;
      border-color: #a855f7;
    }
    .obsidian-col-ctrl {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }
    .obsidian-col-ctrl button {
      background: #3f3f46;
      border: none;
      color: #d4d4d8;
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 10px;
      cursor: pointer;
    }
    .obsidian-col-ctrl button:hover {
      background: #52525b;
      color: white;
    }
    .obsidian-chips-group {
      margin-bottom: 12px;
    }
    .obsidian-chips-title {
      font-size: 11px;
      font-weight: 600;
      color: #a1a1aa;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .obsidian-chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }
    .obsidian-chip {
      background: #27272a;
      border: 1px solid #3f3f46;
      color: #e4e4e7;
      padding: 4px 8px;
      border-radius: 5px;
      font-size: 12px;
      cursor: pointer;
      font-family: monospace;
      transition: all 0.15s ease;
    }
    .obsidian-chip:hover {
      background: #3f3f46;
      border-color: #a855f7;
      color: #ffffff;
    }
    .obsidian-math-preview {
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 14px;
      margin: 10px 0;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-x: auto;
    }
    .obsidian-btn {
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .obsidian-btn-sec {
      background: #27272a;
      border: 1px solid #3f3f46;
      color: #e4e4e7;
    }
    .obsidian-btn-sec:hover {
      background: #3f3f46;
    }
    .obsidian-btn-pri {
      background: #7c3aed;
      border: 1px solid #6d28d9;
      color: #ffffff;
    }
    .obsidian-btn-pri:hover {
      background: #6d28d9;
    }
    .obsidian-table-wrapper {
      position: relative;
      margin: 12px 0;
      overflow-x: auto;
    }
    .obsidian-table-wrapper:hover .obsidian-table-edit-btn {
      opacity: 1;
    }
    .obsidian-table-edit-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      background: #27272a;
      color: #38bdf8;
      border: 1px solid #3f3f46;
      border-radius: 5px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease, background 0.15s ease;
      z-index: 10;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }
    .obsidian-table-edit-btn:hover {
      background: #3f3f46;
      color: #ffffff;
    }

    /* Block-Formeln Hover-Container & Edit-Button */
    .obsidian-math-block-wrapper {
      position: relative;
      margin: 12px 0;
      padding: 12px 16px;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 8px;
      overflow-x: auto;
      text-align: center;
      transition: border-color 0.2s ease;
    }
    .obsidian-math-block-wrapper:hover {
      border-color: #3f3f46;
    }
    .obsidian-math-block-wrapper:hover .obsidian-math-edit-btn {
      opacity: 1;
    }
    .obsidian-math-edit-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      background: #27272a;
      color: #fbbf24;
      border: 1px solid #3f3f46;
      border-radius: 5px;
      padding: 4px 9px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease, background 0.15s ease, color 0.15s ease;
      z-index: 10;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .obsidian-math-edit-btn:hover {
      background: #3f3f46;
      color: #fef08a;
      border-color: #52525b;
    }
    .obsidian-math-edit-btn svg {
      stroke: currentColor;
    }

    /* Inline-Formeln Hover-Effekt & Edit-Badge */
    .obsidian-inline-math-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      padding: 1px 4px;
      margin: 0 2px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s ease, box-shadow 0.15s ease;
    }
    .obsidian-inline-math-wrapper:hover {
      background: rgba(245, 158, 11, 0.15) !important;
      box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.4);
    }
    .obsidian-inline-math-wrapper .obsidian-inline-edit-btn {
      display: inline-flex;
      align-items: center;
      margin-left: 4px;
      color: #fbbf24;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    .obsidian-inline-math-wrapper:hover .obsidian-inline-edit-btn {
      opacity: 1;
    }

    /* Callouts */
    .obsidian-callout {
      border-left: 4px solid #38bdf8 !important;
      background: rgba(56, 189, 248, 0.08) !important;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px !important;
      margin: 12px 0 !important;
    }
    .obsidian-callout-tip {
      border-left-color: #34d399 !important;
      background: rgba(52, 211, 153, 0.08) !important;
    }
    .obsidian-callout-warning {
      border-left-color: #fbbf24 !important;
      background: rgba(251, 191, 36, 0.08) !important;
    }
    .obsidian-callout-caution, .obsidian-callout-danger {
      border-left-color: #f87171 !important;
      background: rgba(248, 113, 113, 0.08) !important;
    }
    .obsidian-callout-important {
      border-left-color: #c084fc !important;
      background: rgba(192, 132, 252, 0.08) !important;
    }
    .obsidian-callout-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      margin-right: 6px;
    }
    .obsidian-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #18181b;
      color: #ffffff;
      border: 1px solid #3f3f46;
      padding: 10px 18px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      z-index: 999999;
      font-size: 13px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: opacity 0.3s ease;
    }
    .obsidian-toast-fade {
      opacity: 0;
    }
  `;
  document.head.appendChild(styleEl);
}

function showObsidianToast(message: string): void {
  const existing = document.getElementById('obsidian-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'obsidian-toast';
  toast.className = 'obsidian-toast';
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('obsidian-toast-fade');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function attachObsidianToolbar(cell: MarkdownCell): void {
  cell.node.classList.add('obsidian-markdown-cell');

  const editorNode = cell.node.querySelector('.jp-Cell-inputArea') || cell.node;
  if (!editorNode) return;

  const toolbar = document.createElement('div');
  toolbar.className = 'obsidian-floating-toolbar';

  toolbar.innerHTML = `
    <div class="obsidian-tb-brand">💎 Obsidian</div>
    <div class="obsidian-dropdown-container">
      <button class="obsidian-tb-btn obsidian-dropdown-toggle" title="Überschriften">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12M6 20V4M18 20V4"/></svg>
        <span>H</span>
      </button>
      <div class="obsidian-dropdown-menu">
        <button class="obsidian-dropdown-item" data-action="h1"><b>H1 Überschrift</b></button>
        <button class="obsidian-dropdown-item" data-action="h2"><b>H2 Untertitel</b></button>
        <button class="obsidian-dropdown-item" data-action="h3"><b>H3 Abschnitt</b></button>
      </div>
    </div>
    <div class="obsidian-tb-divider"></div>
    <button class="obsidian-tb-btn" title="Fett (Strg+B)" data-action="bold">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 12h9a4 4 0 0 1 0 8H6v-8zm0 0h8a3.5 3.5 0 0 0 0-7H6v7z"/></svg>
    </button>
    <button class="obsidian-tb-btn" title="Kursiv (Strg+I)" data-action="italic">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
    </button>
    <button class="obsidian-tb-btn" title="Durchgestrichen" data-action="strike">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
    </button>
    <button class="obsidian-tb-btn" title="Markieren (==text==)" data-action="highlight">
      <span style="background: rgba(251, 191, 36, 0.2); color: #fbbf24; padding: 0 3px; border-radius: 2px;">==</span>
    </button>
    <button class="obsidian-tb-btn" title="Inline-Code" data-action="code">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
    </button>
    <div class="obsidian-tb-divider"></div>
    <button class="obsidian-tb-btn" title="Aufzählung (- )" data-action="bullet">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
    </button>
    <button class="obsidian-tb-btn" title="Checkliste (- [ ] )" data-action="checklist">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    </button>
    <div class="obsidian-tb-divider"></div>
    <button class="obsidian-tb-btn" title="LaTeX Formel-Editor öffnen" data-action="math" style="color: #c084fc;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 7V4H6l6 8-6 8h12v-3"/></svg>
      <span>Formel</span>
    </button>
    <button class="obsidian-tb-btn" title="Interaktiven Tabellen-Editor öffnen" data-action="table" style="color: #38bdf8;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
      <span>Tabelle</span>
    </button>
    <div class="obsidian-dropdown-container">
      <button class="obsidian-tb-btn obsidian-dropdown-toggle" title="Obsidian Callouts">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
        <span>Callout</span>
      </button>
      <div class="obsidian-dropdown-menu">
        <button class="obsidian-dropdown-item" data-action="callout-note" style="color: #38bdf8;">ℹ️ [!NOTE] Hinweis</button>
        <button class="obsidian-dropdown-item" data-action="callout-tip" style="color: #34d399;">💡 [!TIP] Tipp</button>
        <button class="obsidian-dropdown-item" data-action="callout-warning" style="color: #fbbf24;">⚠️ [!WARNING] Warnung</button>
        <button class="obsidian-dropdown-item" data-action="callout-caution" style="color: #f87171;">🚨 [!CAUTION] Achtung</button>
        <button class="obsidian-dropdown-item" data-action="callout-important" style="color: #c084fc;">📌 [!IMPORTANT] Wichtig</button>
      </div>
    </div>
    <div class="obsidian-tb-divider"></div>
    <button class="obsidian-tb-btn obsidian-tb-btn-primary" title="Zelle ausführen / rendern (Umschalt+Eingabe)" data-action="render">
      ▶ Rendern
    </button>
  `;

  toolbar.querySelectorAll('.obsidian-dropdown-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = btn.closest('.obsidian-dropdown-container');
      const menu = parent?.querySelector('.obsidian-dropdown-menu');
      document.querySelectorAll('.obsidian-dropdown-menu').forEach(m => {
        if (m !== menu) m.classList.remove('show');
      });
      menu?.classList.toggle('show');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.obsidian-dropdown-menu').forEach(m => m.classList.remove('show'));
  });

  toolbar.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const action = btn.getAttribute('data-action');
      handleToolbarAction(cell, action);
    });
  });

  editorNode.prepend(toolbar);
}

function handleToolbarAction(cell: MarkdownCell, action: string | null): void {
  if (!action) return;

  switch (action) {
    case 'h1': insertLinePrefix(cell, '# '); break;
    case 'h2': insertLinePrefix(cell, '## '); break;
    case 'h3': insertLinePrefix(cell, '### '); break;
    case 'bold': insertAroundSelection(cell, '**', '**', 'fetter Text'); break;
    case 'italic': insertAroundSelection(cell, '*', '*', 'kursiver Text'); break;
    case 'strike': insertAroundSelection(cell, '~~', '~~', 'durchgestrichen'); break;
    case 'highlight': insertAroundSelection(cell, '==', '==', 'markierter Text'); break;
    case 'code': insertAroundSelection(cell, '`', '`', 'code'); break;
    case 'bullet': insertLinePrefix(cell, '- '); break;
    case 'checklist': insertLinePrefix(cell, '- [ ] '); break;
    case 'math': openMathEditorModal(cell); break;
    case 'table': openTableEditorModal(cell); break;
    case 'callout-note': insertAroundSelection(cell, '\n> [!NOTE]\n> ', '\n', 'Wichtiger Hinweis hier...'); break;
    case 'callout-tip': insertAroundSelection(cell, '\n> [!TIP]\n> ', '\n', 'Praktischer Tipp hier...'); break;
    case 'callout-warning': insertAroundSelection(cell, '\n> [!WARNING]\n> ', '\n', 'Warnung hier...'); break;
    case 'callout-caution': insertAroundSelection(cell, '\n> [!CAUTION]\n> ', '\n', 'Gefahr hier...'); break;
    case 'callout-important': insertAroundSelection(cell, '\n> [!IMPORTANT]\n> ', '\n', 'Wichtige Info...'); break;
    case 'render': cell.rendered = true; break;
  }
}

function insertAroundSelection(cell: MarkdownCell, before: string, after: string, defaultText: string): void {
  const editor = cell.editor;
  if (!editor) {
    const current = cell.model.sharedModel.getSource();
    cell.model.sharedModel.setSource(current + '\n' + before + defaultText + after);
    return;
  }

  let selectedText = '';
  try {
    const selection = editor.getSelection();
    if (selection && typeof editor.getOffsetAt === 'function') {
      const src = cell.model.sharedModel.getSource();
      const startOffset = editor.getOffsetAt(selection.start);
      const endOffset = editor.getOffsetAt(selection.end);
      selectedText = src.substring(startOffset, endOffset);
    }
  } catch (_e) {
    selectedText = '';
  }

  const textToInsert = selectedText ? `${before}${selectedText}${after}` : `${before}${defaultText}${after}`;

  if (typeof editor.replaceSelection === 'function') {
    editor.replaceSelection(textToInsert);
  } else {
    const current = cell.model.sharedModel.getSource();
    cell.model.sharedModel.setSource(current + '\n' + textToInsert);
  }
}

function insertLinePrefix(cell: MarkdownCell, prefix: string): void {
  const editor = cell.editor;
  if (!editor) {
    cell.model.sharedModel.setSource(prefix + cell.model.sharedModel.getSource());
    return;
  }

  const selection = editor.getSelection();
  const src = cell.model.sharedModel.getSource();
  const startOffset = typeof editor.getOffsetAt === 'function' ? editor.getOffsetAt(selection.start) : 0;
  const lineStart = src.lastIndexOf('\n', startOffset - 1) + 1;

  const newContent = src.substring(0, lineStart) + prefix + src.substring(lineStart);
  cell.model.sharedModel.setSource(newContent);
}

function parseMarkdownTable(raw: string) {
  const lines = raw.trim().split('\n').filter(l => l.trim().startsWith('|') && l.trim().endsWith('|'));
  if (lines.length < 2) return null;

  const headers = lines[0].split('|').slice(1, -1).map(c => c.trim());
  const alignLine = lines[1].split('|').slice(1, -1).map(c => c.trim());
  const alignments = alignLine.map(c => {
    if (c.startsWith(':') && c.endsWith(':')) return 'center';
    if (c.endsWith(':')) return 'right';
    return 'left';
  });
  const rows = lines.slice(2).map(r => r.split('|').slice(1, -1).map(c => c.trim()));
  return { headers, alignments, rows };
}

function generateMarkdownTable(headers: string[], alignments: string[], rows: string[][]): string {
  let md = '| ' + headers.join(' | ') + ' |\n';
  md += '| ' + alignments.map(a => a === 'center' ? ':---:' : a === 'right' ? '---:' : '---').join(' | ') + ' |\n';
  for (const r of rows) {
    const padded = headers.map((_, i) => r[i] !== undefined ? r[i] : '');
    md += '| ' + padded.join(' | ') + ' |\n';
  }
  return md;
}

function extractAllMarkdownTables(src: string): string[] {
  const results: string[] = [];
  const lines = src.split('\n');
  let current: string[] = [];
  for (const line of lines) {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      current.push(line);
    } else {
      if (current.length >= 2) results.push(current.join('\n'));
      current = [];
    }
  }
  if (current.length >= 2) results.push(current.join('\n'));
  return results;
}

function openTableEditorModal(cell: MarkdownCell, initialTableMarkdown?: string): void {
  const existing = document.getElementById('obsidian-table-modal');
  if (existing) existing.remove();

  let tableData = initialTableMarkdown ? parseMarkdownTable(initialTableMarkdown) : null;
  if (!tableData) {
    tableData = {
      headers: ['Modell', 'Score (R²)', 'Status'],
      alignments: ['left', 'right', 'center'],
      rows: [
        ['Linear Regression', '0.941', 'Optimal'],
        ['Random Forest', '0.968', 'Best Model']
      ]
    };
  }

  let currentHeaders = [...tableData.headers];
  let currentAlignments = [...tableData.alignments];
  let currentRows = tableData.rows.map(r => [...r]);

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'obsidian-table-modal';
  modalOverlay.className = 'obsidian-modal-overlay';

  const isEditing = Boolean(initialTableMarkdown && initialTableMarkdown.trim().length > 0);

  modalOverlay.innerHTML = `
    <div class="obsidian-modal" style="max-width: 720px;">
      <div class="obsidian-modal-header">
        <h3>📊 ${isEditing ? 'Markdown-Tabelle bearbeiten' : 'Neue Tabelle erstellen'}</h3>
        <button class="obsidian-modal-close">&times;</button>
      </div>
      <div class="obsidian-modal-body">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="display: flex; gap: 8px;">
            <button class="obsidian-btn obsidian-btn-sec" id="tb-add-col">+ Spalte hinzufügen</button>
            <button class="obsidian-btn obsidian-btn-sec" id="tb-del-col">- Spalte entfernen</button>
            <button class="obsidian-btn obsidian-btn-sec" id="tb-add-row">+ Zeile hinzufügen</button>
            <button class="obsidian-btn obsidian-btn-sec" id="tb-del-row">- Zeile entfernen</button>
          </div>
          <span style="font-size: 12px; color: #a1a1aa;" id="tb-dim-label"></span>
        </div>
        <div style="max-height: 380px; overflow: auto; border: 1px solid #3f3f46; border-radius: 8px; padding: 4px;">
          <table class="obsidian-table-grid" id="tb-grid"></table>
        </div>
        <div style="margin-top: 14px;">
          <label style="font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase;">Markdown Vorschau:</label>
          <pre id="tb-md-preview" style="background: #09090b; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #38bdf8; overflow-x: auto; margin-top: 4px;"></pre>
        </div>
      </div>
      <div class="obsidian-modal-footer">
        <button class="obsidian-btn obsidian-btn-sec" id="tb-cancel">Abbrechen</button>
        <button class="obsidian-btn obsidian-btn-pri" id="tb-save">${isEditing ? '💾 Tabelle aktualisieren' : 'In Zelle einfügen'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const gridTable = modalOverlay.querySelector('#tb-grid') as HTMLTableElement;
  const mdPreview = modalOverlay.querySelector('#tb-md-preview') as HTMLPreElement;
  const dimLabel = modalOverlay.querySelector('#tb-dim-label') as HTMLSpanElement;

  function renderGrid(): void {
    dimLabel.textContent = `${currentHeaders.length} Spalten × ${currentRows.length} Zeilen`;
    gridTable.innerHTML = '';

    const thead = document.createElement('thead');
    const headerTr = document.createElement('tr');
    currentHeaders.forEach((h, colIdx) => {
      const th = document.createElement('th');
      th.innerHTML = `
        <div class="obsidian-col-ctrl">
          <button data-align="left" title="Linksbündig">L</button>
          <button data-align="center" title="Zentriert">C</button>
          <button data-align="right" title="Rechtsbündig">R</button>
        </div>
        <input type="text" value="${h}" placeholder="Spalte ${colIdx + 1}" data-header="${colIdx}" />
      `;
      th.querySelectorAll('[data-align]').forEach(btn => {
        btn.addEventListener('click', () => {
          const a = btn.getAttribute('data-align') as 'left' | 'center' | 'right';
          currentAlignments[colIdx] = a;
          updatePreview();
        });
      });
      th.querySelector('input')?.addEventListener('input', (e) => {
        currentHeaders[colIdx] = (e.target as HTMLInputElement).value;
        updatePreview();
      });
      headerTr.appendChild(th);
    });
    thead.appendChild(headerTr);
    gridTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    currentRows.forEach((row, rowIdx) => {
      const tr = document.createElement('tr');
      currentHeaders.forEach((_, colIdx) => {
        const td = document.createElement('td');
        const val = row[colIdx] !== undefined ? row[colIdx] : '';
        td.innerHTML = `<input type="text" value="${val}" placeholder="Wert..." data-row="${rowIdx}" data-col="${colIdx}" />`;
        td.querySelector('input')?.addEventListener('input', (e) => {
          currentRows[rowIdx][colIdx] = (e.target as HTMLInputElement).value;
          updatePreview();
        });
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    gridTable.appendChild(tbody);

    updatePreview();
  }

  function updatePreview(): void {
    mdPreview.textContent = generateMarkdownTable(currentHeaders, currentAlignments, currentRows);
  }

  modalOverlay.querySelector('#tb-add-col')?.addEventListener('click', () => {
    currentHeaders.push(`Spalte ${currentHeaders.length + 1}`);
    currentAlignments.push('left');
    currentRows.forEach(r => r.push(''));
    renderGrid();
  });

  modalOverlay.querySelector('#tb-del-col')?.addEventListener('click', () => {
    if (currentHeaders.length <= 1) return;
    currentHeaders.pop();
    currentAlignments.pop();
    currentRows.forEach(r => r.pop());
    renderGrid();
  });

  modalOverlay.querySelector('#tb-add-row')?.addEventListener('click', () => {
    currentRows.push(new Array(currentHeaders.length).fill(''));
    renderGrid();
  });

  modalOverlay.querySelector('#tb-del-row')?.addEventListener('click', () => {
    if (currentRows.length <= 1) return;
    currentRows.pop();
    renderGrid();
  });

  const close = () => modalOverlay.remove();
  modalOverlay.querySelector('.obsidian-modal-close')?.addEventListener('click', close);
  modalOverlay.querySelector('#tb-cancel')?.addEventListener('click', close);

  modalOverlay.querySelector('#tb-save')?.addEventListener('click', () => {
    const finalMd = generateMarkdownTable(currentHeaders, currentAlignments, currentRows);
    if (initialTableMarkdown) {
      const src = cell.model.sharedModel.getSource();
      if (src.includes(initialTableMarkdown.trim())) {
        cell.model.sharedModel.setSource(src.replace(initialTableMarkdown.trim(), finalMd.trim()));
      } else {
        insertAroundSelection(cell, '', '', '\n' + finalMd + '\n');
      }
    } else {
      insertAroundSelection(cell, '', '', '\n' + finalMd + '\n');
    }
    close();
  });

  renderGrid();
}

function findFormulaInSource(src: string, targetLatex: string, isBlock: boolean): string | null {
  const cleanTarget = targetLatex.trim();
  const normalizedTarget = cleanTarget.replace(/\s+/g, ' ');

  if (isBlock) {
    const blockRegex = /\$\$([\s\S]*?)\$\$/g;
    let match;
    while ((match = blockRegex.exec(src)) !== null) {
      const inside = match[1].trim();
      if (inside === cleanTarget || inside.replace(/\s+/g, ' ') === normalizedTarget) {
        return match[0];
      }
    }
    blockRegex.lastIndex = 0;
    while ((match = blockRegex.exec(src)) !== null) {
      if (cleanTarget.length > 3 && match[1].includes(cleanTarget.slice(0, Math.min(cleanTarget.length, 12)))) {
        return match[0];
      }
    }
  } else {
    const inlineRegex = /(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g;
    let match;
    while ((match = inlineRegex.exec(src)) !== null) {
      const inside = match[1].trim();
      if (inside === cleanTarget || inside.replace(/\s+/g, ' ') === normalizedTarget) {
        return match[0];
      }
    }
  }
  return null;
}

function openMathEditorModal(cell: MarkdownCell, initialFormulaMarkdown?: string, initialLatex?: string, initialIsBlock?: boolean): void {
  const existing = document.getElementById('obsidian-math-modal');
  if (existing) existing.remove();

  let isBlock = initialIsBlock !== undefined ? initialIsBlock : true;
  let currentLatex = initialLatex !== undefined ? initialLatex : '\\mathbf{A}\\mathbf{x} = \\mathbf{b}';

  if (initialFormulaMarkdown && !initialLatex) {
    const trimmed = initialFormulaMarkdown.trim();
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length >= 4) {
      currentLatex = trimmed.slice(2, -2).trim();
      isBlock = true;
    } else if (trimmed.startsWith('$') && trimmed.endsWith('$') && trimmed.length >= 2) {
      currentLatex = trimmed.slice(1, -1).trim();
      isBlock = false;
    }
  }

  const isEditing = Boolean(initialFormulaMarkdown || (initialLatex && initialLatex.trim().length > 0));
  const originalLatex = currentLatex;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'obsidian-math-modal';
  modalOverlay.className = 'obsidian-modal-overlay';

  modalOverlay.innerHTML = `
    <div class="obsidian-modal" style="max-width: 660px;">
      <div class="obsidian-modal-header">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.2"><path d="M18 7V4H6l6 8-6 8h12v-3"/></svg>
          <span>${isEditing ? 'Formel bearbeiten' : 'LaTeX Formel-Editor'}</span>
        </h3>
        <button class="obsidian-modal-close">&times;</button>
      </div>
      <div class="obsidian-modal-body">
        <p style="font-size: 12px; color: #a1a1aa; margin: 0 0 12px 0;">
          ${isEditing ? 'Bestehende Formel in dieser Zelle anpassen und aktualisieren' : 'Mathematische Ausdrücke & Data-Science Formeln intuitiv einfügen'}
        </p>

        <div class="obsidian-chips-group">
          <div class="obsidian-chips-title">Matrizen & Vektoren</div>
          <div class="obsidian-chips-row">
            <button class="obsidian-chip" data-tex="\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}">(2x2 Matrix)</button>
            <button class="obsidian-chip" data-tex="\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}">(3x3 Matrix)</button>
            <button class="obsidian-chip" data-tex="\\begin{bmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{bmatrix}">[Vektor]</button>
            <button class="obsidian-chip" data-tex="\\det(\\mathbf{A})">Det(A)</button>
            <button class="obsidian-chip" data-tex="\\mathbf{I}">Einheitsmatrix</button>
          </div>

          <div class="obsidian-chips-title">Analysis & Bausteine</div>
          <div class="obsidian-chips-row">
            <button class="obsidian-chip" data-tex="\\frac{a}{b}">Bruch (\\frac)</button>
            <button class="obsidian-chip" data-tex="x^{2} + y^{2} = r^{2}">Potenz (x^2)</button>
            <button class="obsidian-chip" data-tex="\\sqrt{x^2 + y^2}">Wurzel (\\sqrt)</button>
            <button class="obsidian-chip" data-tex="\\sum_{i=1}^{n} x_i">Summe (\\sum)</button>
            <button class="obsidian-chip" data-tex="\\int_{a}^{b} f(x)\\,dx">Integral (\\int)</button>
            <button class="obsidian-chip" data-tex="\\lim_{x \\to \\infty} f(x)">Limes (\\lim)</button>
            <button class="obsidian-chip" data-tex="\\vec{v}">Vektorpfeil</button>
          </div>

          <div class="obsidian-chips-title">Griechische Symbole</div>
          <div class="obsidian-chips-row">
            <button class="obsidian-chip" data-tex="\\alpha">α</button>
            <button class="obsidian-chip" data-tex="\\beta">β</button>
            <button class="obsidian-chip" data-tex="\\gamma">γ</button>
            <button class="obsidian-chip" data-tex="\\theta">θ</button>
            <button class="obsidian-chip" data-tex="\\lambda">λ</button>
            <button class="obsidian-chip" data-tex="\\mu">μ</button>
            <button class="obsidian-chip" data-tex="\\pi">π</button>
            <button class="obsidian-chip" data-tex="\\sigma">σ</button>
            <button class="obsidian-chip" data-tex="\\Delta">Δ</button>
            <button class="obsidian-chip" data-tex="\\Sigma">Σ</button>
            <button class="obsidian-chip" data-tex="\\omega">ω</button>
          </div>
        </div>

        <label style="font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase;">LaTeX Code:</label>
        <textarea id="math-tex-input" rows="3" style="width: 100%; box-sizing: border-box; background: #09090b; border: 1px solid #3f3f46; color: #f4f4f5; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 13px; margin: 4px 0 10px 0;"></textarea>

        <div style="display: flex; gap: 1rem; font-size: 13px; color: #d4d4d8; margin-bottom: 12px;">
          <label><input type="radio" name="math-mode" value="inline" ${!isBlock ? 'checked' : ''}> Im Fließtext ($...$)</label>
          <label><input type="radio" name="math-mode" value="block" ${isBlock ? 'checked' : ''}> Eigene Zeile / Block ($$...$$)</label>
        </div>

        <label style="font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase;">Echtzeit KaTeX Vorschau:</label>
        <div id="math-katex-preview" class="obsidian-math-preview"></div>
      </div>
      <div class="obsidian-modal-footer">
        <button class="obsidian-btn obsidian-btn-sec" id="math-cancel">Abbrechen</button>
        <button class="obsidian-btn obsidian-btn-pri" id="math-save" style="background: #d97706; border-color: #b45309;">${isEditing ? '💾 Formel aktualisieren' : 'In Zelle einfügen'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const texInput = modalOverlay.querySelector('#math-tex-input') as HTMLTextAreaElement;
  const previewDiv = modalOverlay.querySelector('#math-katex-preview') as HTMLDivElement;
  texInput.value = currentLatex;

  function renderMathPreview(): void {
    const mode = (modalOverlay.querySelector('input[name="math-mode"]:checked') as HTMLInputElement)?.value === 'block';
    try {
      previewDiv.innerHTML = katex.renderToString(texInput.value.trim(), {
        displayMode: mode,
        throwOnError: false
      });
    } catch (e) {
      previewDiv.innerHTML = `<span style="color: #f87171; font-size: 12px;">LaTeX Fehler: ${texInput.value}</span>`;
    }
  }

  texInput.addEventListener('input', () => {
    currentLatex = texInput.value;
    renderMathPreview();
  });

  modalOverlay.querySelectorAll('input[name="math-mode"]').forEach(radio => {
    radio.addEventListener('change', renderMathPreview);
  });

  modalOverlay.querySelectorAll('.obsidian-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const tex = chip.getAttribute('data-tex');
      if (tex) {
        texInput.value = tex;
        currentLatex = tex;
        renderMathPreview();
      }
    });
  });

  const close = () => modalOverlay.remove();
  modalOverlay.querySelector('.obsidian-modal-close')?.addEventListener('click', close);
  modalOverlay.querySelector('#math-cancel')?.addEventListener('click', close);

  modalOverlay.querySelector('#math-save')?.addEventListener('click', () => {
    const isBlockMode = (modalOverlay.querySelector('input[name="math-mode"]:checked') as HTMLInputElement)?.value === 'block';
    const cleanTex = texInput.value.trim();
    const formatted = isBlockMode ? `\n$$\n${cleanTex}\n$$\n` : `$${cleanTex}$`;

    const src = cell.model.sharedModel.getSource();

    if (initialFormulaMarkdown && src.includes(initialFormulaMarkdown)) {
      cell.model.sharedModel.setSource(src.replace(initialFormulaMarkdown, formatted));
    } else {
      const foundInSrc = findFormulaInSource(src, originalLatex, isBlock);
      if (foundInSrc && src.includes(foundInSrc)) {
        cell.model.sharedModel.setSource(src.replace(foundInSrc, formatted));
      } else {
        insertAroundSelection(cell, '', '', formatted);
      }
    }
    close();
  });

  renderMathPreview();
}

function transformRenderedMarkdown(notebookPanel: NotebookPanel): void {
  notebookPanel.content.widgets.forEach(widget => {
    if (widget instanceof MarkdownCell) {
      const cell = widget;
      const renderedArea = cell.node.querySelector('.jp-RenderedMarkdown') || cell.node.querySelector('.jp-MarkdownOutput');
      if (!renderedArea) return;

      // 1. Tabellen mit "Tabelle bearbeiten"-Button versehen
      renderedArea.querySelectorAll('table:not(.obsidian-processed)').forEach(table => {
        table.classList.add('obsidian-processed');
        const wrapper = document.createElement('div');
        wrapper.className = 'obsidian-table-wrapper';
        table.parentNode?.insertBefore(wrapper, table);
        wrapper.appendChild(table);

        const editBtn = document.createElement('button');
        editBtn.className = 'obsidian-table-edit-btn';
        editBtn.innerHTML = '✏️ Tabelle bearbeiten';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const src = cell.model.sharedModel.getSource();
          const tablesInSrc = extractAllMarkdownTables(src);
          openTableEditorModal(cell, tablesInSrc[0]);
        });
        wrapper.appendChild(editBtn);
      });

      // 2. Block-Formeln (.katex-display, div.jp-RenderedMath) mit prominentem "Formel bearbeiten"-Button versehen
      renderedArea.querySelectorAll('.katex-display:not(.obsidian-processed), .jp-RenderedMath:not(p .jp-RenderedMath):not(.obsidian-processed)').forEach(displayMathEl => {
        displayMathEl.classList.add('obsidian-processed');

        const annotation = displayMathEl.querySelector('annotation[encoding="application/x-tex"]') || displayMathEl.querySelector('annotation');
        const exactLatex = annotation ? annotation.textContent?.trim() || '' : displayMathEl.textContent?.trim() || '';

        const wrapper = document.createElement('div');
        wrapper.className = 'obsidian-math-block-wrapper';
        displayMathEl.parentNode?.insertBefore(wrapper, displayMathEl);
        wrapper.appendChild(displayMathEl);

        const editBtn = document.createElement('button');
        editBtn.className = 'obsidian-math-edit-btn';
        editBtn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 7V4H6l6 8-6 8h12v-3"/></svg>
          <span>Formel bearbeiten</span>
        `;

        const openHandler = (e: Event) => {
          e.stopPropagation();
          const src = cell.model.sharedModel.getSource();
          const matchedFormula = findFormulaInSource(src, exactLatex, true);
          openMathEditorModal(cell, matchedFormula || undefined, exactLatex, true);
        };

        editBtn.addEventListener('click', openHandler);
        wrapper.addEventListener('click', openHandler);
        wrapper.appendChild(editBtn);
      });

      // 3. Inline-Formeln (.katex, span.jp-RenderedMath) mit Edit-Badge versehen
      renderedArea.querySelectorAll('.katex:not(.katex-display .katex):not(.obsidian-processed), span.jp-RenderedMath:not(.obsidian-processed)').forEach(inlineMathEl => {
        inlineMathEl.classList.add('obsidian-processed');

        const annotation = inlineMathEl.querySelector('annotation[encoding="application/x-tex"]') || inlineMathEl.querySelector('annotation');
        const exactLatex = annotation ? annotation.textContent?.trim() || '' : inlineMathEl.textContent?.trim() || '';

        const wrapper = document.createElement('span');
        wrapper.className = 'obsidian-inline-math-wrapper';
        wrapper.title = `Formel bearbeiten ($${exactLatex}$)`;
        inlineMathEl.parentNode?.insertBefore(wrapper, inlineMathEl);
        wrapper.appendChild(inlineMathEl);

        const editBadge = document.createElement('span');
        editBadge.className = 'obsidian-inline-edit-btn';
        editBadge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 7V4H6l6 8-6 8h12v-3"/></svg>`;
        wrapper.appendChild(editBadge);

        wrapper.addEventListener('click', (e) => {
          e.stopPropagation();
          const src = cell.model.sharedModel.getSource();
          const matchedFormula = findFormulaInSource(src, exactLatex, false);
          openMathEditorModal(cell, matchedFormula || undefined, exactLatex, false);
        });
      });

      // 4. Obsidian Callouts stylen
      renderedArea.querySelectorAll('blockquote:not(.obsidian-callout)').forEach(bq => {
        const p = bq.querySelector('p');
        if (!p) return;
        const match = p.innerHTML.match(/^\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT|INFO|DANGER)\](.*)/i);
        if (match) {
          const type = match[1].toUpperCase();
          const title = match[2].trim() || type;
          bq.classList.add('obsidian-callout', `obsidian-callout-${type.toLowerCase()}`);
          p.innerHTML = `<div class="obsidian-callout-header"><span class="obsidian-callout-badge">${type}</span> <strong>${title}</strong></div>` + p.innerHTML.replace(/^\[!.*?\]/, '');
        }
      });
    }
  });
}