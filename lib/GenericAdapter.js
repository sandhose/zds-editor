/**
 * Adapter that does nothing (used for testing & extending)
 * @interface
 */
class GenericAdapter {
  /**
   * @constructor
   */
  constructor() {}

  /**
   * Called when the editor's options are changed
   * @abstract
   * @param {object} options
   */
  setOptions() {}

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
   * Get the wrapper element
   * @abstract
   * @return {DOMNode}
   */
  getWrapperElement() {
    if (!this.wrapper) {
      this.wrapper = document.createElement('div');
    }
    return this.wrapper;
  }

  /**
   * Event passthrough
   * @abstract
   * @param {Event} event
   * @param {function} callback
   */
  on() {}
}

export default GenericAdapter;
