require('codemirror/mode/gfm/gfm');
const codemirror = require('codemirror');
const { Range } = require('./util');
const { EventEmitter } = require('events');

/**
 * Adapter to use CodeMirror for the editor
 * @class
 * @implements {GenericAdapter}
 */
class CodeMirrorAdapter extends EventEmitter {
  constructor(textarea, options = { codemirror: {} }) {
    if (!textarea) throw new Error('No textarea provided');
    super();

    this.cm = codemirror.fromTextArea(textarea, Object.assign({
      mode: {
        name: 'gfm',
        gitHubSpice: false,
      },
      tabMode: 'indent',
      lineWrapping: true,
    }, options.codemirror));

    /** @type {HTMLTextAreaElement} */
    this.toolbarNode = document.createElement('div');
    /** @type {HTMLDivElement} */
    this.wrapperNode = document.createElement('div');

    const cmWrapper = this.cm.getWrapperElement();
    if (cmWrapper.parentNode) {
      cmWrapper.parentNode.insertBefore(this.wrapperNode, cmWrapper);
    }
    this.wrapperNode.appendChild(this.toolbarNode);
    this.wrapperNode.appendChild(cmWrapper);

    this.cm.on('paste', (cm, e) => this.emit('paste', e));
    this.cm.on('drop', (cm, e) => this.emit('drop', e));
  }

  /**
   * Called when the toolbar is changed
   * @param {Map.<string, object>} toolbar
   */
  setToolbar(toolbar) {
    this.toolbarNode.innerHTML = '';
    for (const [name, action] of toolbar) {
      const button = document.createElement('button');
      button.innerText = name;
      button.addEventListener('click', () => this.emit('action', action));
      this.toolbarNode.appendChild(button);
    }
  }

  /**
   * Called when the keymaps are changed
   * @param {Map.<string, object>} keymaps
   */
  setKeymaps(keymaps) {
    const cmKeymaps = {};
    for (const [key, action] of keymaps) {
      cmKeymaps[key] = () => this.emit('action', action);
    }
    this.cm.setOption('extraKeys', cmKeymaps);
  }

  listSelections() {
    return this.cm.listSelections().map(Range.fromCmRange);
  }

  focus() {
    this.cm.focus();
  }

  getRange(range) {
    return this.cm.getRange(range.start, range.end);
  }

  replaceRange(replacement, range) {
    this.cm.replaceRange(replacement, range.start, range.end);
  }

  setSelection(...selections) {
    const _selections = selections.map(sel => {
      if (sel.hasOwnProperty('start')) {
        return { anchor: sel.start, head: sel.end };
      }
      return { anchor: sel };
    });

    this.cm.setSelections(_selections);
  }

  getLine(line) {
    return this.cm.doc.getLine(line);
  }

  lock() {
    this.cm.setOption('readOnly', true);
  }

  unlock() {
    this.cm.setOption('readOnly', false);
  }

  /**
   * Destroy the instance
   */
  destroy() {
    this.removeAllListeners();
    this.toolbarNode.remove();
    this.wrapperNode.remove();

    delete this.toolbarNode;
    delete this.wrapperNode;
  }
}

module.exports = CodeMirrorAdapter;
