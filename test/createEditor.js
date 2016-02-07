'use strict';

import test from 'tape';
import Editor from '../lib/Editor.js';

/**
 * Create an editor instance
 * @param {object} options - Options to pass to the Editor constructor
 * @return {Editor}
 */
const createEditor = options => {
  const textarea = document.createElement('textarea');
  const wrapper = document.createElement('wrapper');
  wrapper.appendChild(textarea);
  return new Editor(textarea, options);
};

/**
 * Destroy an editor instance
 * @param {Editor} editor
 */
const destroyEditor = editor => {
  editor.cm.getWrapperElement().parentNode.remove();
};

export { createEditor, destroyEditor };

test('Editor#constructor', assert => {
  assert.plan(2);
  assert.throws(() => new Editor(), new Error('No textarea provided'),
                'throws an exception if no textarea provided');
  assert.doesNotThrow(createEditor, null, 'does not throw when a textarea is provided');
});
