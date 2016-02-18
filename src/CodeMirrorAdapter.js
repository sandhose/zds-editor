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
    if (!textarea || textarea.nodeName !== 'TEXTAREA') throw new Error('No textarea provided');
    super();

    /** @type {HTMLTextAreaElement} */
    this.textareaNode = textarea;
    /** @type {HTMLDivElement} */
    this.toolbarNode = document.createElement('div');
    /** @type {HTMLDivElement} */
    this.wrapperNode = document.createElement('div');
    this.wrapperNode.appendChild(this.toolbarNode);

    this.wrapperNode.className = 'editor-wrapper editor-codemirror-adapter';
    this.toolbarNode.className = 'editor-toolbar';

    this.options = options;
  }

  /**
   * Called when the adapter is attached
   */
  attach() {
    if (this.textareaNode.parentNode) {
      this.textareaNode.parentNode.insertBefore(this.wrapperNode, this.textareaNode.nextSibling);
    }
    this.wrapperNode.appendChild(this.textareaNode);

    this.cm = codemirror.fromTextArea(this.textareaNode, Object.assign({
      mode: {
        name: 'gfm',
        gitHubSpice: false,
      },
      tabMode: 'indent',
      lineWrapping: true,
    }, this.options.codemirror));

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
      button.className = `editor-button editor-button-${name}`;
      button.addEventListener('click', () => this.emit('action', action));
      this.toolbarNode.appendChild(button);
    }
  }

  /**
   * Called when the keymap is changed
   * @param {Map.<string, object>} keymap
   */
  setKeymap(keymap) {
    const cmKeymap = { fallthrough: 'default' };
    const handler = action => () => {
      if (typeof action === 'function') {
        const result = action.call();
        if (result === false) return codemirror.Pass;
      } else {
        this.emit('action', action);
      }
    };

    for (const [key, action] of keymap) {
      cmKeymap[key] = handler(action);
      // Remove default key behaviour
      // Useful for keeping tab default behaviour
      if (codemirror.keyMap.basic[key]) {
        codemirror.keyMap.basic[key] = false;
      }
    }

    codemirror.normalizeKeyMap(cmKeymap);
    codemirror.keyMap['zds-editor'] = cmKeymap;
    this.cm.setOption('keyMap', 'zds-editor');
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

  getText() {
    return this.cm.doc.getValue();
  }

  setText(text) {
    this.cm.doc.setValue(text);
    this.cm.save();
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
    this.cm.toTextArea();

    this.wrapperNode.removeChild(this.toolbarNode);
    if (this.wrapperNode.parentNode) {
      this.wrapperNode.parentNode.insertBefore(this.textareaNode, this.wrapperNode.nextSibling);
      this.wrapperNode.parentNode.removeChild(this.wrapperNode);
    }

    delete this.toolbarNode;
    delete this.wrapperNode;
  }
}

module.exports = CodeMirrorAdapter;
