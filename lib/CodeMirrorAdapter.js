require('codemirror/mode/gfm/gfm');
const codemirror = require('codemirror');
import { Pos, Range } from './util';
import DummyAdapter from './DummyAdapter.js';

/**
 * Adapter to use CodeMirror for the editor
 * @class
 * @extends DummyAdapter
 */
class CodeMirrorAdapter extends DummyAdapter {
  constructor(textarea, options) {
    super();
    if (!textarea) throw new Error('No textarea provided');

    this.cm = codemirror.fromTextArea(textarea, Object.assign({
      mode: {
        name: 'gfm',
        gitHubSpice: false,
      },
      tabMode: 'indent',
      lineWrapping: true,
    }, codemirror));
  }

  setOptions(options) {
    if(options.keymaps) {
      this.cm.setOption('extraKeys', options.keymaps);
    }
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
    let _selections = selections.map(sel => {
      if(sel.hasOwnProperty('start')) {
        return { anchor: sel.start, head: sel.end };
      } else {
        return { anchor: sel };
      }
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
    this.cm.setOptions('readOnly', false);
  }

  getWrapperElement() {
    return this.cm.getWrapperElement();
  }

  on(event, callback, ...args) {
    return this.cm.on(event, (cm, e) => callback(e), ...args);
  }
}

export default CodeMirrorAdapter;
