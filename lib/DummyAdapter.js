/**
 * Dummy adapter for testing
 */
class DummyAdapter {
  constructor() {
    if(new.target === DummyAdapter)
      this.wrapper = document.createElement('div');
  }

  /**
   * Called when the editor's options are changed
   * @param {object} options
   */
  setOptions(options) {}

  /**
   * Get the curent selections
   * @return {Range[]}
   */
  listSelections() {
    return [];
  }

  /**
   * Focus the editor
   */
  focus() {}

  /**
   * Return the text in range
   * @param {Range} range
   * @return {string}
   */
  getRange(range) {
    return '';
  }

  /**
   * Replace the range by a given string
   * @param {string} replacement
   * @param {Range} range
   */
  replaceRange(replacement, range) {}

  /**
   * Set the selection(s)
   * @param {...(Pos|Range)} selections
   */
  setSelection(...selections) {}

  /**
   * Get line's content
   * @param {number} line
   * @return {string}
   */
  getLine(line) {
    return '';
  }

  /**
   * Lock the editor
   */
  lock() {}

  /**
   * Unlock the editor
   */
  unlock() {}

  /**
   * Get the wrapper element
   * @return {DOMNode}
   */
  getWrapperElement() {
    return this.wrapper;
  }

  /**
   * Event passthrough
   * @param {Event} event
   * @param {function} callback
   */
  on(event, callback, ...args) {}
};

export default DummyAdapter;
