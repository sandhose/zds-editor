/**
 * Dummy adapter for testing
 */
class DummyAdapter {
  constructor() {}

  /**
   * Called when the editor's options are changed
   * @param {object} options
   */
  setOptions() {}

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
   * @param {Range} range
   * @return {string}
   */
  getRange() {
    return '';
  }

  /**
   * Replace the range by a given string
   * @param {string} replacement
   * @param {Range} range
   */
  replaceRange() {}

  /**
   * Set the selection(s)
   * @param {...(Pos|Range)} selections
   */
  setSelection() {}

  /**
   * Get line's content
   * @param {number} line
   * @return {string}
   */
  getLine() {
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
    if (!this.wrapper) {
      this.wrapper = document.createElement('div');
    }
    return this.wrapper;
  }

  /**
   * Event passthrough
   * @param {Event} event
   * @param {function} callback
   */
  on() {}
}

export default DummyAdapter;
