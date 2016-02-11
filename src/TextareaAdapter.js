import { Pos, Range } from './util';

/**
 * Adapter to use a standard textarea element
 * @class
 * @implements {GenericAdapter}
 */
class TextareaAdapter {
  /**
   * @constructor
   * @param {HTMLTextAreaElement} textarea
   */
  constructor(textarea) {
    if (!textarea) throw new Error('No textarea provided');

    /** @type {HTMLTextAreaElement} */
    this.textarea = textarea;
  }

  setOptions() {}

  /**
   * Get the text inside the textarea
   * @return {string[]}
   */
  getText() {
    return this.textarea.value.split('\n');
  }

  /**
   * Get the position for a given index
   * @param {number} index
   * @return {Pos}
   */
  getPosFromIndex(index) {
    const text = this.getText();
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
    const text = this.getText();
    let n = 0;
    for (let i = 0; i < pos.line; i++) {
      n += text[i].length + 1;
    }
    return n + pos.ch;
  }

  listSelections() {
    return [new Range(
      this.getPosFromIndex(this.textarea.selectionStart),
      this.getPosFromIndex(this.textarea.selectionEnd)
    )];
  }

  focus() {
    this.textarea.focus();
  }

  getRange(range) {
    const text = this.getText().slice(range.start.line, range.end.line + 1);
    text[text.length - 1] = text[text.length - 1].substring(0, range.end.ch);
    text[0] = text[0].substring(range.start.ch);
    return text.join('\n');
  }

  replaceRange(replacement, range) {
    const startIndex = this.getIndexFromPos(range.start);
    const endIndex = this.getIndexFromPos(range.end);
    const rawText = this.textarea.value;
    this.textarea.value = rawText.substring(0, startIndex)
      + replacement + rawText.substring(endIndex);
  }

  setSelection(range) {
    this.textarea.setSelectionRange(
      this.getIndexFromPos(range.start),
      this.getIndexFromPos(range.end)
    );
  }

  getLine(line) {
    return this.getText()[line];
  }

  lock() {
    this.textarea.disabled = true;
  }

  unlock() {
    this.textarea.disabled = false;
  }

  getWrapperElement() {
    return this.textarea;
  }

  on(event, callback, ...args) {
    return this.textarea.addEventListener(event, callback, ...args);
  }
}

export default TextareaAdapter;
