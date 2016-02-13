/**
 * Adapter that does nothing (used for testing & extending)
 * @interface
 */
class GenericAdapter {
  /**
   * @constructor
   */
  constructor() {
    this.text = '';
  }

  /**
   * Called when the adapter is attached
   */
  attach() {}

  /**
   * Called when the toolbar is changed
   * @abstract
   * @param {Map.<string, object>} toolbar
   */
  setToolbar() {}

  /**
   * Called when the keymaps are changed
   * @abstract
   * @param {Map.<string, object>} keymaps
   */
  setKeymaps() {}

  /**
   * Get the curent selections
   * @abstract
   * @return {Range[]}
   */
  listSelections() {
    return [];
  }

  /**
   * Focus the editor
   * @abstract
   */
  focus() {}

  /**
   * Return the text in range
   * @abstract
   * @param {Range} range
   * @return {string}
   */
  getRange() {
    return '';
  }

  /**
   * Replace the range by a given string
   * @abstract
   * @param {string} replacement
   * @param {Range} range
   */
  replaceRange() {}

  /**
   * Set the selection(s)
   * @abstract
   * @param {...(Pos|Range)} selections
   */
  setSelection() {}

  /**
   * Get line's content
   * @abstract
   * @param {number} line
   * @return {string}
   */
  getLine() {
    return '';
  }

  /**
   * Set the current text
   * @param {string} text
   */
  setText(text) {
    this.text = text;
  }

  /**
   * Get the current text
   * @return {string}
   */
  getText() {
    return this.text;
  }

  /**
   * Lock the editor
   * @abstract
   */
  lock() {}

  /**
   * Unlock the editor
   * @abstract
   */
  unlock() {}

  /**
   * Event passthrough
   * @abstract
   * @param {Event} event
   * @param {function} callback
   */
  on() {}

  /**
   * Destroy the instance
   * @abstract
   */
  destroy() {}
}

module.exports = GenericAdapter;
