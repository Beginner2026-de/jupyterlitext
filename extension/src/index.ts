import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { MarkdownCell } from '@jupyterlab/cells';

/**
 * Obsidian Live Markdown Extension for JupyterLite
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlite-obsidian-markdown:plugin',
  description: 'Obsidian Markdown Toolbar, Math, Tables, and Callouts for JupyterLite',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (_app: JupyterFrontEnd, tracker: INotebookTracker) => {
    console.log('JupyterLite Obsidian Markdown Extension aktiviert!');

    // CSS-Stile direkt im Dokument verankern
    injectStyles();

    // Sichtbare Benachrichtigung beim Start anzeigen
    showObsidianToast('💎 Obsidian Markdown Extension aktiv!');

    tracker.widgetAdded.connect((_, notebookPanel: NotebookPanel) => {
      // Wenn der Nutzer in eine Zelle klickt:
      notebookPanel.content.activeCellChanged.connect((_, cell) => {
        // Alte schwebende Toolbars entfernen
        document.querySelectorAll('.obsidian-floating-toolbar').forEach(el => el.remove());

        if (cell instanceof MarkdownCell) {
          attachObsidianToolbar(cell);
        }
      });

      // Beim Rendern von Zellen Obsidian-Callouts stylen
      notebookPanel.content.model?.cells.changed.connect(() => {
        transformCallouts(notebookPanel);
      });
      setTimeout(() => transformCallouts(notebookPanel), 800);
    });
  }
};

/**
 * Verankert alle Stylesheets direkt im DOM
 */
function injectStyles(): void {
  if (document.getElementById('obsidian-extension-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'obsidian-extension-styles';
  styleEl.textContent = `
    .obsidian-floating-toolbar {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4px 8px;
      margin-bottom: 6px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
      z-index: 20;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .obsidian-tb-brand {
      font-size: 11px;
      font-weight: 700;
      color: #7c3aed;
      padding: 2px 6px;
      background: #f3e8ff;
      border-radius: 4px;
    }
    .obsidian-tb-divider {
      width: 1px;
      height: 18px;
      background: #cbd5e1;
      margin: 0 4px;
    }
    .obsidian-tb-btn {
      background: transparent;
      border: 1px solid transparent;
      border-radius: 4px;
      padding: 3px 8px;
      font-size: 12px;
      color: #334155;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .obsidian-tb-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #0f172a;
    }
    .obsidian-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    }
    .obsidian-modal {
      background: #ffffff;
      border-radius: 10px;
      width: 90%;
      max-width: 520px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25);
      border: 1px solid #e2e8f0;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .obsidian-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .obsidian-modal-header h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
    }
    .obsidian-modal-close {
      background: none;
      border: none;
      font-size: 22px;
      cursor: pointer;
      color: #64748b;
      line-height: 1;
    }
    .obsidian-modal-body {
      padding: 16px 18px;
    }
    .obsidian-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 18px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    .obsidian-math-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0 12px 0;
    }
    .obsidian-math-chips button {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .obsidian-math-chips button:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
    }
    .obsidian-input {
      width: 100%;
      box-sizing: border-box;
      padding: 8px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-family: monospace;
      font-size: 13px;
      margin-bottom: 10px;
    }
    .obsidian-btn-primary {
      background: #7c3aed;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .obsidian-btn-primary:hover {
      background: #6d28d9;
    }
    .obsidian-btn-secondary {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    }
    .obsidian-callout-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .obsidian-callout-list button {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13px;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .obsidian-callout-list button:hover {
      background: #f1f5f9;
    }
    .obsidian-callout {
      border-left: 4px solid #3b82f6 !important;
      background: rgba(59, 130, 246, 0.08) !important;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px !important;
      margin: 12px 0 !important;
    }
    .obsidian-callout-tip {
      border-left-color: #10b981 !important;
      background: rgba(16, 185, 129, 0.08) !important;
    }
    .obsidian-callout-warning {
      border-left-color: #f59e0b !important;
      background: rgba(245, 158, 11, 0.08) !important;
    }
    .obsidian-callout-caution, .obsidian-callout-danger {
      border-left-color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.08) !important;
    }
    .obsidian-callout-important {
      border-left-color: #8b5cf6 !important;
      background: rgba(139, 92, 246, 0.08) !important;
    }
    .obsidian-callout-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.06);
      margin-right: 6px;
    }
    .obsidian-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1e1b4b;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
      z-index: 999999;
      font-size: 13px;
      font-weight: 500;
      transition: opacity 0.3s ease;
    }
    .obsidian-toast-fade {
      opacity: 0;
    }
  `;
  document.head.appendChild(styleEl);
}

/**
 * Zeigt einen Toast-Hinweis unten rechts an
 */
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

/**
 * Hängt eine Obsidian-Toolbar direkt über die aktive Markdown-Zelle
 */
function attachObsidianToolbar(cell: MarkdownCell): void {
  cell.node.classList.add('obsidian-markdown-cell');

  const editorNode = cell.node.querySelector('.jp-Cell-inputArea') || cell.node;
  if (!editorNode) return;

  const toolbar = document.createElement('div');
  toolbar.className = 'obsidian-floating-toolbar';

  toolbar.innerHTML = `
    <div class="obsidian-tb-brand">💎 Obsidian</div>
    <div class="obsidian-tb-divider"></div>
    <button class="obsidian-tb-btn" title="Fett (Strg+B)" data-action="bold"><b>B</b></button>
    <button class="obsidian-tb-btn" title="Kursiv (Strg+I)" data-action="italic"><i>I</i></button>
    <button class="obsidian-tb-btn" title="Inline-Code" data-action="code">&lt;/&gt;</button>
    <div class="obsidian-tb-divider"></div>
    <button class="obsidian-tb-btn" title="LaTeX Formel einfügen" data-action="math">🧮 Formel</button>
    <button class="obsidian-tb-btn" title="Tabelle einfügen" data-action="table">📊 Tabelle</button>
    <button class="obsidian-tb-btn" title="Obsidian Callout (Hinweisbox)" data-action="callout">💡 Callout</button>
    <div class="obsidian-tb-divider"></div>
    <button class="obsidian-tb-btn" title="Zelle ausführen / rendern" data-action="render">▶ Rendern</button>
  `;

  toolbar.querySelectorAll('button').forEach(btn => {
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
    case 'bold':
      insertAroundSelection(cell, '**', '**', 'fetter Text');
      break;
    case 'italic':
      insertAroundSelection(cell, '*', '*', 'kursiver Text');
      break;
    case 'code':
      insertAroundSelection(cell, '`', '`', 'code');
      break;
    case 'math':
      openMathDialog(cell);
      break;
    case 'table':
      openTableDialog(cell);
      break;
    case 'callout':
      openCalloutMenu(cell);
      break;
    case 'render':
      cell.rendered = true;
      break;
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

function openMathDialog(cell: MarkdownCell): void {
  const dialog = document.createElement('div');
  dialog.className = 'obsidian-modal-overlay';
  dialog.innerHTML = `
    <div class="obsidian-modal">
      <div class="obsidian-modal-header">
        <h3>🧮 LaTeX / KaTeX Formel einfügen</h3>
        <button class="obsidian-modal-close">&times;</button>
      </div>
      <div class="obsidian-modal-body">
        <label style="font-size: 12px; color: #475569; display: block; margin-bottom: 6px;">Wählen Sie eine Vorlage oder tippen Sie LaTeX:</label>
        <div class="obsidian-math-chips">
          <button data-tex="\\frac{a}{b}">Bruch (\\frac{a}{b})</button>
          <button data-tex="x^2 + y^2 = r^2">Potenz (x^2)</button>
          <button data-tex="\\sqrt{x}">Wurzel (\\sqrt{x})</button>
          <button data-tex="\\sum_{i=1}^{n} x_i">Summe (\\sum)</button>
          <button data-tex="\\int_{a}^{b} f(x) dx">Integral (\\int)</button>
          <button data-tex="\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}">Matrix</button>
        </div>
        <textarea id="obsidian-math-input" class="obsidian-input" rows="3">\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}</textarea>
        <div class="obsidian-math-type" style="display: flex; gap: 1rem; font-size: 13px; margin-top: 6px;">
          <label><input type="radio" name="math-mode" value="inline"> Im Fließtext ($...$)</label>
          <label><input type="radio" name="math-mode" value="block" checked> Eigene Zeile ($$...$$)</label>
        </div>
      </div>
      <div class="obsidian-modal-footer">
        <button class="obsidian-btn-secondary" id="obsidian-cancel">Abbrechen</button>
        <button class="obsidian-btn-primary" id="obsidian-insert">In Zelle einfügen</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  dialog.querySelectorAll('.obsidian-math-chips button').forEach(chip => {
    chip.addEventListener('click', () => {
      const tex = chip.getAttribute('data-tex');
      const input = dialog.querySelector('#obsidian-math-input') as HTMLTextAreaElement;
      if (tex && input) input.value = tex;
    });
  });

  const close = () => dialog.remove();
  dialog.querySelector('.obsidian-modal-close')?.addEventListener('click', close);
  dialog.querySelector('#obsidian-cancel')?.addEventListener('click', close);

  dialog.querySelector('#obsidian-insert')?.addEventListener('click', () => {
    const input = dialog.querySelector('#obsidian-math-input') as HTMLTextAreaElement;
    const isBlock = (dialog.querySelector('input[name="math-mode"]:checked') as HTMLInputElement)?.value === 'block';
    const tex = input?.value || '';
    const formatted = isBlock ? `\n$$\n${tex}\n$$\n` : `$${tex}$`;
    insertAroundSelection(cell, '', '', formatted);
    close();
  });
}

function openTableDialog(cell: MarkdownCell): void {
  const dialog = document.createElement('div');
  dialog.className = 'obsidian-modal-overlay';
  dialog.innerHTML = `
    <div class="obsidian-modal">
      <div class="obsidian-modal-header">
        <h3>📊 Markdown-Tabelle einfügen</h3>
        <button class="obsidian-modal-close">&times;</button>
      </div>
      <div class="obsidian-modal-body">
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
          <label style="font-size: 13px;">Spalten: <input type="number" id="obsidian-cols" value="3" min="1" max="8" style="width: 60px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px;"></label>
          <label style="font-size: 13px;">Zeilen: <input type="number" id="obsidian-rows" value="3" min="1" max="15" style="width: 60px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px;"></label>
        </div>
      </div>
      <div class="obsidian-modal-footer">
        <button class="obsidian-btn-secondary" id="obsidian-cancel">Abbrechen</button>
        <button class="obsidian-btn-primary" id="obsidian-insert">Tabelle einfügen</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const close = () => dialog.remove();
  dialog.querySelector('.obsidian-modal-close')?.addEventListener('click', close);
  dialog.querySelector('#obsidian-cancel')?.addEventListener('click', close);

  dialog.querySelector('#obsidian-insert')?.addEventListener('click', () => {
    const cols = parseInt((dialog.querySelector('#obsidian-cols') as HTMLInputElement)?.value || '3', 10);
    const rows = parseInt((dialog.querySelector('#obsidian-rows') as HTMLInputElement)?.value || '3', 10);

    let md = '\n|';
    for (let c = 1; c <= cols; c++) md += ` Spalte ${c} |`;
    md += '\n|';
    for (let c = 1; c <= cols; c++) md += ' --- |';
    for (let r = 1; r <= rows; r++) {
      md += '\n|';
      for (let c = 1; c <= cols; c++) md += ` Wert ${r},${c} |`;
    }
    md += '\n\n';

    insertAroundSelection(cell, '', '', md);
    close();
  });
}

function openCalloutMenu(cell: MarkdownCell): void {
  const dialog = document.createElement('div');
  dialog.className = 'obsidian-modal-overlay';
  dialog.innerHTML = `
    <div class="obsidian-modal" style="max-width: 420px;">
      <div class="obsidian-modal-header">
        <h3>💡 Obsidian Callout wählen</h3>
        <button class="obsidian-modal-close">&times;</button>
      </div>
      <div class="obsidian-modal-body">
        <div class="obsidian-callout-list">
          <button data-type="NOTE" style="border-left: 4px solid #3b82f6;">ℹ️ [!NOTE] - Notiz / Information</button>
          <button data-type="TIP" style="border-left: 4px solid #10b981;">💡 [!TIP] - Tipp / Empfehlung</button>
          <button data-type="WARNING" style="border-left: 4px solid #f59e0b;">⚠️ [!WARNING] - Warnung</button>
          <button data-type="CAUTION" style="border-left: 4px solid #ef4444;">🚨 [!CAUTION] - Wichtig / Gefahr</button>
          <button data-type="IMPORTANT" style="border-left: 4px solid #8b5cf6;">📌 [!IMPORTANT] - Wichtiger Hinweis</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const close = () => dialog.remove();
  dialog.querySelector('.obsidian-modal-close')?.addEventListener('click', close);

  dialog.querySelectorAll('.obsidian-callout-list button').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type') || 'NOTE';
      const calloutText = `\n> [!${type}] Titel hier eintragen\n> Text oder Erklärung hier eingeben.\n\n`;
      insertAroundSelection(cell, '', '', calloutText);
      close();
    });
  });
}

function transformCallouts(notebookPanel: NotebookPanel): void {
  const node = notebookPanel.node;
  const blockquotes = node.querySelectorAll('.jp-RenderedMarkdown blockquote');

  blockquotes.forEach((bq) => {
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

export default extension;