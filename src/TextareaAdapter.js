const { Pos, Range } = require('./util');
const keycode = require('keycode');
const { EventEmitter } = require('events');

/**
 * Adapter to use a standard textarea element
 * @class
 * @implements {GenericAdapter}
 * @extends {EventEmitter}
 */
class TextareaAdapter extends EventEmitter {
  /**
   * @constructor
   * @param {HTMLTextAreaElement} textarea
   */
  constructor(textarea) {
    if (!textarea || textarea.nodeName !== 'TEXTAREA') throw new Error('No textarea provided');
    super();

    /** @type {HTMLTextAreaElement} */
    this.textareaNode = textarea;
    /** @type {HTMLTextAreaElement} */
    this.toolbarNode = document.createElement('div');
    /** @type {HTMLDivElement} */
    this.wrapperNode = document.createElement('div');
  }

  /**
   * Called when the adapter is attached to the editor
   */
  attach() {
    if (this.textareaNode.parentNode) {
      this.textareaNode.parentNode.insertBefore(this.wrapperNode, this.textareaNode);
    }
    this.wrapperNode.appendChild(this.toolbarNode);
    this.wrapperNode.appendChild(this.textareaNode);

    this.textareaNode.addEventListener('keydown', e => this.handleKeydown(e));
    this.textareaNode.addEventListener('paste', e => this.emit('paste', e));
    this.textareaNode.addEventListener('drop', e => this.emit('drop', e));
  }

  /**
   * Called when the toolbar is changed
   * @param {Map.<string, object>} toolbar
   */
  setToolbar(toolbar) {
    this.toolbarNode.innerHTML = '';
    for (const [name, action] of toolbar) {
      const button = document.createElement('button');
      button.innerHTML = name;
      button.addEventListener('click', () => this.emit('action', action));
      this.toolbarNode.appendChild(button);
    }
  }

  /**
   * Called when the keymap is changed
   * @param {Map.<string, object>} keymap
   */
  setKeymap(keymap) {
    this.keymap = keymap;
  }

  /**
   * Handle a keydown event
   * @param {KeyboardEvent} event
   */
  handleKeydown(event) {
    let keyStr = '';
    const modifiers = [
      { name: 'Cmd', key: 'metaKey' },
      { name: 'Ctrl', key: 'ctrlKey' },
      { name: 'Shift', key: 'shiftKey' },
      { name: 'Alt', key: 'altKey' },
    ];

    for (const { name, key } of modifiers) {
      if (event[key]) keyStr += `${name}-`;
    }

    const k = keycode(event);
    if (k) keyStr += k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();

    if (this.keymap.has(keyStr)) {
      event.preventDefault();
      const action = this.keymap.get(keyStr);
      if (typeof action === 'function') action();
      else this.emit('action', action);
    }
  }

  /**
   * Get the text inside the textarea
   * @return {string[]}
   */
  getLines() {
    return this.textareaNode.value.split('\n');
  }

  /**
   * Get the position for a given index
   * @param {number} index
   * @return {Pos}
   */
  getPosFromIndex(index) {
    const text = this.getLines();
    let charsBefore = 0;
    for (const i in text) {
      if (charsBefore + text[i].length + 1 > index) {
        return new Pos({
          line: parseInt(i, 10),
          ch: index - charsBefore,
        });
      }

      charsBefore += text[i].length + 1;
    }

    return new Pos({
      line: text.length - 1,
      ch: text[text.length - 1].length - 1,
    });
  }


  /**
   * Get the index for a given position
   * @param {Pos} pos
   * @return {number}
   */
  getIndexFromPos(pos) {
    const text = this.getLines();
    let n = 0;
    for (let i = 0; i < pos.line; i++) {
      n += text[i].length + 1;
    }
    return n + pos.ch;
  }

  listSelections() {
    return [new Range(
      this.getPosFromIndex(this.textareaNode.selectionStart || 0),
      this.getPosFromIndex(this.textareaNode.selectionEnd || 0)
    )];
  }

  focus() {
    this.textareaNode.focus();
  }

  getRange(range) {
    const text = this.getLines().slice(range.start.line, range.end.line + 1);
    text[text.length - 1] = text[text.length - 1].substring(0, range.end.ch);
    text[0] = text[0].substring(range.start.ch);
    return text.join('\n');
  }

  replaceRange(replacement, range) {
    if (document.queryCommandEnabled('insertText')) {
      this.setSelection(range);
      this.focus();
      document.execCommand('insertText', false, replacement);
    } else {
      const startIndex = this.getIndexFromPos(range.start);
      const endIndex = this.getIndexFromPos(range.end);
      const rawText = this.textareaNode.value;
      this.textareaNode.value = rawText.substring(0, startIndex)
        + replacement + rawText.substring(endIndex);
    }
  }

  setSelection(range) {
    this.textareaNode.setSelectionRange(
      this.getIndexFromPos(range.start),
      this.getIndexFromPos(range.end)
    );
  }

  getLine(line) {
    return this.getLines()[line];
  }

  getText() {
    return this.textareaNode.value;
  }

  setText(text) {
    this.textareaNode.value = text;
  }

  lock() {
    this.textareaNode.disabled = true;
  }

  unlock() {
    this.textareaNode.disabled = false;
  }

  /**
   * Destroy the instance
   */
  destroy() {
    this.removeAllListeners();

    this.wrapperNode.removeChild(this.textareaNode);
    this.wrapperNode.removeChild(this.toolbarNode);
    if (this.wrapperNode.parentNode) {
      this.wrapperNode.parentNode.insertBefore(this.textareaNode, this.wrapperNode);
      this.wrapperNode.parentNode.removeChild(this.wrapperNode);
    }

    delete this.toolbarNode;
    delete this.wrapperNode;
  }
}

module.exports = TextareaAdapter;
